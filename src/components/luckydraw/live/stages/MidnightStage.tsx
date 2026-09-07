"use client";

import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import LiveBadge from "@/components/luckydraw/live/LiveBadge";
import MuteButton from "@/components/luckydraw/live/MuteButton";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import { useRootBackground } from "@/app/hooks/use-viewport-height";

/**
 * "Midnight" skin — a dark stage with a spotlight on the centre row. Built for
 * a dimmed hall, where the light skin is the brightest thing in the room.
 */
const MIDNIGHT_BACKGROUND =
  "radial-gradient(130% 80% at 50% 0%, #123163 0%, #0a1836 38%, #03081c 100%)";
/** The colour the gradient ends on — see `useRootBackground`. */
const MIDNIGHT_BASE = "#03081c";

export default function MidnightStage({ live }: LiveStageProps) {
  const glow = live.accentColors[3];

  useRootBackground(MIDNIGHT_BACKGROUND, MIDNIGHT_BASE);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: MIDNIGHT_BACKGROUND,
      }}
    >
      {/* Spotlight cone onto the centre row */}
      <div
        className="absolute inset-x-0 top-0 h-2/3 z-0 pointer-events-none"
        style={{
          background: `conic-gradient(from 180deg at 50% 0%, transparent 0deg, ${glow}26 78deg, ${glow}33 90deg, ${glow}26 102deg, transparent 180deg)`,
          filter: "blur(6px)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130vw] h-40 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(50% 50% at 50% 50%, ${glow}33 0%, transparent 72%)`,
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(100% 65% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col">
        <header className="relative z-20 shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
          <div className="flex items-center justify-between gap-2">
            <LiveBadge connected={live.connected} tone="dark" />
            <MuteButton
              muted={live.muted}
              onToggle={live.toggleMuted}
              tone="dark"
            />
          </div>
          <h1
            className="mt-1.5 text-base sm:text-xl font-extrabold tracking-tight leading-tight text-center truncate px-8 text-white"
            style={{ textShadow: `0 0 24px ${glow}66` }}
          >
            {live.snapshot?.name}
          </h1>
        </header>

        {/* Carries the bottom safe-area inset now that the previous-winner
            readout that used to hold it is gone. */}
        <main className="flex-1 min-h-0 flex items-center justify-center pb-[calc(env(safe-area-inset-bottom)+0.6rem)]">
          <div className="relative w-full max-w-sm sm:max-w-2xl h-full">
            <SpinnerReel
              spinnerItems={live.spinnerItems}
              centerIndex={live.centerIndex}
              animationOffset={live.animationOffset}
              itemHeight={live.itemHeight}
              visibleRange={live.settings.visibleRange}
              centerItemScale={live.settings.centerItemScale}
              nearCenterScale={live.settings.nearCenterScale}
              maxBlur={live.settings.maxBlur}
              accentColors={live.accentColors}
              isAnimating={live.isIdleAnimating || live.isSpinning}
              theme="dark"
              fadeHeight="5rem"
            />
            {/* Rails framing the winning row */}
            <div
              className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-[25] pointer-events-none rounded-2xl"
              style={{
                height: live.itemHeight * live.settings.centerItemScale + 12,
                borderTop: `1px solid ${glow}66`,
                borderBottom: `1px solid ${glow}66`,
                boxShadow: `0 0 30px ${glow}26`,
              }}
            />
          </div>
        </main>

      </div>

      <WinnerOverlay
        show={live.showWinner}
        winner={live.currentWinner}
        winnerName={
          live.currentWinner
            ? live.snapshot?.corpIdMapping?.[live.currentWinner]
            : undefined
        }
        accentColors={live.accentColors}
        tone="dark"
      />
    </div>
  );
}
