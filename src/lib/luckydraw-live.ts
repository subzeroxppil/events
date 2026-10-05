import type { ViewSettings } from "@/lib/luckydraw-settings";

/**
 * How far ahead of the broadcast a spin is scheduled to start.
 *
 * The bus is not instant: the claim writes the row, `live-hub` notices it on
 * its next 300ms poll, and the SSE frame still has to reach the device. That
 * adds up to roughly 50-550ms, and — crucially — a *different* amount for
 * every screen. Delivering faster would not make two screens agree; only a
 * deadline does. So the spin carries the instant it is to begin, far enough
 * ahead that everyone has it in hand before the moment arrives.
 *
 * Deliberately a constant rather than a setting: it can only be tuned by
 * measuring the room it runs in, which nobody can do from the settings panel.
 */
export const SPIN_LEAD_MS = 700;

/**
 * Longest a spin may claim to last.
 *
 * `duration` arrives from the client and is what the server uses to decide
 * when the in-flight lock expires. Unbounded, one request carrying a silly
 * value — by accident or otherwise — would hold the lock for that long and no
 * admin could spin again until someone toggled the view-only link off and on.
 * The real spin is 13s; a minute is generous headroom and still self-heals.
 */
export const MAX_SPIN_DURATION_MS = 60_000;

/**
 * What the admin broadcasts the moment Spin is pressed. It carries the exact
 * reel and the exact target index, so every viewer reproduces the identical
 * animation without needing a shared random seed or synchronised clocks.
 */
export type SpinPayload = {
  /** `liveSpinAt` as epoch ms. Viewers ignore anything not strictly newer. */
  spinId: number;
  /**
   * Server-time instant the animation is to begin, as epoch ms. Every screen
   * schedules against this rather than against its own arrival time, which is
   * what makes the reels agree.
   *
   * Optional only for the rollout window: a payload stamped by the previous
   * build has no `startAt`, and a client that finds none falls back to
   * starting on arrival — unsynced, exactly as before, never wrong.
   */
  startAt?: number;
  spinnerItems: string[];
  winner: string;
  winnerIndex: number;
  /** Animate index 0 -> finalTarget (the random sub-item offset is folded in). */
  finalTarget: number;
  duration: number;
  easeExponent: number;
  /** The slow tease at the end; see `spinPosition`. Absent from older builds. */
  crawlRows?: number;
  crawlMs?: number;
  settings: ViewSettings;
};

/**
 * Where a spin stands relative to now, in server time.
 *
 * Every screen — the admin that triggered the spin and every viewer watching
 * it — resolves the reel through this one function, so the two code paths
 * cannot drift in timing.
 */
export type SpinProgress =
  | { phase: "pending"; waitMs: number }
  | { phase: "running"; elapsedMs: number }
  | { phase: "finished" };

export function resolveSpinProgress(
  spin: { startAt?: number; duration: number },
  serverNow: number
): SpinProgress {
  // No schedule (legacy payload): treat now as the start, i.e. today's
  // behaviour of animating from zero the moment it lands.
  if (typeof spin.startAt !== "number") return { phase: "running", elapsedMs: 0 };

  const elapsedMs = serverNow - spin.startAt;
  if (elapsedMs < 0) return { phase: "pending", waitMs: -elapsedMs };
  if (elapsedMs >= spin.duration) return { phase: "finished" };
  return { phase: "running", elapsedMs };
}

/** Granted by the server when an admin wins the claim on a spin. */
export type SpinClaimGranted = {
  spinId: number;
  startAt: number;
  /** The server's clock at the moment it answered, for offset estimation. */
  serverNow: number;
};

/** Returned when another admin already holds the spin. */
export type SpinClaimRejected = {
  message: string;
  /** The spin already in flight, so the loser can wait for it on the stream. */
  inFlightSpinId: number;
  /**
   * `"already-won"`: the proposed winner has already won while others in the
   * draw have not. `winners` is the server's list, to pick again from.
   */
  reason?: "already-won";
  winners?: Winner[];
};

export type Winner = {
  workId: string;
  wonAt: string;
};

/** First message on every SSE connection, so a fresh viewer can paint. */
export type InitEvent = {
  name: string;
  winners: Winner[];
  /**
   * The most recent spin, if there is one. Always flagged as a replay so a
   * late joiner shows the idle reel instead of jumping into a half-finished
   * animation.
   */
  lastSpinId: number | null;
};

export type SseEvent =
  | { event: "init"; data: InitEvent }
  | { event: "spin"; data: SpinPayload }
  | { event: "winners"; data: { winners: Winner[] } };

/**
 * Everything the admin sends up when Spin is pressed. `spinId` and `startAt`
 * are both the server's to decide — the admin proposes the reel, the server
 * schedules it.
 */
export type SpinBroadcastBody = Omit<SpinPayload, "spinId" | "startAt">;

/**
 * Accepts a body from the admin *and* a payload read back out of `liveSpin`,
 * including one written by the previous build with no `startAt` on it — the
 * schedule is optional here on purpose, so a rollout never invalidates a row.
 */
export function isSpinPayload(value: unknown): value is SpinBroadcastBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.spinnerItems) &&
    typeof v.winner === "string" &&
    typeof v.winnerIndex === "number" &&
    typeof v.duration === "number" &&
    // Bounded, not merely numeric: `duration` decides how long the server
    // holds the spin lock, so an absurd value would wedge the draw.
    Number.isFinite(v.duration) &&
    v.duration > 0 &&
    v.duration <= MAX_SPIN_DURATION_MS &&
    typeof v.easeExponent === "number" &&
    Number.isFinite(v.easeExponent) &&
    typeof v.finalTarget === "number" &&
    Number.isFinite(v.finalTarget) &&
    (v.crawlRows === undefined ||
      (typeof v.crawlRows === "number" &&
        Number.isFinite(v.crawlRows) &&
        v.crawlRows > 0)) &&
    (v.crawlMs === undefined ||
      (typeof v.crawlMs === "number" &&
        Number.isFinite(v.crawlMs) &&
        v.crawlMs > 0)) &&
    !!v.settings &&
    typeof v.settings === "object"
  );
}
