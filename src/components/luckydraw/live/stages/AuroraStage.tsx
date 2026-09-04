"use client";

import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import LiveBadge from "@/components/luckydraw/live/LiveBadge";
import MuteButton from "@/components/luckydraw/live/MuteButton";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import { formatWonAt } from "@/components/luckydraw/live/format";

/**
 * Default skin: the admin screen's own palette, rebuilt as a phone-first
 * column so the header and the previous-winner bar can never be pushed under
 * the browser chrome.
 */
export default function AuroraStage({ live }: LiveStageProps) {
  const latest = live.winners[live.winners.length - 1];

  return (
    <div className="relative h-full w-full overflow-hidden" style={live.backgroundStyle}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `rgba(255,255,255,${live.settings.backgroundOverlayOpacity})`,
        }}
      />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120vw] h-64 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(50% 60% at 50% 50%, ${live.accentColors[3]}55 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Header */}
        <header className="relative z-20 shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
          <div className="flex items-center justify-between gap-2">
            <LiveBadge connected={live.connected} />
            <MuteButton muted={live.muted} onToggle={live.toggleMuted} />
          </div>
          <h1 className="mt-1.5 text-base sm:text-xl font-extrabold tracking-tight leading-tight text-gray-900 text-center truncate px-8">
            {live.snapshot?.name}
          </h1>
        </header>

        {/* Reel */}
        <main className="flex-1 min-h-0 flex items-center justify-center">
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
              fadeHeight="5rem"
              showFocusBand
            />
          </div>
        </main>

        {/* Previous winner */}
        <footer className="relative z-20 shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-1 flex justify-center">
          <div className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md bg-white/85 border border-white/70 shadow-lg max-w-full min-h-[2.25rem]">
            <span
              className="text-[10px] uppercase tracking-[0.18em] font-semibold shrink-0"
              style={{ color: live.accentColors[2] }}
            >
              Previous
            </span>
            <span className="text-sm font-bold text-gray-900 truncate">
              {latest ? latest.workId : "—"}
            </span>
            {latest && (
              <span className="text-xs text-gray-500 shrink-0">
                {formatWonAt(latest.wonAt)}
              </span>
            )}
          </div>
        </footer>
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
      />
    </div>
  );
}
