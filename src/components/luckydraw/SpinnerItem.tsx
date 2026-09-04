import React from "react";
import { cn } from "@/lib/utils";

/**
 * Row palettes. "light" is the original look used by the admin screen; the
 * other two exist for the public view-only page's alternate skins.
 */
export type ReelTheme =
  | "light"
  | "dark"
  | "arcade"
  | "pixel"
  | "pixel-lcd"
  | "pixel-quest";

/**
 * Row palettes for the three pixel skins. All hard edges — no radius, no blur,
 * and a stepped drop shadow rather than a soft one, because anything smooth
 * breaks the illusion. Colours stay on the PayPal ramp throughout.
 */
const PIXEL_PALETTES = {
  pixel: {
    centerBg: "#ffffff",
    centerBorder: "#173066",
    centerText: "#173066",
    rowBg: "rgba(80, 155, 255, 0.10)",
    rowBorder: "rgba(99, 203, 251, 0.35)",
    rowText: "#7fb7ff",
    shadow: null, // falls back to the draw's accent
  },
  "pixel-lcd": {
    centerBg: "#173066",
    centerBorder: "#0a1638",
    centerText: "#e8f1ff",
    rowBg: "rgba(23, 48, 102, 0.08)",
    rowBorder: "rgba(23, 48, 102, 0.28)",
    rowText: "#3c5f9e",
    shadow: "#7a9bd4",
  },
  "pixel-quest": {
    centerBg: "#63cbfb",
    centerBorder: "#ffffff",
    centerText: "#0a1638",
    rowBg: "rgba(10, 22, 56, 0.72)",
    rowBorder: "#2a4a86",
    rowText: "#a9c7f5",
    shadow: "#0463ce",
  },
} as const;

const isPixelTheme = (theme: ReelTheme): theme is keyof typeof PIXEL_PALETTES =>
  theme in PIXEL_PALETTES;

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

  if (isPixelTheme(theme)) {
    const p = PIXEL_PALETTES[theme];
    return {
      borderRadius: 0,
      background: isCenter ? p.centerBg : p.rowBg,
      border: isCenter
        ? `4px solid ${p.centerBorder}`
        : `2px solid ${p.rowBorder}`,
      boxShadow: isCenter ? `6px 6px 0 0 ${p.shadow ?? accent}` : "none",
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
  if (isPixelTheme(theme)) {
    const p = PIXEL_PALETTES[theme];
    return isCenter ? p.centerText : p.rowText;
  }
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

    const isPixel = isPixelTheme(theme);

    const textStyle = React.useMemo(
      () => ({
        color: textColorFor(theme, isCenter),
        // Press Start 2P runs much wider than a proportional face, so the
        // pixel skin needs its own, smaller ramp to fit the same row.
        fontSize: isPixel
          ? isCenter
            ? "clamp(0.9rem, 3vw, 1.6rem)"
            : "clamp(0.55rem, 1.8vw, 0.95rem)"
          : isCenter
          ? "clamp(1.25rem, 4vw, 2.25rem)"
          : "clamp(0.875rem, 2.5vw, 1.5rem)",
        fontWeight: isPixel ? 400 : isCenter ? 800 : 500,
        letterSpacing: isPixel ? "0" : isCenter ? "0.02em" : "0.01em",
        textShadow:
          isCenter && theme === "light" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
        willChange: "transform",
      }),
      [theme, isCenter, isPixel]
    );

    return (
      <div
        className="absolute left-0 right-0 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12"
        style={containerStyle}
      >
        <div
          className={cn(
            "relative px-4 sm:px-6 lg:px-10 py-2 sm:py-3 lg:py-4 overflow-hidden",
            isPixel
              ? "font-pixel"
              : "rounded-xl sm:rounded-2xl transition-all duration-300"
          )}
          style={cardStyle}
        >
          <span
            className={cn(
              "relative z-10 block text-center",
              isPixel
                ? "font-normal"
                : cn(
                    "font-semibold transition-all duration-300",
                    isCenter && "font-bold"
                  )
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
