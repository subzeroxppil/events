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
}

/**
 * The vertical slot-machine reel. Shared by the admin draw screen and the
 * public view-only page so the two can never drift apart visually.
 */
const REEL_MASK =
  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 6%, #000 20%, #000 80%, rgba(0,0,0,0.35) 94%, transparent 100%)";

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
          maskImage: REEL_MASK,
          WebkitMaskImage: REEL_MASK,
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

      {/* Centre indicator.
          Drawn as an SVG rather than the "▶" character: U+25B6 carries an
          emoji presentation, and Chrome on Android picks it — the reel showed
          a colour ▶️ emoji on phones instead of the accent-tinted arrow. */}
      <div className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30">
        <ReelArrow color={accentColors[1]} glow={accentColors[3]} />
      </div>
      <div className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none z-30 rotate-180">
        <ReelArrow color={accentColors[1]} glow={accentColors[3]} />
      </div>
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
