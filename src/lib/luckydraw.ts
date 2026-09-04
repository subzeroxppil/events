import type { CSSProperties } from "react";
import type { AnimationSettings, ViewSettings } from "@/lib/luckydraw-settings";

export const BASE_COLORS = ["#173066", "#509bff", "#0463ce", "#63cbfb"];

/** Smooth easing function — decelerates harder as the spin progresses. */
export const rouletteEasing = (progress: number, exponent: number): number => {
  const smoothExponent = 2 + (exponent - 2) * Math.pow(progress, 1.5);
  return 1 - Math.pow(1 - progress, smoothExponent);
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
  settings: Pick<ViewSettings, "fireworksDuration" | "fireworksParticleCount">
): (() => void) => {
  const duration = settings.fireworksDuration;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
