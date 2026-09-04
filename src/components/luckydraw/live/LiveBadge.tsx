"use client";

import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  /** False once the SSE stream drops; the chip switches to "reconnecting". */
  connected: boolean;
  /** Chip styling — light glass on pale backgrounds, dark glass on dark ones. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * The "LIVE" chip with the pulsing red dot. Purely decorative — it reports the
 * stream's state, it does not control anything.
 */
export default function LiveBadge({
  connected,
  tone = "light",
  className,
}: LiveBadgeProps) {
  const dotColor = connected ? "#ef4444" : "#f59e0b";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 border shadow-sm backdrop-blur-md",
        tone === "dark"
          ? "bg-white/10 border-white/20"
          : "bg-white/85 border-white/70",
        className
      )}
    >
      <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
        <span
          className="live-dot-ring absolute inset-0 rounded-full"
          style={{ background: dotColor }}
        />
        <span
          className="live-dot relative w-2 h-2 rounded-full"
          style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
        />
      </span>
      <span
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.16em] leading-none",
          tone === "dark" ? "text-white/90" : "text-gray-800"
        )}
      >
        {connected ? "Live" : "Reconnecting"}
      </span>
    </div>
  );
}
