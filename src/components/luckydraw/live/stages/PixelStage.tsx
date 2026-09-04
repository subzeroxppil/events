"use client";

import { Volume2, VolumeX } from "lucide-react";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import { formatWonAt } from "@/components/luckydraw/live/format";
import { pixelFontVars } from "@/lib/pixel-font";
import {
  PixelBackdrop,
  PixelCrt,
  PixelLive,
  PixelSelectionFrame,
  pixelFrameStyle,
} from "@/components/luckydraw/live/pixel/PixelChrome";
import PixelWinnerOverlay from "@/components/luckydraw/live/pixel/PixelWinnerOverlay";
import {
  DEFAULT_PIXEL_VARIANT,
  type PixelVariant,
} from "@/components/luckydraw/live/pixel/variants";

/**
 * The draw as an 8-bit cabinet screen, on the PayPal palette.
 *
 * The reel's own blur is switched off and its ends dissolve in hard bands
 * instead; distant rows are not blurred either (`maxBlur` is forced to 0),
 * because a soft edge anywhere gives the whole thing away.
 */
export default function PixelStage({
  live,
  variant = DEFAULT_PIXEL_VARIANT,
}: LiveStageProps & { variant?: PixelVariant }) {
  const latest = live.winners[live.winners.length - 1];

  return (
    <div
      className={`${pixelFontVars} relative h-full w-full overflow-hidden`}
      style={{ background: variant.background }}
    >
      <PixelBackdrop variant={variant} />
      <PixelCrt variant={variant} />

      <div className="relative z-10 h-full w-full flex flex-col">
        {/* HUD */}
        <header className="relative z-20 shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
          <div className="flex items-center justify-between gap-2">
            <PixelLive variant={variant} connected={live.connected} />
            <button
              type="button"
              onClick={live.toggleMuted}
              aria-label={live.muted ? "Unmute" : "Mute"}
              className="flex items-center justify-center w-8 h-8 transition-transform duration-75 active:translate-x-[2px] active:translate-y-[2px]"
              style={{
                background: variant.panelFill,
                border: `2px solid ${variant.accent}`,
                color: variant.text,
                borderRadius: 0,
              }}
            >
              {live.muted ? (
                <VolumeX className="w-4 h-4" aria-hidden />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden />
              )}
            </button>
          </div>

          <h1
            className="mt-2 font-pixel text-[10px] sm:text-xs leading-[1.6] uppercase text-center truncate px-2"
            style={{ color: variant.text, textShadow: variant.titleShadow }}
          >
            {live.snapshot?.name}
          </h1>

          <div
            className="mt-1.5 flex items-center justify-center gap-4 font-pixel text-[7px] tracking-[0.14em]"
            style={{ color: variant.dim }}
          >
            <span>PLAYERS {live.snapshot?.participants.length ?? 0}</span>
            <span>DRAWN {live.winners.length}</span>
          </div>
        </header>

        {/* Reel window */}
        <main className="flex-1 min-h-0 mt-2 px-3 pb-1">
          <div
            className="relative h-full w-full max-w-sm sm:max-w-2xl mx-auto"
            style={pixelFrameStyle(variant)}
          >
            <SpinnerReel
              spinnerItems={live.spinnerItems}
              centerIndex={live.centerIndex}
              animationOffset={live.animationOffset}
              itemHeight={live.itemHeight}
              visibleRange={live.settings.visibleRange}
              centerItemScale={live.settings.centerItemScale}
              nearCenterScale={live.settings.nearCenterScale}
              maxBlur={0}
              accentColors={live.accentColors}
              isAnimating={live.isIdleAnimating || live.isSpinning}
              theme={variant.reelTheme}
              blurEdges={false}
              fade="stepped"
              arrow="pixel"
            />
            <PixelSelectionFrame
              variant={variant}
              height={live.itemHeight * live.settings.centerItemScale + 10}
            />
          </div>
        </main>

        {/* Last winner readout */}
        <footer className="relative z-20 shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-1 flex justify-center">
          <div
            className="flex items-center gap-2 px-3 py-1.5 max-w-full"
            style={{
              background: variant.panelFill,
              border: `2px solid ${variant.accent}`,
              borderRadius: 0,
            }}
          >
            <span
              className="font-pixel text-[7px] tracking-[0.14em] shrink-0"
              style={{ color: variant.dim }}
            >
              LAST
            </span>
            <span
              className="font-pixel text-[10px] truncate"
              style={{ color: variant.text }}
            >
              {latest ? latest.workId : "----"}
            </span>
            {latest && (
              <span
                className="font-pixel-body text-lg leading-none shrink-0"
                style={{ color: variant.dim }}
              >
                {formatWonAt(latest.wonAt)}
              </span>
            )}
          </div>
        </footer>
      </div>

      <PixelWinnerOverlay
        variant={variant}
        show={live.showWinner}
        winner={live.currentWinner}
        winnerName={
          live.currentWinner
            ? live.snapshot?.corpIdMapping?.[live.currentWinner]
            : undefined
        }
      />
    </div>
  );
}
