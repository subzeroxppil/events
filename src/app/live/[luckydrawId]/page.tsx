"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import LiveWelcome, {
  DEFAULT_WELCOME_TONE,
  type WelcomeTone,
} from "@/components/luckydraw/live/LiveWelcome";
import AuroraStage from "@/components/luckydraw/live/stages/AuroraStage";
import MidnightStage from "@/components/luckydraw/live/stages/MidnightStage";
import ArcadeStage from "@/components/luckydraw/live/stages/ArcadeStage";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import {
  LIVE_VIEWPORT_STYLE,
  useViewportHeight,
} from "@/app/hooks/use-viewport-height";
import { useLiveDraw } from "./use-live-draw";

/**
 * Visual skins for the public draw. All three run the identical draw logic —
 * they differ only in how they are painted, so one can be picked by taste on
 * the day without any risk to the sync.
 *
 * Chosen with `?ui=`; anything unrecognised falls back to "aurora".
 */
const SKINS: Record<
  string,
  { Stage: (props: LiveStageProps) => React.ReactElement; welcome: WelcomeTone }
> = {
  aurora: { Stage: AuroraStage, welcome: DEFAULT_WELCOME_TONE },
  midnight: {
    Stage: MidnightStage,
    welcome: {
      background:
        "radial-gradient(130% 90% at 50% -5%, #123163 0%, #0a1836 40%, #03081c 100%)",
      orb: "#63cbfb",
      accent: "linear-gradient(180deg, #9fe3ff 0%, #63cbfb 45%, #2f9fe6 100%)",
      accentText: "#02122e",
      accentShadow: "#12588f",
      confetti: ["#63cbfb", "#509bff", "#ffffff", "#7fd8ff"],
    },
  },
  arcade: {
    Stage: ArcadeStage,
    welcome: {
      background:
        "linear-gradient(165deg, #0463ce 0%, #123f8f 55%, #0b2258 100%)",
      orb: "#ffd166",
      accent: "linear-gradient(180deg, #ffe9a8 0%, #ffd166 45%, #f2a900 100%)",
      accentText: "#3a2100",
      accentShadow: "#a86f00",
      confetti: ["#ffd166", "#63cbfb", "#ffffff", "#509bff"],
    },
  },
};

const FALLBACK_BACKGROUND =
  "radial-gradient(120% 90% at 50% -10%, #1e4fa8 0%, #10265c 45%, #071634 100%)";

export default function LiveLuckyDrawPage() {
  return (
    <Suspense fallback={<LiveShell><LoadingSpinner /></LiveShell>}>
      <LiveLuckyDraw />
    </Suspense>
  );
}

function LiveLuckyDraw() {
  const params = useParams();
  const searchParams = useSearchParams();

  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  const skin = SKINS[searchParams.get("ui") ?? ""] ?? SKINS.aurora;
  const live = useLiveDraw(luckydrawId);

  useViewportHeight();

  if (live.status === "loading") {
    return (
      <LiveShell>
        <LoadingSpinner />
      </LiveShell>
    );
  }

  if (live.status === "not-live" || live.status === "error") {
    return (
      <LiveShell>
        <div className="px-8 text-center max-w-xs">
          <div className="text-lg font-bold text-white">
            {live.status === "error"
              ? "Something went wrong"
              : "This lucky draw isn't live yet"}
          </div>
          <p className="mt-2 text-sm text-white/65 leading-relaxed">
            {live.status === "error"
              ? "Please refresh the page to try again."
              : "Keep this page open — it starts by itself the moment the draw goes live."}
          </p>
        </div>
      </LiveShell>
    );
  }

  const { Stage } = skin;

  return (
    <div
      className="fixed inset-x-0 top-0 w-full overflow-hidden overscroll-none"
      style={LIVE_VIEWPORT_STYLE}
    >
      <Stage live={live} />

      {!live.started && (
        <LiveWelcome
          drawName={live.snapshot?.name}
          participantCount={live.snapshot?.participants.length ?? 0}
          winnerCount={live.winners.length}
          onEnter={live.enter}
          tone={skin.welcome}
        />
      )}
    </div>
  );
}

/** Full-bleed branded box used for the loading, not-live and error states. */
function LiveShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 top-0 w-full flex items-center justify-center overflow-hidden"
      style={{ ...LIVE_VIEWPORT_STYLE, background: FALLBACK_BACKGROUND }}
    >
      {children}
    </div>
  );
}
