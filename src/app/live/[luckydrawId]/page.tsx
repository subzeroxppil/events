"use client";

import { Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useSearchParams } from "next/navigation";
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
import LiveWelcomeSkeleton, {
  type LiveChrome,
} from "@/components/luckydraw/live/LiveWelcomeSkeleton";
import {
  LIVE_VIEWPORT_CLASS,
  useFullHeightPage,
  useRootBackground,
} from "@/app/hooks/use-viewport-height";
import { useFirstOpenReload } from "@/lib/use-first-open-reload";
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
  /**
   * Palette for the states that exist before the draw's content does —
   * loading, not-live, error. Taken from the skin so those states never flash
   * a colour the page does not otherwise use.
   */
  chrome: LiveChrome;
};

/** Chrome for the light Aurora skin. */
const AURORA_CHROME: LiveChrome = {
  background: "linear-gradient(180deg, #ffffff 0%, #eaf2ff 55%, #d7e6fb 100%)",
  base: "#d7e6fb",
  block: "rgba(4, 99, 206, 0.13)",
  text: "#173066",
  dim: "rgba(23, 48, 102, 0.65)",
};

const SKINS: Record<string, Skin> = {
  aurora: {
    Stage: AuroraStage,
    welcome: DEFAULT_WELCOME_TONE,
    chrome: AURORA_CHROME,
  },
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
    chrome: {
      background:
        "radial-gradient(130% 90% at 50% -5%, #123163 0%, #0a1836 40%, #03081c 100%)",
      base: "#03081c",
      block: "rgba(159, 227, 255, 0.16)",
      text: "#ffffff",
      dim: "rgba(255, 255, 255, 0.65)",
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
    chrome: {
      background:
        "linear-gradient(165deg, #0463ce 0%, #123f8f 55%, #0b2258 100%)",
      base: "#0b2258",
      block: "rgba(255, 209, 102, 0.2)",
      text: "#ffffff",
      dim: "rgba(255, 255, 255, 0.7)",
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
    chrome: {
      background: variant.background,
      base: variant.backgroundBase,
      block: variant.panelFill,
      text: variant.text,
      dim: variant.dim,
    },
  });

  return Object.fromEntries(
    Object.entries(PIXEL_VARIANTS).map(([id, variant]) => [id, bind(variant)])
  );
}

/**
 * Used only before the skin is known — i.e. inside the Suspense fallback,
 * which resolves in the same tick that `useSearchParams` does. Matches the
 * default skin so there is no flash between the two.
 */
const DEFAULT_CHROME: LiveChrome = PIXEL_VARIANTS["pixel-lcd"]
  ? {
      background: PIXEL_VARIANTS["pixel-lcd"].background,
      base: PIXEL_VARIANTS["pixel-lcd"].backgroundBase,
      block: PIXEL_VARIANTS["pixel-lcd"].panelFill,
      text: PIXEL_VARIANTS["pixel-lcd"].text,
      dim: PIXEL_VARIANTS["pixel-lcd"].dim,
    }
  : {
      background: "linear-gradient(180deg, #eaf2ff 0%, #d3e2f8 55%, #b9cdec 100%)",
      base: "#b9cdec",
      block: "rgba(255, 255, 255, 0.7)",
      text: "#173066",
      dim: "#4e74b8",
    };

export default function LiveLuckyDrawPage() {
  return (
    <Suspense
      fallback={
        <LiveShell chrome={DEFAULT_CHROME}>
          <LiveWelcomeSkeleton chrome={DEFAULT_CHROME} />
        </LiveShell>
      }
    >
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
  // `?sound=arcade` opts this viewer into the synthesised arcade soundtrack.
  const live = useLiveDraw(luckydrawId, searchParams.get("sound") === "arcade");

  // Spend one reload on the first arrival in this tab, before anything else
  // gets attached to a document we didn't load ourselves.
  useFirstOpenReload("live-reloaded:", luckydrawId);
  useFullHeightPage();

  const chrome = skin.chrome;

  if (live.status === "loading") {
    return (
      <LiveShell chrome={chrome}>
        <LiveWelcomeSkeleton chrome={chrome} />
      </LiveShell>
    );
  }

  if (live.status === "not-live" || live.status === "error") {
    return (
      <LiveShell chrome={chrome}>
        <motion.div
          className="px-8 text-center max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-lg font-bold" style={{ color: chrome.text }}>
            {live.status === "error"
              ? "Something went wrong"
              : "This lucky draw isn't live yet"}
          </div>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: chrome.dim }}
          >
            {live.status === "error"
              ? "Please refresh the page to try again."
              : "Keep this page open — it starts by itself the moment the draw goes live."}
          </p>
        </motion.div>
      </LiveShell>
    );
  }

  const { Stage } = skin;
  const Welcome = skin.Welcome;

  return (
    <div className={LIVE_VIEWPORT_CLASS}>
      {/* The stage is mounted under the welcome from the start — it is what
          the welcome dissolves to reveal, so it must already be there and
          already drifting, not appear once the welcome has gone. */}
      <motion.div
        className="h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: live.started ? 1 : 1.04 }}
        transition={{
          opacity: { duration: 0.5, ease: "easeOut" },
          scale: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        <Stage live={live} />
      </motion.div>

      <AnimatePresence>
        {!live.started && (
          <motion.div
            key="welcome"
            className="absolute inset-0 z-50"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            // Lifts and fades rather than simply vanishing, so pressing Enter
            // reads as being let through to the draw.
            exit={{ opacity: 0, y: -18, scale: 0.97 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {Welcome ? (
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Full-bleed box used for the loading, not-live and error states, painted in
 * the selected skin's own colours rather than one fixed blue — so arriving at
 * the page is a single fade into the skin, not a colour change followed by a
 * layout change.
 */
function LiveShell({
  chrome,
  children,
}: {
  chrome: LiveChrome;
  children: React.ReactNode;
}) {
  useRootBackground(chrome.background, chrome.base);
  return (
    <div
      className={`${LIVE_VIEWPORT_CLASS} flex items-center justify-center`}
      style={{ background: chrome.background }}
    >
      {children}
    </div>
  );
}
