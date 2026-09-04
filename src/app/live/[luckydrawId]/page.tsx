"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import confetti from "canvas-confetti";
import { Volume2, VolumeX } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import PreviousWinner from "@/components/luckydraw/PreviousWinner";
import { Button } from "@/components/ui/button";
import { useItemHeight } from "@/app/hooks/use-item-height";
import {
  backgroundStyleFor,
  createExtendedList,
  resolveColors,
  rouletteEasing,
  triggerFireworks,
} from "@/lib/luckydraw";
import {
  DEFAULT_VIEW_SETTINGS,
  type ViewSettings,
} from "@/lib/luckydraw-settings";
import type { SpinPayload, Winner } from "@/lib/luckydraw-live";

type Status = "loading" | "not-live" | "ready" | "error";

type Snapshot = {
  name: string;
  participants: string[];
  winners: Winner[];
  corpIdMapping: Record<string, string>;
  lastSpinId: number;
};

const IDLE_ITEM_COUNT = 200;

/**
 * Public, view-only lucky draw display.
 *
 * Renders exactly what the admin screen renders — same reel, easing, sounds
 * and winner reveal — but has no controls at all. Spins arrive over SSE from
 * `/api/live/[luckydrawId]/stream` the moment the admin presses Spin.
 */
export default function LiveLuckyDraw() {
  const params = useParams();
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  const [status, setStatus] = useState<Status>("loading");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);

  const [settings, setSettings] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS);
  const [winners, setWinners] = useState<Winner[]>([]);

  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  const itemHeight = useItemHeight();
  const currentColors = useMemo(() => resolveColors(settings), [settings]);
  const backgroundStyle = useMemo(
    () => backgroundStyleFor(settings),
    [settings]
  );

  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const winnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireworksCleanupRef = useRef<(() => void) | null>(null);

  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  // `muted` and `itemHeight` are read from inside rAF/interval callbacks that
  // outlive the render that created them, so they are mirrored into refs. For
  // itemHeight this also means rotating the phone mid-spin is picked up by the
  // running animation rather than frozen at the pre-rotation value.
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const itemHeightRef = useRef(itemHeight);
  useEffect(() => {
    itemHeightRef.current = itemHeight;
  }, [itemHeight]);

  const soundsOn = useCallback(
    (payloadSettings: ViewSettings) =>
      payloadSettings.enableSounds && !mutedRef.current,
    []
  );

  // ---------------------------------------------------------------- snapshot

  useEffect(() => {
    if (!luckydrawId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/live/${luckydrawId}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("not-live");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");

        const data: Snapshot = await res.json();
        if (cancelled) return;

        setSnapshot(data);
        setWinners(data.winners ?? []);
        setSpinnerItems(
          createExtendedList(
            Array.from(new Set(data.participants ?? [])),
            IDLE_ITEM_COUNT
          )
        );
        setStatus("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus("error");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [luckydrawId]);

  // Retry quietly while the draw isn't shared yet, so the audience can leave
  // the page open and have it come alive when the admin flips the toggle.
  useEffect(() => {
    if (status !== "not-live") return;
    const timer = setInterval(() => window.location.reload(), 10_000);
    return () => clearInterval(timer);
  }, [status]);

  // ------------------------------------------------------------------ audio

  useEffect(() => {
    if (typeof Audio === "undefined") return;

    spinSound.current = new Audio("/sounds/spin4.mp3");
    celebrateSound.current = new Audio("/sounds/celebrate.wav");
    applauseSound.current = new Audio("/sounds/applause1.mp3");

    spinSound.current.load();
    celebrateSound.current.load();
    applauseSound.current.load();

    return () => {
      spinSound.current = null;
      celebrateSound.current = null;
      applauseSound.current = null;
    };
  }, []);

  // ------------------------------------------------------------- animation

  const stopAnimations = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }
  }, []);

  const handleSpinComplete = useCallback(
    (winner: string, payloadSettings: ViewSettings) => {
      setCurrentWinner(winner);

      if (spinSound.current) {
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
        spinSound.current.volume = 1;
      }

      if (soundsOn(payloadSettings)) {
        if (celebrateSound.current) {
          celebrateSound.current.currentTime = 0;
          void celebrateSound.current.play().catch(() => {});
        }
        if (applauseSound.current) {
          applauseSound.current.currentTime = 0;
          void applauseSound.current.play().catch(() => {});
        }
      }

      if (payloadSettings.enableFireworks) {
        fireworksCleanupRef.current?.();
        fireworksCleanupRef.current = triggerFireworks(
          confetti,
          payloadSettings
        );
      }

      setWinners((prev) => [
        ...prev,
        { workId: winner, wonAt: new Date().toISOString() },
      ]);

      setShowWinner(true);
      setIsSpinning(false);

      if (winnerTimeoutRef.current) clearTimeout(winnerTimeoutRef.current);
      winnerTimeoutRef.current = setTimeout(
        () => setShowWinner(false),
        payloadSettings.winnerDisplayDuration
      );
    },
    [soundsOn]
  );

  const runSpin = useCallback(
    (payload: SpinPayload) => {
      stopAnimations();
      setIsIdleAnimating(false);

      const payloadSettings = payload.settings ?? DEFAULT_VIEW_SETTINGS;
      setSettings(payloadSettings);
      setSpinnerItems(payload.spinnerItems);
      setIsSpinning(true);
      setShowWinner(false);
      setCenterIndex(0);
      setAnimationOffset(0);

      if (soundsOn(payloadSettings) && spinSound.current) {
        spinSound.current.currentTime = 1;
        spinSound.current.volume = 1;
        void spinSound.current.play().catch(() => {});
      }

      const startTime = Date.now();
      const totalIndices = payload.finalTarget;
      const itemsLength = payload.spinnerItems.length || 1;
      let soundFading = false;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / payload.duration, 1);

        const easeOut = rouletteEasing(progress, payload.easeExponent);
        const currentProgress = totalIndices * easeOut;

        const wholeIndex = Math.floor(currentProgress);
        setCenterIndex(wholeIndex % itemsLength);
        setAnimationOffset((currentProgress - wholeIndex) * itemHeightRef.current);

        if (
          spinSound.current &&
          soundsOn(payloadSettings) &&
          progress > payloadSettings.soundFadeStartPercent &&
          !soundFading
        ) {
          soundFading = true;
          const fadeOutDurationMs =
            payload.duration * payloadSettings.soundFadeDuration;
          const steps = 20;
          const stepMs = Math.max(16, Math.floor(fadeOutDurationMs / steps));
          const decrement = 1 / steps;
          const fadeInterval = setInterval(() => {
            if (spinSound.current) {
              spinSound.current.volume = Math.max(
                0,
                spinSound.current.volume - decrement
              );
              if (spinSound.current.volume <= 0) {
                spinSound.current.pause();
                spinSound.current.currentTime = 0;
                spinSound.current.volume = 1;
                clearInterval(fadeInterval);
              }
            } else {
              clearInterval(fadeInterval);
            }
          }, stepMs);
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const finalWhole = Math.floor(payload.finalTarget);
        setCenterIndex(finalWhole % itemsLength);
        setAnimationOffset(
          (payload.finalTarget - finalWhole) * itemHeightRef.current
        );
        handleSpinComplete(payload.winner, payloadSettings);
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [handleSpinComplete, soundsOn, stopAnimations]
  );

  // Idle drift between spins — the same loop the admin screen runs.
  useEffect(() => {
    if (!started || isSpinning || showWinner || spinnerItems.length === 0) {
      setIsIdleAnimating(false);
      return;
    }

    setIsIdleAnimating(true);
    let accumulatedOffset = animationOffset;
    let lastTime = performance.now();

    const animateIdle = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      accumulatedOffset += settings.idleSpeed * delta;

      if (accumulatedOffset >= itemHeight) {
        setCenterIndex((prev) => (prev + 1) % spinnerItems.length);
        accumulatedOffset = accumulatedOffset % itemHeight;
      }

      setAnimationOffset(accumulatedOffset);
      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    };

    idleAnimationRef.current = requestAnimationFrame(animateIdle);

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      setIsIdleAnimating(false);
    };
    // `animationOffset` is intentionally excluded — it is the loop's own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    started,
    isSpinning,
    showWinner,
    spinnerItems.length,
    settings.idleSpeed,
    itemHeight,
  ]);

  // -------------------------------------------------------------------- SSE

  // The stream must survive re-renders; only mount/unmount concerns belong in
  // the effect's dependency list.
  const runSpinRef = useRef(runSpin);
  useEffect(() => {
    runSpinRef.current = runSpin;
  }, [runSpin]);

  useEffect(() => {
    if (!started || !luckydrawId || status !== "ready") return;

    const source = new EventSource(`/api/live/${luckydrawId}/stream`);
    // Spins already seen. Guards against EventSource's automatic reconnect
    // (guaranteed on Vercel, where the stream is capped) replaying a spin.
    let lastSpinId = snapshot?.lastSpinId ?? 0;

    source.addEventListener("open", () => setConnected(true));
    source.addEventListener("error", () => setConnected(false));

    source.addEventListener("init", (e) => {
      setConnected(true);
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (Array.isArray(data.winners)) setWinners(data.winners);
        if (typeof data.lastSpinId === "number") {
          lastSpinId = Math.max(lastSpinId, data.lastSpinId);
        }
      } catch (err) {
        console.error("Bad init event:", err);
      }
    });

    source.addEventListener("spin", (e) => {
      try {
        const payload: SpinPayload = JSON.parse((e as MessageEvent).data);
        if (payload.spinId <= lastSpinId) return;
        lastSpinId = payload.spinId;
        runSpinRef.current(payload);
      } catch (err) {
        console.error("Bad spin event:", err);
      }
    });

    source.addEventListener("winners", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (Array.isArray(data.winners)) setWinners(data.winners);
      } catch (err) {
        console.error("Bad winners event:", err);
      }
    });

    source.addEventListener("offline", () => {
      source.close();
      setStatus("not-live");
    });

    return () => source.close();
    // `snapshot` is only read for its initial spin id, and `runSpin` is reached
    // through a ref — neither should re-open the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, luckydrawId, status]);

  // ---------------------------------------------------------------- cleanup

  useEffect(() => {
    return () => {
      stopAnimations();
      if (winnerTimeoutRef.current) clearTimeout(winnerTimeoutRef.current);
      fireworksCleanupRef.current?.();
    };
  }, [stopAnimations]);

  // ------------------------------------------------------------- tap to start

  const handleStart = useCallback(async () => {
    // Mobile browsers refuse to play audio that wasn't started by a gesture.
    // Play-then-pause inside this handler unlocks the clips for later.
    for (const ref of [spinSound, celebrateSound, applauseSound]) {
      const audio = ref.current;
      if (!audio) continue;
      try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Autoplay still blocked; the mute button remains available.
      }
    }

    try {
      await (
        navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<unknown> };
        }
      ).wakeLock?.request("screen");
    } catch {
      // Wake lock is a nicety, not a requirement.
    }

    setStarted(true);
  }, []);

  // ------------------------------------------------------------------ render

  if (status === "loading") {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "not-live" || status === "error") {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="text-lg font-semibold text-gray-900">
          {status === "error"
            ? "Something went wrong"
            : "This lucky draw isn't live right now"}
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          {status === "error"
            ? "Please refresh the page to try again."
            : "Keep this page open — it will start automatically once the draw is shared."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-full relative overflow-hidden overscroll-none"
      style={backgroundStyle}
    >
      {/* Overlay veil for contrast */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `rgba(255,255,255,${settings.backgroundOverlayOpacity})`,
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 landscape:pt-[calc(env(safe-area-inset-top)+0.25rem)]">
        <h1 className="text-lg sm:text-2xl landscape:text-base font-bold tracking-tight leading-tight text-gray-900 text-center truncate">
          🎉 {snapshot?.name}
        </h1>
      </div>

      {/* Reel */}
      <div className="h-full w-full flex items-center justify-center relative z-10">
        <div className="relative w-full max-w-sm sm:max-w-2xl h-full">
          <SpinnerReel
            spinnerItems={spinnerItems}
            centerIndex={centerIndex}
            animationOffset={animationOffset}
            itemHeight={itemHeight}
            visibleRange={settings.visibleRange}
            centerItemScale={settings.centerItemScale}
            nearCenterScale={settings.nearCenterScale}
            maxBlur={settings.maxBlur}
            accentColors={currentColors}
            isAnimating={isIdleAnimating || isSpinning}
          />
        </div>
      </div>

      <PreviousWinner
        winners={winners}
        accentColors={currentColors}
        variant="pill"
      />

      {/* Mute — the only control a viewer needs; it activates nothing. */}
      <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="backdrop-blur-md bg-white/80 border border-white/60 hover:bg-white text-gray-700 shadow-sm rounded-full"
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Connection hint, only once we've dropped. */}
      {started && !connected && (
        <div className="absolute left-3 top-[calc(env(safe-area-inset-top)+0.9rem)] z-40 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 px-2.5 py-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-medium text-gray-600">
            Reconnecting
          </span>
        </div>
      )}

      <WinnerOverlay
        show={showWinner}
        winner={currentWinner}
        winnerName={
          currentWinner ? snapshot?.corpIdMapping?.[currentWinner] : undefined
        }
        accentColors={currentColors}
      />

      {/* Tap to start — required to unlock audio on mobile browsers. */}
      {!started && (
        <button
          type="button"
          onClick={handleStart}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 px-8 text-center backdrop-blur-md bg-white/70"
        >
          <span className="text-2xl sm:text-3xl landscape:text-xl font-bold tracking-tight text-gray-900">
            🎉 {snapshot?.name}
          </span>
          <span
            className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em]"
            style={{ color: currentColors[2] }}
          >
            Tap to watch the draw
          </span>
          <span className="text-xs text-muted-foreground max-w-xs">
            Keep this page open — the draw will play here live, with sound.
          </span>
        </button>
      )}
    </div>
  );
}
