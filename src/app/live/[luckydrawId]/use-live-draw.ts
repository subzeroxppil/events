"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useItemHeight } from "@/app/hooks/use-item-height";
import {
  backgroundStyleFor,
  resolveColors,
  rouletteEasing,
  triggerFireworks,
} from "@/lib/luckydraw";
import {
  EPOCH_ANCHOR,
  idlePositionAt,
  type IdleAnchor,
} from "@/lib/luckydraw-idle";
import {
  DEFAULT_VIEW_SETTINGS,
  type ViewSettings,
} from "@/lib/luckydraw-settings";
import type { SpinPayload, Winner } from "@/lib/luckydraw-live";
import { playStartChime } from "@/lib/retro-chime";
import { createArcadeSound, type ArcadeSound } from "@/lib/arcade-sound";

export type LiveStatus = "loading" | "not-live" | "ready" | "error";

/** The last spin, carried only so a late joiner can line up its idle drift. */
export type SpinAnchor = {
  spinId: number;
  spinnerItems: string[];
  finalTarget: number;
  duration: number;
  settings: ViewSettings | null;
};

export type Snapshot = {
  name: string;
  participants: string[];
  winners: Winner[];
  corpIdMapping: Record<string, string>;
  /** Built server-side so every viewer gets the identical reel. */
  idleItems: string[];
  serverNow: number;
  lastSpinId: number;
  lastSpin: SpinAnchor | null;
};

/**
 * Everything the public view-only page does that isn't pixels: fetching the
 * snapshot, subscribing to the spin stream, running the reel animation and the
 * winner reveal.
 *
 * It is a hook rather than part of the page so the alternate skins under
 * `?ui=` can share one implementation — the visual variants can't drift in
 * timing, sound or sync behaviour, only in how they look.
 */
/**
 * The spin's resting row, and the moment it got there in server time. The
 * animation runs for `duration` from the instant the server stamped the spin,
 * so `spinId + duration` is when every viewer's reel settles.
 */
function anchorForSpin(spin: {
  spinId: number;
  finalTarget: number;
  duration: number;
}): IdleAnchor {
  return {
    atMs: spin.spinId + spin.duration,
    // Fractional on purpose — it is the exact resting position, not the row.
    index: spin.finalTarget,
  };
}

export function useLiveDraw(
  luckydrawId: string | undefined,
  /**
   * `?sound=arcade` swaps the mp3s for the synthesised arcade soundtrack. It is
   * read from each viewer's own URL rather than broadcast: which sound someone
   * hears is their choice, not something the admin imposes on the whole room.
   */
  arcadeMode = false
) {
  const [status, setStatus] = useState<LiveStatus>("loading");
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

  // Difference between this device's clock and the server's. Without it a
  // phone whose clock is a few seconds out drifts a few rows away from the
  // rest of the room.
  const clockOffsetRef = useRef(0);

  // Where the shared idle timeline is pinned. Before any spin every viewer
  // drifts from the epoch, so they agree without having to talk to each other.
  const idleAnchorRef = useRef<IdleAnchor>(EPOCH_ANCHOR);

  const itemHeight = useItemHeight();
  const accentColors = useMemo(() => resolveColors(settings), [settings]);
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
  const arcade = useRef<ArcadeSound | null>(null);

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
        const sentAt = Date.now();
        const res = await fetch(`/api/live/${luckydrawId}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("not-live");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");

        const data: Snapshot = await res.json();
        if (cancelled) return;

        // Half the round trip is the better estimate of when the server's
        // clock reading was taken.
        if (typeof data.serverNow === "number") {
          const receivedAt = Date.now();
          const latency = (receivedAt - sentAt) / 2;
          clockOffsetRef.current = data.serverNow + latency - receivedAt;
        }

        setSnapshot(data);
        setWinners(data.winners ?? []);

        // A draw that has already spun resumes from where that spin landed;
        // one that has not drifts from the epoch. Either way the answer is the
        // same on every device.
        const last = data.lastSpin;
        if (last && last.spinnerItems?.length) {
          setSpinnerItems(last.spinnerItems);
          if (last.settings) setSettings(last.settings);
          idleAnchorRef.current = anchorForSpin(last);
        } else {
          setSpinnerItems(data.idleItems ?? []);
          idleAnchorRef.current = EPOCH_ANCHOR;
        }

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
    if (!arcadeMode) return;
    arcade.current = createArcadeSound();
    return () => {
      arcade.current?.dispose();
      arcade.current = null;
    };
  }, [arcadeMode]);

  // The synth has its own master gain, so the mute button has to reach it too.
  useEffect(() => {
    arcade.current?.setMuted(muted);
  }, [muted]);

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
        spinSound.current.loop = false;
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
        spinSound.current.volume = 1;
      }
      arcade.current?.stopSpin();

      if (soundsOn(payloadSettings)) {
        if (arcadeMode) {
          arcade.current?.playWin();
        } else {
          if (celebrateSound.current) {
            celebrateSound.current.currentTime = 0;
            void celebrateSound.current.play().catch(() => {});
          }
          if (applauseSound.current) {
            applauseSound.current.currentTime = 0;
            void applauseSound.current.play().catch(() => {});
          }
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
    [soundsOn, arcadeMode]
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

      // Loop the bed for the same reason the admin screen does: the clip is
      // shorter than the spin, and the silence would land on the tensest part
      // of the reel. Cleared when the fade starts.
      if (soundsOn(payloadSettings)) {
        if (arcadeMode) {
          // The synth ticks in step with the reel, so it needs the duration.
          arcade.current?.startSpin(payload.duration);
        } else if (spinSound.current) {
          spinSound.current.loop = true;
          spinSound.current.currentTime = 1;
          spinSound.current.volume = 1;
          void spinSound.current.play().catch(() => {});
        }
      }

      // Pin the shared timeline to where this spin will come to rest. Every
      // viewer derives the same anchor from the same payload, so idle drift
      // stays in step afterwards — including for anyone who joins later and
      // reads the spin back from the snapshot.
      idleAnchorRef.current = anchorForSpin(payload);

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
        setAnimationOffset(
          (currentProgress - wholeIndex) * itemHeightRef.current
        );

        if (
          !arcadeMode &&
          spinSound.current &&
          soundsOn(payloadSettings) &&
          progress > payloadSettings.soundFadeStartPercent &&
          !soundFading
        ) {
          soundFading = true;
          // Let the clip run to its end rather than looping into the fade.
          spinSound.current.loop = false;
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
    [handleSpinComplete, soundsOn, stopAnimations, arcadeMode]
  );

  // Idle drift between spins.
  //
  // Both the row at the centre and the sub-row offset are computed from server
  // time rather than accumulated locally, so a phone that joined an hour ago
  // and one that joined a second ago show the same name in the same place.
  // The row index advances at a screen-independent rate; only the sub-row
  // offset is scaled by this device's row height. It keeps running behind the
  // winner overlay, so nothing jumps in the frame the overlay clears.
  useEffect(() => {
    if (!started || isSpinning || spinnerItems.length === 0) {
      setIsIdleAnimating(false);
      return;
    }

    setIsIdleAnimating(true);

    const tick = () => {
      const serverNow = Date.now() + clockOffsetRef.current;
      const { index, fraction } = idlePositionAt(
        serverNow,
        idleAnchorRef.current,
        settings.idleSpeed,
        spinnerItems.length
      );

      setCenterIndex(index);
      setAnimationOffset(fraction * itemHeightRef.current);

      idleAnimationRef.current = requestAnimationFrame(tick);
    };

    idleAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      setIsIdleAnimating(false);
    };
  }, [started, isSpinning, spinnerItems.length, settings.idleSpeed]);

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

  // ----------------------------------------------------------------- enter

  const enter = useCallback(async () => {
    // Mobile browsers refuse to play audio that wasn't started by a gesture.
    // Play-then-pause inside this handler unlocks the clips for later.
    //
    // The priming MUST be muted. `play()` resolves only once playback has
    // actually begun, so an unmuted prime is audible — which is how pressing
    // Enter came to play a burst of the winning sound. `muted` rather than
    // `volume = 0` because iOS Safari ignores `volume` on media elements.
    // Primed together rather than in sequence so the unlock is one moment,
    // not a chain of three.
    await Promise.all(
      [spinSound, celebrateSound, applauseSound].map(async (ref) => {
        const audio = ref.current;
        if (!audio) return;
        const wasMuted = audio.muted;
        try {
          audio.muted = true;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // Autoplay still blocked; the mute button remains available.
        } finally {
          audio.muted = wasMuted;
        }
      })
    );

    // The synth needs the same gesture: browsers hand back a suspended
    // AudioContext outside one.
    await arcade.current?.unlock();
    arcade.current?.setMuted(muted);

    // Now that the clips are unlocked, acknowledge the tap with the arcade
    // chime — the first sound the viewer should hear, and deliberately not
    // the one that belongs to a win.
    if (!muted) void playStartChime();

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
  }, [muted]);

  return {
    status,
    snapshot,
    started,
    connected,
    muted,
    toggleMuted: useCallback(() => setMuted((m) => !m), []),
    enter,
    settings,
    winners,
    accentColors,
    backgroundStyle,
    spinnerItems,
    centerIndex,
    animationOffset,
    itemHeight,
    isSpinning,
    isIdleAnimating,
    currentWinner,
    showWinner,
  };
}

export type LiveDraw = ReturnType<typeof useLiveDraw>;
