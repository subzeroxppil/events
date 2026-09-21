import { prisma } from "@/lib/prisma";
import type { SpinPayload, Winner } from "@/lib/luckydraw-live";

/**
 * Fan-out hub for the view-only page's SSE streams.
 *
 * The admin's "Spin" POST and a viewer's open stream are separate HTTP
 * requests that are NOT guaranteed to be handled by the same server process:
 * this app deploys to Vercel (every route handler is its own serverless
 * invocation) as well as Cloud Run (which autoscales past one instance). So
 * the spin cannot simply be pushed into an in-memory map — it is written to
 * `events_portal_luckydraw.liveSpin` and each instance polls for it.
 *
 * This hub keeps that cheap: one poller per lucky draw per instance, shared by
 * every stream attached to it. A hundred phones on one instance is still a
 * handful of queries per second, not a hundred.
 */

type Listener = (event: string, data: unknown) => void;

/**
 * One attached stream, with its own idea of what it has already seen.
 *
 * The seen-marker is per subscriber rather than per room on purpose. It used
 * to be shared, and a viewer joining in the gap between the spin being written
 * and the room's next poll would drag the shared marker past that spin — so
 * the poll then decided it was old news and *every phone already watching*
 * missed it. Each subscriber now only ever suppresses its own replay.
 */
type Subscriber = {
  listener: Listener;
  seenSpinId: number;
};

type Room = {
  subscribers: Set<Subscriber>;
  timer: ReturnType<typeof setInterval> | null;
  /** Highest spin seen by the poller; only ever moved forward by a poll. */
  lastSpinId: number;
  /** Serialised winners list, to detect changes without re-sending. */
  lastWinnersKey: string;
  ticks: number;
  polling: boolean;
  /** Set once the draw goes offline, so we announce it exactly once. */
  offlineNotified: boolean;
};

const POLL_INTERVAL_MS = 300;
/** Winners change rarely (and only via the admin sheet) — poll them lazily. */
const WINNERS_EVERY_N_TICKS = 16;

const rooms = new Map<number, Room>();

export async function readWinners(luckydrawId: number): Promise<Winner[]> {
  const rows = await prisma.events_portal_luckydraw_winners.findMany({
    where: { luckydrawId },
    include: { events_portal_user: { select: { workId: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    workId: row.events_portal_user.workId,
    wonAt: row.createdAt.toISOString(),
  }));
}

function winnersKey(winners: Winner[]): string {
  return winners.map((w) => `${w.workId}@${w.wonAt}`).join("|");
}

async function poll(luckydrawId: number, room: Room) {
  // Ticks are 300ms apart but a query can take longer; never stack them up.
  if (room.polling) return;
  room.polling = true;

  try {
    const row = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawId },
      select: { viewOnlyEnabled: true, liveSpin: true, liveSpinAt: true },
    });

    // Toggled off mid-stream: tell viewers to drop back to the "not live"
    // screen rather than leaving them staring at a reel that never moves.
    if (!row || !row.viewOnlyEnabled) {
      if (!room.offlineNotified) {
        room.offlineNotified = true;
        emit(room, "offline", {});
      }
      return;
    }
    room.offlineNotified = false;

    const spinId = row.liveSpinAt ? row.liveSpinAt.getTime() : 0;
    if (spinId > room.lastSpinId && row.liveSpin) {
      room.lastSpinId = spinId;
      const payload = {
        ...(row.liveSpin as unknown as Omit<SpinPayload, "spinId">),
        spinId,
      };
      emitSpin(room, payload, spinId);
    }

    room.ticks += 1;
    if (room.ticks % WINNERS_EVERY_N_TICKS === 0) {
      const winners = await readWinners(luckydrawId);
      const key = winnersKey(winners);
      if (key !== room.lastWinnersKey) {
        room.lastWinnersKey = key;
        emit(room, "winners", { winners });
      }
    }
  } catch (error) {
    // A transient DB blip must not kill the room; the next tick retries.
    console.error(`live-hub poll failed for luckydraw ${luckydrawId}:`, error);
  } finally {
    room.polling = false;
  }
}

function emit(room: Room, event: string, data: unknown) {
  for (const sub of room.subscribers) {
    try {
      sub.listener(event, data);
    } catch {
      // A dead stream is removed by its own abort handler; ignore it here.
    }
  }
}

/**
 * Deliver a spin to everyone who has not already been handed it.
 *
 * A subscriber that connected after this spin was stamped already learned
 * about it from its own `init`, so it is skipped — but its arrival can no
 * longer hide the spin from anyone else.
 */
function emitSpin(room: Room, payload: unknown, spinId: number) {
  for (const sub of room.subscribers) {
    if (spinId <= sub.seenSpinId) continue;
    sub.seenSpinId = spinId;
    try {
      sub.listener("spin", payload);
    } catch {
      // A dead stream is removed by its own abort handler; ignore it here.
    }
  }
}

/**
 * Attach a listener. `seedSpinId` is the spin the caller has already seen (the
 * one handed to it in the `init` event), so a fresh viewer is never replayed a
 * spin that finished before it connected.
 *
 * Returns the unsubscribe function; it stops the poller when the last listener
 * of a room leaves.
 */
export function subscribe(
  luckydrawId: number,
  seedSpinId: number,
  seedWinners: Winner[],
  listener: Listener
): () => void {
  let room = rooms.get(luckydrawId);

  if (!room) {
    room = {
      subscribers: new Set(),
      timer: null,
      lastSpinId: seedSpinId,
      lastWinnersKey: winnersKey(seedWinners),
      ticks: 0,
      polling: false,
      offlineNotified: false,
    };
    rooms.set(luckydrawId, room);
  }

  // This viewer must not be replayed the spin its own `init` already carried —
  // but that is now recorded against this subscriber alone. Deliberately NOT
  // folded into `room.lastSpinId`: doing so let one late arrival suppress the
  // spin for every phone already attached to the room.
  const subscriber: Subscriber = { listener, seenSpinId: seedSpinId };
  room.subscribers.add(subscriber);

  if (!room.timer) {
    const current = room;
    current.timer = setInterval(() => {
      void poll(luckydrawId, current);
    }, POLL_INTERVAL_MS);
    // Don't hold the Node process open just for a poller.
    (current.timer as unknown as { unref?: () => void }).unref?.();
  }

  return () => {
    const active = rooms.get(luckydrawId);
    if (!active) return;
    active.subscribers.delete(subscriber);
    if (active.subscribers.size === 0) {
      if (active.timer) clearInterval(active.timer);
      rooms.delete(luckydrawId);
    }
  };
}
