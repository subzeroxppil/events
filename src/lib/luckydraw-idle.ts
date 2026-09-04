/**
 * The shared idle timeline for the public view-only page.
 *
 * Every phone watching a draw must show the same names in the same order at
 * the same scroll position, whether it joined an hour ago or five seconds ago.
 * Two things make that true:
 *
 *  1. The idle reel is built once, on the server, from a seeded shuffle, and
 *     handed to every viewer verbatim — no client ever rolls its own order.
 *  2. The scroll position is a pure function of server time, not an
 *     accumulator that starts when a given phone happened to press Enter.
 */

/** Row height the shared timeline counts in, independent of screen size. */
export const IDLE_REFERENCE_ITEM_HEIGHT = 96;

/**
 * Where the shared timeline is pinned: at `atMs`, the reel was at row `index`.
 * Fractional values are meaningful — a spin comes to rest part-way through a
 * row, and dropping that would make the reel hop when drift resumes.
 */
export type IdleAnchor = {
  atMs: number;
  index: number;
};

/**
 * The reel drifts from the epoch by default, so two viewers who have never
 * seen a spin still agree.
 */
export const EPOCH_ANCHOR: IdleAnchor = { atMs: 0, index: 0 };

/** mulberry32 — small, fast, and identical for a given seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates driven by a seeded PRNG, so the order is reproducible. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The idle reel: the participant pool shuffled and repeated to `targetLength`.
 *
 * The same shape as `createExtendedList`, but deterministic — each repeat is
 * shuffled with a different derived seed so the list does not visibly loop.
 */
export function buildIdleList(
  participants: string[],
  seed: number,
  targetLength: number
): string[] {
  if (participants.length === 0) return [];
  const unique = Array.from(new Set(participants));
  const out: string[] = [];
  let round = 0;
  while (out.length < targetLength) {
    out.push(...seededShuffle(unique, seed + round * 0x9e3779b1));
    round++;
  }
  return out.slice(0, targetLength);
}

/**
 * Where the reel should be sitting right now.
 *
 * `index` is the row at the centre and is deliberately screen-independent —
 * it advances at `idleSpeed / IDLE_REFERENCE_ITEM_HEIGHT` rows per second on
 * every device, so a phone and a tablet centre the same name. `fraction` is
 * the sub-row progress, which each device multiplies by its own row height to
 * keep the motion smooth.
 */
export function idlePositionAt(
  serverNowMs: number,
  anchor: IdleAnchor,
  idleSpeed: number,
  itemsLength: number
): { index: number; fraction: number } {
  if (itemsLength <= 0) return { index: 0, fraction: 0 };

  const rowsPerSecond = idleSpeed / IDLE_REFERENCE_ITEM_HEIGHT;
  const elapsedSeconds = Math.max(0, (serverNowMs - anchor.atMs) / 1000);
  const rows = anchor.index + elapsedSeconds * rowsPerSecond;

  const whole = Math.floor(rows);
  return {
    index: ((whole % itemsLength) + itemsLength) % itemsLength,
    fraction: rows - whole,
  };
}
