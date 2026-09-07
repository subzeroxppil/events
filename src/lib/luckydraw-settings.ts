/**
 * Animation settings for the lucky draw spinner.
 *
 * These live here rather than beside the settings Sheet so that the public
 * view-only page (`/live/[luckydrawId]`) can read the types and defaults
 * without pulling the whole admin settings UI into its bundle.
 */

export type AnimationSettings = {
  duration: number;
  easeExponent: number;
  minSpins: number;
  maxSpins: number;
  spinnerItemCount: number;
  idleSpeed: number;
  enableFireworks: boolean;
  fireworksDuration: number;
  fireworksParticleCount: number;
  winnerDisplayDuration: number;
  enableSounds: boolean;
  soundFadeStartPercent: number;
  soundFadeDuration: number;
  visibleRange: number;
  centerItemScale: number;
  nearCenterScale: number;
  maxBlur: number;
  useCustomColors: boolean;
  customColors: string[];
  // Background customization
  backgroundMode: "solid" | "gradient";
  backgroundSolidColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  backgroundGradientAngle: number; // degrees
  backgroundOverlayOpacity: number; // 0 - 1 (white overlay)
};

export const DEFAULT_SETTINGS: AnimationSettings = {
  // 13s, matching the original screen's `spinningTime={13}`.
  duration: 13000,
  easeExponent: 4,

  // How *fast the reel looks* is distance over time, not time. The reel travels
  // `floor(spins) * spinnerItemCount + winnerIndex` rows in `duration`, so with
  // the duration fixed at the original 13s the only way to slow the motion down
  // is to travel fewer rows: cutting the rotations from 3-4 to 1-2 roughly
  // halves the speed the names fly past at, while the spin still takes exactly
  // as long as it always did.
  //
  // Stretching `duration` instead — which is what 18s did — makes the same
  // journey take longer without making any single moment of it slower, so the
  // names blur past just as fast and the spin merely drags.
  //
  // At 1-2 rotations the reel peaks around 42 rows/s against the original's
  // 119, so the names are readable rather than a blur.
  //
  // Only `finalTarget` is broadcast, not these, so the live page inherits the
  // shorter journey automatically.
  minSpins: 1,
  maxSpins: 2,
  spinnerItemCount: 200,
  idleSpeed: 30,
  enableFireworks: true,
  fireworksDuration: 5000,
  fireworksParticleCount: 500,
  winnerDisplayDuration: 7000,
  enableSounds: true,
  soundFadeStartPercent: 0.65,
  soundFadeDuration: 0.35,
  visibleRange: 20,
  centerItemScale: 1.08,
  nearCenterScale: 1.02,
  maxBlur: 1,
  useCustomColors: false,
  customColors: ["#173066", "#509bff", "#0463ce", "#63cbfb"],
  backgroundMode: "gradient",
  backgroundSolidColor: "#f8fafc",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "rgb(143, 191, 255)",
  backgroundGradientAngle: 135,
  backgroundOverlayOpacity: 0.4,
};

/**
 * The subset of settings the view-only page needs in order to look and behave
 * identically to the admin screen. Broadcast with every spin, because the
 * admin's settings live in component state and are never persisted.
 */
export type ViewSettings = Pick<
  AnimationSettings,
  | "idleSpeed"
  | "enableFireworks"
  | "fireworksDuration"
  | "fireworksParticleCount"
  | "winnerDisplayDuration"
  | "enableSounds"
  | "soundFadeStartPercent"
  | "soundFadeDuration"
  | "visibleRange"
  | "centerItemScale"
  | "nearCenterScale"
  | "maxBlur"
  | "useCustomColors"
  | "customColors"
  | "backgroundMode"
  | "backgroundSolidColor"
  | "backgroundGradientFrom"
  | "backgroundGradientTo"
  | "backgroundGradientAngle"
  | "backgroundOverlayOpacity"
>;

const VIEW_SETTING_KEYS = [
  "idleSpeed",
  "enableFireworks",
  "fireworksDuration",
  "fireworksParticleCount",
  "winnerDisplayDuration",
  "enableSounds",
  "soundFadeStartPercent",
  "soundFadeDuration",
  "visibleRange",
  "centerItemScale",
  "nearCenterScale",
  "maxBlur",
  "useCustomColors",
  "customColors",
  "backgroundMode",
  "backgroundSolidColor",
  "backgroundGradientFrom",
  "backgroundGradientTo",
  "backgroundGradientAngle",
  "backgroundOverlayOpacity",
] as const satisfies readonly (keyof ViewSettings)[];

export const DEFAULT_VIEW_SETTINGS: ViewSettings = toViewSettings(DEFAULT_SETTINGS);

export function toViewSettings(settings: AnimationSettings): ViewSettings {
  const out = {} as Record<string, unknown>;
  for (const key of VIEW_SETTING_KEYS) out[key] = settings[key];
  return out as ViewSettings;
}
