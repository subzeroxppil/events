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
import PixelStage from "@/components/luckydraw/live/stages/PixelStage";
import PixelWelcome from "@/components/luckydraw/live/pixel/PixelWelcome";
import {
  PIXEL_VARIANTS,
  type PixelVariant,
} from "@/components/luckydraw/live/pixel/variants";
import type { LiveStageProps } from "@/components/luckydraw/live/types";
import {
  LIVE_VIEWPORT_CLASS,
  useFullHeightPage,
  useRootBackground,
} from "@/app/hooks/use-viewport-height";
import { useFirstOpenReload } from "./use-first-open-reload";
import { useLiveDraw } from "./use-live-draw";

/**
 * Visual skins for the public draw. All three run the identical draw logic —
 * they differ only in how they are painted, so one can be picked by taste on
 * the day without any risk to the sync.
 *
 * Chosen with `?ui=`; a bare URL, or anything unrecognised, gets the
 * handheld-LCD pixel skin.
 */
type WelcomeProps = {
  drawName?: string;
  participantCount: number;
  winnerCount: number;
  onEnter: () => void;
};

type Skin = {
  Stage: (props: LiveStageProps) => React.ReactElement;
  /** Tone for the shared welcome screen. */
  welcome: WelcomeTone;
  /** Replaces the shared welcome entirely, when a skin needs its own. */
  Welcome?: (props: WelcomeProps) => React.ReactElement;
};

const SKINS: Record<string, Skin> = {
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
  ...pixelSkins(),
};

/**
 * The three pixel skins, each on its own `?ui=` value. They share one stage and
 * one title screen and differ only through the variant table, so picking
 * between them is a palette decision rather than three codebases.
 */
function pixelSkins(): Record<string, Skin> {
  const bind = (variant: PixelVariant): Skin => ({
    Stage: (props: LiveStageProps) => (
      <PixelStage {...props} variant={variant} />
    ),
    // Nothing of the shared welcome survives the pixel treatment, so these
    // skins bring their own title screen; `welcome` is unused but keeps the
    // shape uniform.
    Welcome: (props: WelcomeProps) => (
      <PixelWelcome {...props} variant={variant} />
    ),
    welcome: DEFAULT_WELCOME_TONE,
  });

  return Object.fromEntries(
    Object.entries(PIXEL_VARIANTS).map(([id, variant]) => [id, bind(variant)])
  );
}

const FALLBACK_BACKGROUND =
  "radial-gradient(120% 90% at 50% -10%, #1e4fa8 0%, #10265c 45%, #071634 100%)";
/** The colour the fallback gradient ends on — see `useRootBackground`. */
const FALLBACK_BASE = "#071634";

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

  const skin = SKINS[searchParams.get("ui") ?? ""] ?? SKINS["pixel-lcd"];
  const live = useLiveDraw(luckydrawId);

  // Spend one reload on the first arrival in this tab, before anything else
  // gets attached to a document we didn't load ourselves.
  useFirstOpenReload(luckydrawId);
  useFullHeightPage();

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
  const Welcome = skin.Welcome;

  return (
    <div className={LIVE_VIEWPORT_CLASS}>
      <Stage live={live} />

      {!live.started &&
        (Welcome ? (
          <Welcome
            drawName={live.snapshot?.name}
            participantCount={live.snapshot?.participants.length ?? 0}
            winnerCount={live.winners.length}
            onEnter={live.enter}
          />
        ) : (
          <LiveWelcome
            drawName={live.snapshot?.name}
            participantCount={live.snapshot?.participants.length ?? 0}
            winnerCount={live.winners.length}
            onEnter={live.enter}
            tone={skin.welcome}
          />
        ))}
    </div>
  );
}

/** Full-bleed branded box used for the loading, not-live and error states. */
function LiveShell({ children }: { children: React.ReactNode }) {
  useRootBackground(FALLBACK_BACKGROUND, FALLBACK_BASE);
  return (
    <div
      className={`${LIVE_VIEWPORT_CLASS} flex items-center justify-center`}
      style={{ background: FALLBACK_BACKGROUND }}
    >
      {children}
    </div>
  );
}
