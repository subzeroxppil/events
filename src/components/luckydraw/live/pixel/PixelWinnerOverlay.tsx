"use client";

import { motion, AnimatePresence } from "framer-motion";
import { pixelFontVars } from "@/lib/pixel-font";
import {
  DEFAULT_PIXEL_VARIANT,
  type PixelVariant,
} from "@/components/luckydraw/live/pixel/variants";

interface PixelWinnerOverlayProps {
  show: boolean;
  winner: string | null;
  winnerName?: string;
  variant?: PixelVariant;
}

/**
 * Winner reveal for the pixel skins.
 *
 * A separate component rather than a tone on the shared WinnerOverlay: that one
 * is built on blur, gradient text and spring scaling, none of which survive
 * being made pixel-accurate. This one snaps into place instead.
 */
export default function PixelWinnerOverlay({
  show,
  winner,
  winnerName,
  variant = DEFAULT_PIXEL_VARIANT,
}: PixelWinnerOverlayProps) {
  const scrim =
    variant.backdrop === "dots"
      ? "rgba(214, 228, 248, 0.94)"
      : "rgba(5, 13, 34, 0.92)";

  return (
    <AnimatePresence>
      {show && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`${pixelFontVars} fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-none`}
          style={{ background: scrim }}
        >
          <motion.div
            // Two hard steps rather than a spring — it should land, not settle.
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0, 0, 1, 1] }}
            className="w-full max-w-lg text-center px-5 py-7 sm:px-8 sm:py-9"
            style={{
              background: variant.panelFill,
              border: `4px solid ${variant.panelBorder}`,
              boxShadow: `0 0 0 4px ${variant.panelOutline}, 10px 10px 0 0 ${variant.panelShadow}`,
              borderRadius: 0,
            }}
          >
            <div
              className="pixel-blink font-pixel text-[10px] sm:text-xs tracking-[0.24em]"
              style={{ color: variant.accent }}
            >
              ★ WINNER ★
            </div>

            <div
              className="mt-5 font-pixel text-xl sm:text-3xl leading-[1.5] [overflow-wrap:anywhere]"
              style={{ color: variant.text, textShadow: variant.titleShadow }}
            >
              {winner}
            </div>

            {winnerName && (
              <div
                className="mt-4 font-pixel-body text-2xl sm:text-3xl leading-none"
                style={{ color: variant.accent }}
              >
                {winnerName}
              </div>
            )}

            <div
              className="mt-6 font-pixel text-[9px] sm:text-[11px] tracking-[0.16em]"
              style={{ color: variant.dim }}
            >
              CONGRATULATIONS!
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
