import type { CSSProperties } from "react";
import type { AnimationSettings, ViewSettings } from "@/lib/luckydraw-settings";

export const BASE_COLORS = ["#173066", "#509bff", "#0463ce", "#63cbfb"];

/** Smooth easing function — decelerates harder as the spin progresses. */
export const rouletteEasing = (progress: number, exponent: number): number => {
  const smoothExponent = 2 + (exponent - 2) * Math.pow(progress, 1.5);
  return 1 - Math.pow(1 - progress, smoothExponent);
};

/**
 * Where the reel is, in rows from the start, `elapsedMs` into a spin.
 *
 * With `crawlRows`/`crawlMs` the spin is a tease: a fast run that cruises at
 * full speed, brakes, and settles without stopping into a slow crawl for the
 * last `crawlMs`, covering the
 * final `crawlRows` rows while it eases to a halt. The last few names creep
 * past the centre one at a time, so the room can't call the winner until the
 * reel actually stops. The total duration is unchanged.
 *
 * Without them — a payload from a build before the crawl — it is the original
 * `rouletteEasing` curve, so mixed versions mid-rollout still agree.
 */
export const spinPosition = (
  elapsedMs: number,
  spin: {
    finalTarget: number;
    duration: number;
    easeExponent: number;
    crawlRows?: number;
    crawlMs?: number;
  }
): number => {
  const { finalTarget, duration, crawlRows, crawlMs } = spin;
  const t = Math.min(Math.max(elapsedMs, 0), duration);
  if (
    !crawlRows ||
    !crawlMs ||
    crawlMs >= duration ||
    crawlRows >= finalTarget
  ) {
    return finalTarget * rouletteEasing(t / duration, spin.easeExponent);
  }

  // Run: holds its top speed for the first `CRUISE_FRACTION` of the run, then
  // brakes along a smoothstep down to `crawlSpeed`, arriving with zero slope
  // so the hand-off has no visible kink. Crawl: speed falls linearly from
  // `crawlSpeed` to zero, covering `crawlRows`.
  const runMs = duration - crawlMs;
  const crawlSpeed = (2 * crawlRows) / crawlMs;
  const runRows = finalTarget - crawlRows;
  const CRUISE_FRACTION = 0.45;
  // Area under the run's speed curve above `crawlSpeed`, per unit of extra
  // speed and run time: the cruise plus half the braking (smoothstep's mean).
  const runShape = CRUISE_FRACTION + (1 - CRUISE_FRACTION) / 2;
  const extraPeak = (runRows - crawlSpeed * runMs) / (runMs * runShape);

  if (t <= runMs) {
    const u = t / runMs;
    let covered: number;
    if (u <= CRUISE_FRACTION) {
      covered = u;
    } else {
      const b = (u - CRUISE_FRACTION) / (1 - CRUISE_FRACTION);
      covered =
        CRUISE_FRACTION +
        (1 - CRUISE_FRACTION) * (b - b * b * b + (b * b * b * b) / 2);
    }
    return crawlSpeed * t + extraPeak * runMs * covered;
  }
  const w = (t - runMs) / crawlMs;
  return runRows + crawlSpeed * crawlMs * (w - (w * w) / 2);
};

/**
 * Build the spinner reel: the participant pool shuffled and repeated until it
 * reaches `targetLength`.
 */
export const createExtendedList = (
  items: string[],
  targetLength: number
): string[] => {
  if (items.length === 0) return [];
  const result: string[] = [];
  while (result.length < targetLength) {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    result.push(...shuffled);
  }
  return result.slice(0, targetLength);
};

/**
 * Choose where the reel stops, never on someone who has already won while
 * anyone eligible remains.
 *
 * Eligibility is judged against the whole participant pool, not just the
 * reel: the reel is capped at `spinnerItemCount`, so with a large pool it can
 * hold only past winners while others have yet to win. When that happens one
 * eligible participant is written into a random slot of a copy of the reel.
 *
 * Once everyone has won, a repeat is expected — more draws than people — and
 * any slot is fair game.
 */
export const pickWinner = (
  reel: string[],
  participants: string[],
  pastWinners: Iterable<string>,
  random: () => number = Math.random
): { reel: string[]; winnerIndex: number } => {
  if (reel.length === 0) return { reel, winnerIndex: -1 };

  const won = new Set(pastWinners);
  const eligible = participants.filter((p) => !won.has(p));
  const pickFrom = <T>(list: T[]): T =>
    list[Math.min(Math.floor(random() * list.length), list.length - 1)];

  if (eligible.length === 0) {
    return { reel, winnerIndex: pickFrom(reel.map((_, i) => i)) };
  }

  const eligibleIndices: number[] = [];
  reel.forEach((name, i) => {
    if (!won.has(name)) eligibleIndices.push(i);
  });

  if (eligibleIndices.length > 0) {
    return { reel, winnerIndex: pickFrom(eligibleIndices) };
  }

  const winnerIndex = pickFrom(reel.map((_, i) => i));
  const patched = [...reel];
  patched[winnerIndex] = pickFrom(eligible);
  return { reel: patched, winnerIndex };
};

/**
 * Swap the winner into `slot`, so the reel can be made to stop there. A swap
 * rather than an overwrite keeps the reel's mix of names unchanged.
 */
export const moveWinnerTo = (
  reel: string[],
  winnerIndex: number,
  slot: number
): { reel: string[]; winnerIndex: number } => {
  if (winnerIndex < 0 || slot === winnerIndex) return { reel, winnerIndex };
  const moved = [...reel];
  [moved[slot], moved[winnerIndex]] = [moved[winnerIndex], moved[slot]];
  return { reel: moved, winnerIndex: slot };
};

type ColorSettings = Pick<
  AnimationSettings,
  "useCustomColors" | "customColors"
>;

export const resolveColors = (settings: ColorSettings): string[] =>
  settings.useCustomColors ? settings.customColors : BASE_COLORS;

type BackgroundSettings = Pick<
  AnimationSettings,
  | "backgroundMode"
  | "backgroundSolidColor"
  | "backgroundGradientFrom"
  | "backgroundGradientTo"
  | "backgroundGradientAngle"
>;

export const backgroundStyleFor = (
  settings: BackgroundSettings
): CSSProperties => {
  if (settings.backgroundMode === "solid") {
    return { background: settings.backgroundSolidColor };
  }
  return {
    background: `linear-gradient(${settings.backgroundGradientAngle}deg, ${settings.backgroundGradientFrom}, ${settings.backgroundGradientTo})`,
  };
};

/** The items actually rendered around the centre of the reel. */
export const buildRenderedItems = (
  spinnerItems: string[],
  centerIndex: number,
  visibleRange: number
) => {
  if (spinnerItems.length === 0) return [];
  const items = [];
  const totalItems = spinnerItems.length;

  for (let i = -visibleRange; i <= visibleRange; i++) {
    const absoluteIndex = centerIndex + i;
    const wrappedIndex =
      ((absoluteIndex % totalItems) + totalItems) % totalItems;
    items.push({
      text: spinnerItems[wrappedIndex],
      offset: i,
      key: `${absoluteIndex}-${spinnerItems[wrappedIndex]}`,
    });
  }
  return items;
};

/**
 * Confetti burst shown when a winner lands. Returns a cleanup function so the
 * interval can be cancelled if the component unmounts mid-celebration.
 */
export const triggerFireworks = (
  confetti: (opts: Record<string, unknown>) => void,
  settings: Pick<
    ViewSettings,
    | "fireworksDuration"
    | "fireworksParticleCount"
    | "useCustomColors"
    | "customColors"
  >
): (() => void) => {
  const duration = settings.fireworksDuration;
  const animationEnd = Date.now() + duration;
  // The draw's own accent colours, plus white for sparkle — confetti's default
  // rainbow reads as generic next to the PayPal palette everything else uses.
  const colors = [...resolveColors(settings), "#ffffff"];
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    // Above the winner overlay (z-50), not behind it. Behind, the overlay's
    // own backdrop-filter blurred and dimmed the fireworks into invisibility.
    // The two bursts below originate in the left and right thirds, so raising
    // them over the overlay still leaves the centred winner name clear.
    zIndex: 60,
    colors,
    disableForReducedMotion: true,
  };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount =
      settings.fireworksParticleCount * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  return () => clearInterval(interval);
};
