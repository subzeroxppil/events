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
  duration: 13000,
  easeExponent: 4,
  minSpins: 3,
  maxSpins: 5,
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
