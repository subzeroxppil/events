"use client";

import Image from "next/image";
import { useCallback } from "react";
import confetti from "canvas-confetti";
import { pixelFontVars } from "@/lib/pixel-font";
import {
  PixelBackdrop,
  PixelCrt,
  PixelPanel,
  pixelButtonStyle,
} from "@/components/luckydraw/live/pixel/PixelChrome";
import {
  DEFAULT_PIXEL_VARIANT,
  type PixelVariant,
} from "@/components/luckydraw/live/pixel/variants";

interface PixelWelcomeProps {
  drawName?: string;
  participantCount: number;
  winnerCount: number;
  onEnter: () => void;
  variant?: PixelVariant;
}

/**
 * Title screen for the pixel skins.
 *
 * Same job as the other welcome screens — it is the gesture that unlocks audio
 * on mobile — dressed as the attract mode of a cabinet: a backdrop, a stat
 * readout and a blinking PRESS ENTER. Everything that differs between the
 * three pixel skins comes from `variant`.
 */
export default function PixelWelcome({
  drawName,
  participantCount,
  winnerCount,
  onEnter,
  variant = DEFAULT_PIXEL_VARIANT,
}: PixelWelcomeProps) {
  const handleEnter = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 40,
      ticks: 120,
      // Squares only — round confetti would be the one soft thing on screen.
      shapes: ["square"],
      scalar: 1.3,
      origin: { x: 0.5, y: 0.8 },
      colors: variant.confetti,
      disableForReducedMotion: true,
    });
    onEnter();
  }, [onEnter, variant.confetti]);

  const stats = [
    { label: "PLAYERS", value: participantCount },
    { label: "DRAWN", value: winnerCount },
    { label: "SOUND", value: "ON" },
  ];

  return (
    <div
      className={`${pixelFontVars} absolute inset-0 z-50 overflow-hidden`}
      style={{ background: variant.background }}
    >
      <PixelBackdrop variant={variant} />
      <PixelCrt variant={variant} />

      <div className="relative z-10 h-full w-full overflow-y-auto overscroll-contain flex items-center justify-center px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="w-full max-w-[22rem] landscape:max-w-3xl landscape:grid landscape:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] landscape:gap-8 landscape:items-center text-center landscape:text-left">
          {/* Title block */}
          <div className="flex flex-col items-center landscape:items-start">
            {/* Above the scanlines: striping the wordmark is the one place the
                CRT effect costs more than it gives. */}
            <div
              className="pixel-bob relative z-50 bg-white px-4 py-3"
              style={{
                boxShadow: `0 0 0 4px ${variant.panelOutline}, 6px 6px 0 0 ${variant.panelShadow}`,
              }}
            >
              <Image
                src="/paypal_logo.png"
                alt="PayPal"
                width={128}
                height={72}
                priority
                className="pixelated h-7 sm:h-9 w-auto"
              />
            </div>

            <p
              className="mt-4 font-pixel text-[11px] sm:text-sm leading-[1.7] tracking-[0.12em] text-center landscape:text-left"
              style={{ color: variant.accent }}
            >
              {/* Two lines by construction. Left to wrap on its own it broke
                  mid-edition on a narrow phone — "LUCKY DRAW <PORTABLE" over
                  "EDITION>". */}
              <span className="block">{variant.tagline}</span>
              <span className="block">{variant.edition}</span>
            </p>

            <h1
              className="mt-2 font-pixel text-[13px] sm:text-base leading-[1.7] uppercase [overflow-wrap:anywhere]"
              style={{ color: variant.text, textShadow: variant.titleShadow }}
            >
              {drawName || "Lucky Draw"}
            </h1>

            {/* Stat readout */}
            <PixelPanel variant={variant} className="mt-4 w-full px-3 py-2.5">
              <div className="grid grid-cols-3 gap-2">
                {stats.map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div
                      className="font-pixel text-[7px] tracking-[0.12em]"
                      style={{ color: variant.dim }}
                    >
                      {label}
                    </div>
                    <div
                      className="mt-1 font-pixel-body text-2xl leading-none"
                      style={{ color: variant.text }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </PixelPanel>
          </div>

          {/* Briefing + start */}
          <div className="mt-6 landscape:mt-0 flex flex-col items-center landscape:items-start">
            <p
              className="font-pixel-body text-xl leading-[1.35]"
              style={{ color: variant.dim }}
            >
              Every spin lands right here, live. No buttons, no refreshing —
              just watch for your name.
            </p>
            <p
              className="mt-2 font-pixel text-[10px] leading-[1.8]"
              style={{ color: variant.text }}
            >
              GOOD LUCK!
            </p>

            <button
              type="button"
              onClick={handleEnter}
              className="mt-5 w-full max-w-[18rem] font-pixel text-[13px] uppercase px-6 py-4 transition-transform duration-75 active:translate-x-[3px] active:translate-y-[3px]"
              style={pixelButtonStyle(variant)}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <PixelCaret color={variant.buttonText} />
                ENTER
                <span className="rotate-180">
                  <PixelCaret color={variant.buttonText} />
                </span>
              </span>
            </button>

            <p
              className="pixel-blink mt-4 font-pixel text-[8px] tracking-[0.16em]"
              style={{ color: variant.accent }}
            >
              PRESS ENTER TO PLAY
            </p>
            <p
              className="mt-2 font-pixel-body text-lg leading-none"
              style={{ color: variant.dim }}
            >
              volume up · keep this page open
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stepped triangle, drawn one pixel column at a time. */
function PixelCaret({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 4 7"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="block w-2 h-3.5"
    >
      {(
        [
          [0, 0, 7],
          [1, 1, 5],
          [2, 2, 3],
          [3, 3, 1],
        ] as [number, number, number][]
      ).map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width={1} height={h} fill={color} />
      ))}
    </svg>
  );
}
