"use client";

import React from "react";
import GradualBlur from "@/components/GradualBlur";
import SpinnerItem, { type ReelTheme } from "@/components/luckydraw/SpinnerItem";
import { buildRenderedItems } from "@/lib/luckydraw";

interface SpinnerReelProps {
  spinnerItems: string[];
  centerIndex: number;
  animationOffset: number;
  itemHeight: number;
  visibleRange: number;
  centerItemScale: number;
  nearCenterScale: number;
  maxBlur: number;
  /** Drives the arrow indicator's glow. */
  accentColors: string[];
  isAnimating: boolean;
  /** Card/text palette for the rows. Defaults to the original light look. */
  theme?: ReelTheme;
  /** Height of the fade masks at the top and bottom of the reel. */
  fadeHeight?: string;
  /** Draws a focus band across the centre row. */
  showFocusBand?: boolean;
  /** Soft blur at the reel's ends. Off for the pixel skin, which has no blur. */
  blurEdges?: boolean;
  /** "stepped" fades the ends in hard bands rather than a smooth ramp. */
  fade?: "smooth" | "stepped";
  /** Centre indicator style. */
  arrow?: "smooth" | "pixel" | "none";
}

/**
 * The vertical slot-machine reel. Shared by the admin draw screen and the
 * public view-only page so the two can never drift apart visually.
 */
const REEL_MASK =
  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 6%, #000 20%, #000 80%, rgba(0,0,0,0.35) 94%, transparent 100%)";

/** Hard bands rather than a ramp, so the ends dissolve in visible steps. */
const REEL_MASK_STEPPED =
  "linear-gradient(to bottom, transparent 0 6%, rgba(0,0,0,0.25) 6% 11%, rgba(0,0,0,0.6) 11% 17%, #000 17% 83%, rgba(0,0,0,0.6) 83% 89%, rgba(0,0,0,0.25) 89% 94%, transparent 94% 100%)";

export default function SpinnerReel({
  spinnerItems,
  centerIndex,
  animationOffset,
  itemHeight,
  visibleRange,
  centerItemScale,
  nearCenterScale,
  maxBlur,
  accentColors,
  isAnimating,
  theme = "light",
  fadeHeight = "8rem",
  showFocusBand = false,
  blurEdges = true,
  fade = "smooth",
  arrow = "smooth",
}: SpinnerReelProps) {
  const renderedItems = React.useMemo(
    () => buildRenderedItems(spinnerItems, centerIndex, visibleRange),
    [spinnerItems, centerIndex, visibleRange]
  );

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      {showFocusBand && (
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-[5] pointer-events-none rounded-2xl"
          style={{
            height: itemHeight * centerItemScale + 8,
            background: `linear-gradient(90deg, transparent, ${accentColors[1]}14 15%, ${accentColors[1]}1f 50%, ${accentColors[1]}14 85%, transparent)`,
            boxShadow: `inset 0 1px 0 ${accentColors[3]}33, inset 0 -1px 0 ${accentColors[3]}33`,
          }}
        />
      )}

      {/* The rows are masked rather than covered, so they fade out against
          whatever the skin's background happens to be instead of needing a
          matching opaque gradient at each end. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage: fade === "stepped" ? REEL_MASK_STEPPED : REEL_MASK,
          WebkitMaskImage: fade === "stepped" ? REEL_MASK_STEPPED : REEL_MASK,
        }}
      >
      <div
        className="absolute w-full"
        style={{
          top: "50%",
          transform: `translateY(calc(-50% - ${animationOffset}px))`,
          willChange: "transform",
          transition: "none",
        }}
      >
        {renderedItems.map((item) => {
          const distanceFromCenter = Math.abs(item.offset);
          const isCenter = item.offset === 0;
          const isNearCenter = distanceFromCenter <= 2;

          const scale = isCenter
            ? centerItemScale
            : isNearCenter
            ? nearCenterScale
            : 1;
          const opacity = isCenter
            ? 1
            : Math.max(0.3, 1 - distanceFromCenter * 0.05);
          const blur =
            distanceFromCenter > 8
              ? Math.min(maxBlur, (distanceFromCenter - 8) * 0.1)
              : 0;

          return (
            <SpinnerItem
              key={item.key}
              text={item.text}
              offset={item.offset}
              itemHeight={itemHeight}
              isCenter={isCenter}
              isNearCenter={isNearCenter}
              scale={scale}
              opacity={opacity}
              blur={blur}
              isAnimating={isAnimating}
              theme={theme}
              accent={accentColors[1]}
            />
          );
        })}
      </div>
      </div>

      {/* Gradual Blur */}
      {blurEdges && (
        <>
          <GradualBlur
            position="top"
            height={fadeHeight}
            strength={2.5}
            divCount={10}
            opacity={0.95}
            exponential={true}
            style={{ zIndex: 20, pointerEvents: "none" }}
          />
          <GradualBlur
            position="bottom"
            height={fadeHeight}
            strength={2.5}
            divCount={10}
            opacity={0.95}
            exponential={true}
            style={{ zIndex: 20, pointerEvents: "none" }}
          />
        </>
      )}

      {/* Centre indicator.
          Drawn as an SVG rather than the "▶" character: U+25B6 carries an
          emoji presentation, and Chrome on Android picks it — the reel showed
          a colour ▶️ emoji on phones instead of the accent-tinted arrow. */}
      {arrow !== "none" && (
        <>
          <div className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30">
            {arrow === "pixel" ? (
              <PixelArrow color={accentColors[3]} />
            ) : (
              <ReelArrow color={accentColors[1]} glow={accentColors[3]} />
            )}
          </div>
          <div className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 rotate-180">
            {arrow === "pixel" ? (
              <PixelArrow color={accentColors[3]} />
            ) : (
              <ReelArrow color={accentColors[1]} glow={accentColors[3]} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReelArrow({ color, glow }: { color: string; glow: string }) {
  return (
    <span className="relative block">
      <svg
        viewBox="0 0 12 16"
        aria-hidden="true"
        className="block w-3 h-4 sm:w-4 sm:h-5 lg:w-5 lg:h-7"
        style={{ filter: `drop-shadow(0 0 8px ${glow}80)` }}
      >
        <path d="M1 1.2 L11 8 L1 14.8 Z" fill={color} />
      </svg>
      <svg
        viewBox="0 0 12 16"
        aria-hidden="true"
        className="absolute inset-0 block w-3 h-4 sm:w-4 sm:h-5 lg:w-5 lg:h-7"
        style={{ filter: "blur(4px)", opacity: 0.6 }}
      >
        <path d="M1 1.2 L11 8 L1 14.8 Z" fill={glow} />
      </svg>
    </span>
  );
}

/**
 * The same arrow drawn on a 5x9 grid, one <rect> per pixel column. No
 * anti-aliased hypotenuse and no glow, so it belongs on the pixel skin.
 */
function PixelArrow({ color }: { color: string }) {
  // [x, y, height] per column, forming a stepped triangle.
  const columns: [number, number, number][] = [
    [0, 0, 9],
    [1, 1, 7],
    [2, 2, 5],
    [3, 3, 3],
    [4, 4, 1],
  ];
  return (
    <svg
      viewBox="0 0 5 9"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="block w-2.5 h-[1.125rem] sm:w-3 sm:h-[1.35rem] lg:w-4 lg:h-[1.8rem]"
    >
      {columns.map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width={1} height={h} fill={color} />
      ))}
    </svg>
  );
}
