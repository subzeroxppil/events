"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import LiveBadge from "@/components/luckydraw/live/LiveBadge";
import MuteButton from "@/components/luckydraw/live/MuteButton";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import { formatWonAt } from "@/components/luckydraw/live/format";
import { useRootBackground } from "@/app/hooks/use-viewport-height";

/**
 * "Arcade" skin — the reel sits inside a physical-looking machine cabinet on a
 * saturated PayPal-blue ground. The most gamified of the three.
 */
const ARCADE_BACKGROUND =
  "linear-gradient(165deg, #0463ce 0%, #123f8f 55%, #0b2258 100%)";
/** The colour the gradient ends on — see `useRootBackground`. */
const ARCADE_BASE = "#0b2258";

export default function ArcadeStage({ live }: LiveStageProps) {
  const latest = live.winners[live.winners.length - 1];
  const accent = live.accentColors[1];

  useRootBackground(ARCADE_BACKGROUND, ARCADE_BASE);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: ARCADE_BACKGROUND,
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.16]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="absolute -top-24 -right-16 w-72 h-72 rounded-full z-0 pointer-events-none live-orb"
        style={{
          background: `radial-gradient(circle, ${live.accentColors[3]}55 0%, transparent 70%)`,
          filter: "blur(18px)",
        }}
      />

      <div className="relative z-10 h-full w-full flex flex-col px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)] pb-[calc(env(safe-area-inset-bottom)+0.6rem)]">
        {/* Header. The name gets its own row in portrait — squeezing it
            beside the badges truncated most real draw names. */}
        <header className="relative z-20 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 rounded-lg bg-white px-1.5 py-1 shadow-md">
              <Image
                src="/paypal_logo2.png"
                alt="PayPal"
                width={40}
                height={40}
                className="w-4 h-4"
              />
            </span>
            <h1 className="hidden landscape:block flex-1 min-w-0 text-lg font-extrabold tracking-tight text-white truncate">
              {live.snapshot?.name}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <LiveBadge connected={live.connected} tone="dark" />
              <MuteButton
                muted={live.muted}
                onToggle={live.toggleMuted}
                tone="dark"
              />
            </div>
          </div>
          <h1 className="landscape:hidden mt-1.5 text-base sm:text-lg font-extrabold tracking-tight text-white text-center truncate">
            {live.snapshot?.name}
          </h1>
        </header>

        {/* Cabinet */}
        <main className="flex-1 min-h-0 mt-2 landscape:mt-1.5">
          <div
            className="relative h-full w-full max-w-sm sm:max-w-2xl mx-auto rounded-3xl overflow-hidden border border-white/25"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
              boxShadow:
                "inset 0 2px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.25), 0 22px 50px rgba(3,14,45,0.45)",
            }}
          >
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
              theme="arcade"
              fadeHeight="4rem"
            />

            {/* Bracket corners around the winning row */}
            <WinBrackets
              height={live.itemHeight * live.settings.centerItemScale + 14}
              color="#ffffff"
              accent={accent}
            />
          </div>
        </main>

        {/* Previous winner ticket */}
        <footer className="relative z-20 shrink-0 mt-2 flex justify-center">
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-white shadow-[0_8px_0_-2px_rgba(3,14,45,0.35)] max-w-full min-h-[2.25rem]">
            <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-gray-500 shrink-0">
              Last
            </span>
            <span className="text-sm font-extrabold text-gray-900 truncate">
              {latest ? latest.workId : "—"}
            </span>
            {latest && (
              <span className="text-xs text-gray-400 shrink-0">
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
        tone="dark"
      />
    </div>
  );
}

function WinBrackets({
  height,
  color,
  accent,
}: {
  height: number;
  color: string;
  accent: string;
}) {
  const corner = "w-4 h-4 absolute";
  const line = `2px solid ${color}`;
  return (
    <div
      className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
      style={{ height, filter: `drop-shadow(0 0 6px ${accent}aa)` }}
    >
      <span
        className={`${corner} left-0 top-0`}
        style={{ borderLeft: line, borderTop: line, borderTopLeftRadius: 6 }}
      />
      <span
        className={`${corner} right-0 top-0`}
        style={{ borderRight: line, borderTop: line, borderTopRightRadius: 6 }}
      />
      <span
        className={`${corner} left-0 bottom-0`}
        style={{
          borderLeft: line,
          borderBottom: line,
          borderBottomLeftRadius: 6,
        }}
      />
      <span
        className={`${corner} right-0 bottom-0`}
        style={{
          borderRight: line,
          borderBottom: line,
          borderBottomRightRadius: 6,
        }}
      />
    </div>
  );
}
