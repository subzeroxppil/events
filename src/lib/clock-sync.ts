/**
 * Working out how far this device's clock is from the server's.
 *
 * Every screen schedules its spin against a server-time instant, so the whole
 * synchronisation rests on this number being right. Getting it wrong by 400ms
 * puts that screen 400ms out of step with the room for the rest of the event —
 * which is the very thing the scheduling is there to prevent.
 *
 * The naive estimate is one request: assume the reply was read at the halfway
 * point and work back. That assumption only holds if the trip out and the trip
 * home took the same time. When it doesn't — a cold serverless instance, a
 * slow DB write on the same request, a phone whose uplink is worse than its
 * downlink — the error is half the difference, and a single unlucky sample is
 * then baked in for the session.
 *
 * So: probe a handful of times and keep the sample with the *smallest* round
 * trip. A fast round trip has little room to be lopsided, so its midpoint
 * assumption is the one most likely to be true. It is the same reasoning NTP
 * uses, minus everything else NTP does.
 */

export type ClockOffset = {
  /** Add to `Date.now()` to get server time. */
  offsetMs: number;
  /** Round trip of the sample this came from — smaller means more trustworthy. */
  rttMs: number;
};

const DEFAULT_SAMPLES = 5;

/**
 * Probe `url` a few times and return the offset from the tightest round trip.
 *
 * `url` must answer with `{ serverNow: <epoch ms> }` and do as little work as
 * possible — every millisecond it spends is indistinguishable from network
 * latency and widens the error.
 */
export async function estimateClockOffset(
  url: string,
  samples = DEFAULT_SAMPLES
): Promise<ClockOffset | null> {
  let best: ClockOffset | null = null;

  for (let i = 0; i < samples; i++) {
    try {
      const sentAt = Date.now();
      const res = await fetch(url, { cache: "no-store" });
      const receivedAt = Date.now();
      if (!res.ok) continue;

      const data = await res.json();
      if (typeof data?.serverNow !== "number") continue;

      const rttMs = receivedAt - sentAt;
      // Midpoint of the round trip is our best guess at when the server read
      // its own clock.
      const offsetMs = data.serverNow + rttMs / 2 - receivedAt;

      if (!best || rttMs < best.rttMs) best = { offsetMs, rttMs };
    } catch {
      // A dropped probe tells us nothing; the remaining ones still will.
    }
  }

  return best;
}

/**
 * Fold a one-off reading — such as the one that comes back with a granted spin
 * claim — into an existing estimate, but only when it is actually better.
 *
 * Without the comparison a single slow claim would overwrite a good estimate
 * with a worse one, which is how a screen ends up drifting mid-event.
 */
export function refineOffset(
  current: ClockOffset | null,
  sample: ClockOffset
): ClockOffset {
  if (!current || sample.rttMs < current.rttMs) return sample;
  return current;
}
