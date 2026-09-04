import React from "react";
import { cn } from "@/lib/utils";

/**
 * Row palettes. "light" is the original look used by the admin screen; the
 * other two exist for the public view-only page's alternate skins.
 */
export type ReelTheme = "light" | "dark" | "arcade";

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
  theme?: ReelTheme;
  /** Accent used for the centre row's glow on the non-light themes. */
  accent?: string;
}

const cardStyleFor = (
  theme: ReelTheme,
  isCenter: boolean,
  accent: string
): React.CSSProperties => {
  if (theme === "dark") {
    return {
      background: isCenter
        ? "linear-gradient(180deg, #ffffff 0%, #eef4ff 100%)"
        : "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px) saturate(140%)",
      WebkitBackdropFilter: "blur(10px) saturate(140%)",
      border: isCenter
        ? "1px solid rgba(255,255,255,0.85)"
        : "1px solid rgba(255,255,255,0.08)",
      boxShadow: isCenter
        ? `0 0 44px ${accent}80, 0 10px 34px rgba(0,0,0,0.45)`
        : "none",
    };
  }

  if (theme === "arcade") {
    return {
      background: isCenter ? "#ffffff" : "rgba(255, 255, 255, 0.14)",
      backdropFilter: "blur(8px) saturate(150%)",
      WebkitBackdropFilter: "blur(8px) saturate(150%)",
      border: isCenter
        ? `2px solid ${accent}`
        : "1px solid rgba(255,255,255,0.22)",
      boxShadow: isCenter
        ? `0 10px 0 -2px ${accent}55, 0 14px 36px rgba(9, 26, 66, 0.35)`
        : "none",
    };
  }

  return {
    background: isCenter ? "white" : "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px) saturate(150%)",
    WebkitBackdropFilter: "blur(10px) saturate(150%)",
    border: isCenter
      ? "1px solid rgba(255, 255, 255, 0.2)"
      : "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: isCenter
      ? "0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
      : "0 4px 16px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  };
};

const textColorFor = (theme: ReelTheme, isCenter: boolean): string => {
  if (isCenter) return theme === "light" ? "#000000" : "#0b1220";
  if (theme === "dark") return "rgba(203, 213, 225, 0.72)";
  if (theme === "arcade") return "rgba(255, 255, 255, 0.86)";
  return "#6B7280";
};

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
    theme = "light",
    accent = "#509bff",
  }) => {
    const itemPosition = offset * itemHeight;

    const containerStyle = React.useMemo(
      () => ({
        top: `${itemPosition}px`,
        height: `${itemHeight}px`,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        transform: `translateX(-50%) translateX(50%) scale(${scale})`,
        transition: isAnimating ? "none" : "all 0.4s ease-out",
        willChange: "transform, opacity, filter",
      }),
      [itemPosition, itemHeight, opacity, blur, scale, isAnimating]
    );

    const cardStyle = React.useMemo(
      () => cardStyleFor(theme, isCenter, accent),
      [theme, isCenter, accent]
    );

    const textStyle = React.useMemo(
      () => ({
        color: textColorFor(theme, isCenter),
        fontSize: isCenter
          ? "clamp(1.25rem, 4vw, 2.25rem)"
          : "clamp(0.875rem, 2.5vw, 1.5rem)",
        fontWeight: isCenter ? 800 : 500,
        letterSpacing: isCenter ? "0.02em" : "0.01em",
        textShadow:
          isCenter && theme === "light" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
        willChange: "transform",
      }),
      [theme, isCenter]
    );

    return (
      <div
        className="absolute left-0 right-0 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12"
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
      prevProps.itemHeight === nextProps.itemHeight &&
      prevProps.isCenter === nextProps.isCenter &&
      prevProps.isNearCenter === nextProps.isNearCenter &&
      prevProps.scale === nextProps.scale &&
      prevProps.opacity === nextProps.opacity &&
      prevProps.blur === nextProps.blur &&
      prevProps.isAnimating === nextProps.isAnimating &&
      prevProps.theme === nextProps.theme &&
      prevProps.accent === nextProps.accent
    );
  }
);

SpinnerItem.displayName = "SpinnerItem";

export default SpinnerItem;
