"use client";

import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
  tone?: "light" | "dark";
  className?: string;
}

/** The only control a viewer gets. It activates nothing on the draw itself. */
export default function MuteButton({
  muted,
  onToggle,
  tone = "light",
  className,
}: MuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute" : "Mute"}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-full border shadow-sm backdrop-blur-md transition-colors",
        tone === "dark"
          ? "bg-white/10 border-white/20 text-white/85 hover:bg-white/20"
          : "bg-white/85 border-white/70 text-gray-700 hover:bg-white",
        className
      )}
    >
      {muted ? (
        <VolumeX className="w-4 h-4" aria-hidden />
      ) : (
        <Volume2 className="w-4 h-4" aria-hidden />
      )}
    </button>
  );
}
