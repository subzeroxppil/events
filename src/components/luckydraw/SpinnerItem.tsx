import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerItemProps {
  text: string;
  offset: number;
  itemHeight: number;
  isCenter: boolean;
  isNearCenter: boolean;
  scale: number;
  opacity: number;
  blur: number;
  isAnimating: boolean;
}

const SpinnerItem: React.FC<SpinnerItemProps> = React.memo(
  ({
    text,
    offset,
    itemHeight,
    isCenter,
    isNearCenter,
    scale,
    opacity,
    blur,
    isAnimating,
  }) => {
    const itemPosition = offset * itemHeight;

    const containerStyle = React.useMemo(
      () => ({
        top: `${itemPosition}px`,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        transform: `translateX(-50%) translateX(50%) scale(${scale})`,
        transition: isAnimating ? "none" : "all 0.4s ease-out",
        willChange: "transform, opacity, filter",
      }),
      [itemPosition, opacity, blur, scale, isAnimating]
    );

    const cardStyle = React.useMemo(
      () => ({
        background: isCenter ? "white" : "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px) saturate(150%)",
        WebkitBackdropFilter: "blur(10px) saturate(150%)",
        border: isCenter
          ? "1px solid rgba(255, 255, 255, 0.2)"
          : "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: isCenter
          ? "0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          : "0 4px 16px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }),
      [isCenter]
    );

    const textStyle = React.useMemo(
      () => ({
        color: isCenter ? "#000000" : "#6B7280",
        fontSize: isCenter
          ? "clamp(1.25rem, 4vw, 2.25rem)"
          : "clamp(0.875rem, 2.5vw, 1.5rem)",
        fontWeight: isCenter ? 800 : 500,
        letterSpacing: isCenter ? "0.02em" : "0.01em",
        textShadow: isCenter ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
        willChange: "transform",
      }),
      [isCenter]
    );

    return (
      <div
        className="absolute left-0 right-0 h-16 sm:h-20 lg:h-24 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12"
        style={containerStyle}
      >
        <div
          className={cn(
            "relative px-4 sm:px-6 lg:px-10 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl overflow-hidden",
            "transition-all duration-300"
          )}
          style={cardStyle}
        >
          <span
            className={cn(
              "relative z-10 font-semibold transition-all duration-300 block text-center",
              isCenter && "font-bold"
            )}
            style={textStyle}
          >
            {text}
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.text === nextProps.text &&
      prevProps.offset === nextProps.offset &&
      prevProps.isCenter === nextProps.isCenter &&
      prevProps.isNearCenter === nextProps.isNearCenter &&
      prevProps.scale === nextProps.scale &&
      prevProps.opacity === nextProps.opacity &&
      prevProps.blur === nextProps.blur &&
      prevProps.isAnimating === nextProps.isAnimating
    );
  }
);

SpinnerItem.displayName = "SpinnerItem";

export default SpinnerItem;
