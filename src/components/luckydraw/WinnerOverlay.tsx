"use client";

import { motion, AnimatePresence } from "framer-motion";

interface WinnerOverlayProps {
  show: boolean;
  winner: string | null;
  /** Real name for the winning corp id, when the CSV mapping has one. */
  winnerName?: string;
  accentColors: string[];
  /** Text palette. "dark" is for the view-only page's dark skins. */
  tone?: "light" | "dark";
}

/**
 * Full-screen winner reveal. Shared by the admin draw screen and the public
 * view-only page.
 */
export default function WinnerOverlay({
  show,
  winner,
  winnerName,
  accentColors,
  tone = "light",
}: WinnerOverlayProps) {
  const isDark = tone === "dark";
  return (
    <AnimatePresence>
      {show && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: isDark
                ? "radial-gradient(circle at center, rgba(4,12,32,0.72) 0%, rgba(2,6,20,0.92) 100%)"
                : "radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 100%)",
              backdropFilter: "blur(12px) saturate(150%)",
              WebkitBackdropFilter: "blur(12px) saturate(150%)",
            }}
          />

          {/* Winner card container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              duration: 0.6,
            }}
            className="text-center relative px-6 sm:px-10 py-10 sm:py-12 max-w-lg mx-4"
          >
            <div className="relative z-10 text-center flex flex-col items-center">
              {/* Winner label */}
              <motion.div
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-4 sm:mb-6 text-center"
              >
                <div
                  className="text-base sm:text-xl font-medium uppercase tracking-[0.3em] text-center"
                  style={{
                    background: isDark
                      ? `linear-gradient(135deg, ${accentColors[3]} 0%, ${accentColors[1]} 100%)`
                      : `linear-gradient(135deg, ${accentColors[1]} 0%, ${accentColors[2]} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Winner
                </div>
              </motion.div>

              {/* Winner name with subtle glow */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                }}
                className="relative mb-6 sm:mb-8 text-center"
              >
                {/* Subtle glow effect */}
                <motion.div
                  className="absolute -inset-4 rounded-xl opacity-20"
                  style={{
                    background: `radial-gradient(ellipse, ${accentColors[1]}30 0%, transparent 70%)`,
                    filter: "blur(15px)",
                  }}
                  animate={{ opacity: [0.15, 0.25, 0.15] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Winner text */}
                <motion.div
                  className="text-4xl sm:text-6xl lg:text-8xl font-bold tracking-tight text-center break-words px-2"
                  style={{
                    color: isDark ? "#ffffff" : "#1a1a1a",
                    textShadow: isDark
                      ? `0 0 28px ${accentColors[3]}80`
                      : "0 2px 8px rgba(0,0,0,0.1)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {winner}
                </motion.div>

                {winnerName && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight mt-3 sm:mt-4 text-center break-words px-2"
                    style={{
                      color: isDark ? "rgba(226,232,240,0.85)" : "#4a4a4a",
                      textShadow: isDark
                        ? "none"
                        : "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    ({winnerName})
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className={
                  "text-base sm:text-xl lg:text-2xl font-medium tracking-wide text-center " +
                  (isDark ? "text-white/75" : "text-gray-700")
                }
              >
                Congratulations!
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
