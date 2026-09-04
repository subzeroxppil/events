"use client";

import React from "react";
import GradualBlur from "@/components/GradualBlur";
import SpinnerItem from "@/components/luckydraw/SpinnerItem";
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
}

/**
 * The vertical slot-machine reel. Shared by the admin draw screen and the
 * public view-only page so the two can never drift apart visually.
 */
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
}: SpinnerReelProps) {
  const renderedItems = React.useMemo(
    () => buildRenderedItems(spinnerItems, centerIndex, visibleRange),
    [spinnerItems, centerIndex, visibleRange]
  );

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
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
            />
          );
        })}
      </div>

      {/* Gradual Blur */}
      <GradualBlur
        position="top"
        height="8rem"
        strength={2.5}
        divCount={10}
        opacity={0.95}
        exponential={true}
        style={{ zIndex: 20, pointerEvents: "none" }}
      />
      <GradualBlur
        position="bottom"
        height="8rem"
        strength={2.5}
        divCount={10}
        opacity={0.95}
        exponential={true}
        style={{ zIndex: 20, pointerEvents: "none" }}
      />

      {/* Center Arrow Indicator */}
      <div className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30">
        <div className="relative flex items-center">
          {/* Arrow character */}
          <div
            className="text-2xl sm:text-3xl lg:text-4xl font-bold select-none"
            style={{
              color: accentColors[1],
              filter: `drop-shadow(0 0 10px ${accentColors[1]}60)`,
              textShadow: `0 0 20px ${accentColors[1]}40`,
            }}
          >
            ▶
          </div>
          {/* Glow effect behind arrow */}
          <div
            className="absolute inset-0 text-2xl sm:text-3xl lg:text-4xl font-bold select-none"
            style={{
              color: accentColors[3],
              filter: "blur(4px)",
              opacity: 0.6,
            }}
          >
            ▶
          </div>
        </div>
      </div>
    </div>
  );
}
