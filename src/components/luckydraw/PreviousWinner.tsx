"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Winner } from "@/lib/luckydraw-live";

interface PreviousWinnerProps {
  winners: Winner[];
  accentColors: string[];
  /**
   * "panel" is the admin screen's left-centre card (hidden below `sm`).
   * "pill"  is the compact bottom-centre chip used on phones, where a
   *         left-pinned panel would sit on top of the reel in landscape.
   */
  variant?: "panel" | "pill";
}

const formatTime = (wonAt: string) =>
  new Date(wonAt).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PreviousWinner({
  winners,
  accentColors,
  variant = "panel",
}: PreviousWinnerProps) {
  const latest = winners[winners.length - 1];

  if (variant === "pill") {
    return (
      <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-4 pointer-events-none">
        <AnimatePresence mode="wait">
          {latest && (
            <motion.div
              key={latest.workId + latest.wonAt}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md bg-white/85 border border-white/70 shadow-lg max-w-full"
            >
              <span
                className="text-[10px] uppercase tracking-[0.18em] font-semibold shrink-0"
                style={{ color: accentColors[2] }}
              >
                Previous
              </span>
              <span className="text-sm font-bold text-gray-900 truncate">
                {latest.workId}
              </span>
              <span className="text-xs text-gray-500 shrink-0">
                {formatTime(latest.wonAt)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="absolute left-2 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative p-4 sm:p-5 lg:p-6 rounded-2xl overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <motion.div className="absolute inset-0 opacity-30" />

            <div className="relative z-10">
              <motion.div
                className="text-sm sm:text-base lg:text-lg uppercase tracking-[0.2em] mb-2 font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${accentColors[1]}99 0%, ${accentColors[2]}99 10%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Previous Winner
              </motion.div>
              <motion.div
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {latest.workId}
              </motion.div>
              <motion.div
                className="text-sm sm:text-base tracking-wide text-gray-600 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {formatTime(latest.wonAt)}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
