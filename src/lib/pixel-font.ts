import { Press_Start_2P, VT323 } from "next/font/google";

/**
 * Fonts for the `?ui=pixel` skin of the public draw page.
 *
 * They live in their own module so the two components that need them can share
 * one instance — next/font dedupes per call site, not per family.
 *
 * Press Start 2P is the arcade display face: very wide, so it is only ever
 * used for headings, labels and buttons. VT323 is a terminal face that stays
 * readable in a paragraph, and carries the body copy and the numbers.
 */
export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-body",
  display: "swap",
});

/** Put on the root of a pixel-skinned tree to expose both faces. */
export const pixelFontVars = `${pressStart.variable} ${vt323.variable}`;
