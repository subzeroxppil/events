import type { ViewSettings } from "@/lib/luckydraw-settings";

/**
 * What the admin broadcasts the moment Spin is pressed. It carries the exact
 * reel and the exact target index, so every viewer reproduces the identical
 * animation without needing a shared random seed or synchronised clocks.
 */
export type SpinPayload = {
  /** `liveSpinAt` as epoch ms. Viewers ignore anything not strictly newer. */
  spinId: number;
  spinnerItems: string[];
  winner: string;
  winnerIndex: number;
  /** Animate index 0 -> finalTarget (the random sub-item offset is folded in). */
  finalTarget: number;
  duration: number;
  easeExponent: number;
  settings: ViewSettings;
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

/** Everything the admin sends up when Spin is pressed. */
export type SpinBroadcastBody = Omit<SpinPayload, "spinId">;

export function isSpinPayload(value: unknown): value is SpinBroadcastBody {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.spinnerItems) &&
    typeof v.winner === "string" &&
    typeof v.winnerIndex === "number" &&
    typeof v.finalTarget === "number" &&
    typeof v.duration === "number" &&
    typeof v.easeExponent === "number" &&
    !!v.settings &&
    typeof v.settings === "object"
  );
}
