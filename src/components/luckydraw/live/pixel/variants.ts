import type { ReelTheme } from "@/components/luckydraw/SpinnerItem";

/**
 * The three pixel skins.
 *
 * They share every component — one welcome screen, one stage, one winner
 * overlay — and differ only through this table, so a change to the layout
 * lands on all three and none of them can quietly rot.
 *
 * All three stay on the PayPal ramp: navy #173066, blues #0463ce / #509bff /
 * #63cbfb, white. Red appears only on the LIVE dot.
 */
export type PixelVariant = {
  id: string;
  /** Shown on the welcome screen above the draw name. */
  tagline: string;
  /** Which skin this is. Always sits on its own line under the tagline. */
  edition: string;
  background: string;
  backdrop: "stars" | "dots" | "checker";
  /** Scanlines and vignette. Off for the handheld skin, which is not a CRT. */
  crt: boolean;
  reelTheme: ReelTheme;

  text: string;
  dim: string;
  accent: string;

  /** The reel window. */
  frameBorder: string;
  frameFill: string;
  frameOutline: string;
  bracket: string;

  /** Panels — the stat readout, the last-winner plate. */
  panelFill: string;
  panelBorder: string;
  panelOutline: string;
  panelShadow: string;

  /** The Enter / Spin key. */
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  buttonOutline: string;
  buttonShadow: string;

  titleShadow: string;
  confetti: string[];
};

/** Deep-space cabinet: starfield, scanlines, cyan on near-black navy. */
const ARCADE_NIGHT: PixelVariant = {
  id: "pixel",
  tagline: "LUCKY DRAW",
  edition: "<ARCADE NIGHT>",
  background: "linear-gradient(180deg, #173066 0%, #0d1f47 45%, #050d22 100%)",
  backdrop: "stars",
  crt: true,
  reelTheme: "pixel",

  text: "#ffffff",
  dim: "#7fb7ff",
  accent: "#63cbfb",

  frameBorder: "#63cbfb",
  frameFill: "rgba(5, 13, 34, 0.55)",
  frameOutline: "#173066",
  bracket: "#ffffff",

  panelFill: "rgba(10, 22, 56, 0.72)",
  panelBorder: "#ffffff",
  panelOutline: "#173066",
  panelShadow: "#0463ce",

  buttonBg: "#63cbfb",
  buttonText: "#173066",
  buttonBorder: "#ffffff",
  buttonOutline: "#173066",
  buttonShadow: "#0463ce",

  titleShadow: "3px 3px 0 #071633",
  confetti: ["#63cbfb", "#509bff", "#0463ce", "#173066", "#ffffff"],
};

/** Handheld LCD: dark pixels on a pale screen, heavy bezel, no scanlines. */
const HANDHELD: PixelVariant = {
  id: "pixel-lcd",
  tagline: "LUCKY DRAW",
  edition: "<PORTABLE EDITION>",
  background: "linear-gradient(180deg, #eaf2ff 0%, #d3e2f8 55%, #b9cdec 100%)",
  backdrop: "dots",
  crt: false,
  reelTheme: "pixel-lcd",

  text: "#173066",
  dim: "#4e74b8",
  accent: "#0463ce",

  frameBorder: "#173066",
  frameFill: "rgba(255, 255, 255, 0.45)",
  frameOutline: "#8fb0e0",
  bracket: "#173066",

  panelFill: "rgba(255, 255, 255, 0.7)",
  panelBorder: "#173066",
  panelOutline: "#8fb0e0",
  panelShadow: "#7a9bd4",

  buttonBg: "#173066",
  buttonText: "#eaf2ff",
  buttonBorder: "#0a1638",
  buttonOutline: "#8fb0e0",
  buttonShadow: "#7a9bd4",

  titleShadow: "2px 2px 0 #b9cdec",
  confetti: ["#173066", "#0463ce", "#509bff", "#ffffff"],
};

/** Quest log: tiled floor, double-ruled white frames, dialogue-box footer. */
const QUEST: PixelVariant = {
  id: "pixel-quest",
  tagline: "LUCKY DRAW",
  edition: "<QUEST MODE>",
  background: "linear-gradient(180deg, #0a1638 0%, #061027 60%, #03081a 100%)",
  backdrop: "checker",
  crt: false,
  reelTheme: "pixel-quest",

  text: "#ffffff",
  dim: "#a9c7f5",
  accent: "#63cbfb",

  frameBorder: "#ffffff",
  frameFill: "rgba(6, 16, 39, 0.85)",
  frameOutline: "#0463ce",
  bracket: "#63cbfb",

  panelFill: "#0a1638",
  panelBorder: "#ffffff",
  panelOutline: "#0463ce",
  panelShadow: "#173066",

  buttonBg: "#ffffff",
  buttonText: "#173066",
  buttonBorder: "#63cbfb",
  buttonOutline: "#0463ce",
  buttonShadow: "#173066",

  titleShadow: "3px 3px 0 #041028",
  confetti: ["#ffffff", "#63cbfb", "#509bff", "#0463ce"],
};

export const PIXEL_VARIANTS: Record<string, PixelVariant> = {
  pixel: ARCADE_NIGHT,
  "pixel-lcd": HANDHELD,
  "pixel-quest": QUEST,
};

export const DEFAULT_PIXEL_VARIANT = ARCADE_NIGHT;
