"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import LuckyDrawSettings, {
  AnimationSettings,
  DEFAULT_SETTINGS,
} from "./LuckyDrawSettings";
import { useItemHeight } from "@/app/hooks/use-item-height";
import {
  backgroundStyleFor,
  createExtendedList,
  resolveColors,
  rouletteEasing,
  triggerFireworks as runFireworks,
} from "@/lib/luckydraw";
import { toViewSettings } from "@/lib/luckydraw-settings";
import { useFirstOpenReload } from "@/lib/use-first-open-reload";

export type Winner = {
  workId: string;
  wonAt: string;
};

export type LuckyDrawRecord = {
  id: number;
  name: string;
  eventIds: number[];
  createdAt: string;
  createdBy: string;
  viewOnlyEnabled: boolean;
};

/**
 * Everything the admin draw screen does that isn't pixels: loading the draw,
 * picking a winner, running the reel, recording the result and broadcasting
 * the spin to the public view-only page.
 *
 * Extracted from the page so the alternate skin under
 * `/admin/luckydraw/[id]/pixel` renders the same draw — the two screens can
 * differ in how they look, never in how they behave.
 */
export function useAdminDraw() {
  const params = useParams();
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  // The draw is run from this screen on the day of an event, usually opened
  // cold from a bookmark or a pasted link on a presentation machine — the same
  // kind of arrival the live page already spends one reload on. Placed before
  // the participants fetch so the discarded first load doesn't pay for a query.
  useFirstOpenReload("admin-reloaded:", luckydrawId);

  const router = useRouter();
  // Core states
  const [initialLoading, setInitialLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [luckyDraw, setLuckyDraw] = useState<LuckyDrawRecord | null>(null);
  const [error, setError] = useState("");
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  // Animation settings
  const [animationSettings, setAnimationSettings] =
    useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Corp ID to name mapping
  const [corpIdMapping, setCorpIdMapping] = useState<Record<string, string>>(
    {}
  );

  // Recomputed on resize/rotate rather than measured once.
  const itemHeight = useItemHeight();

  const currentColors = useMemo(
    () => resolveColors(animationSettings),
    [animationSettings.useCustomColors, animationSettings.customColors]
  );

  // Public view-only page toggle.
  const [viewOnlyEnabled, setViewOnlyEnabled] = useState(false);

  // Vertical spinner states
  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  const handleSpin = useCallback(async () => {
    if (isSpinning || participants.length === 0) return;

    // Cancel any existing animations
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }
    setIsIdleAnimating(false);

    setIsSpinning(true);
    setShowWinner(false);
    setError("");

    // Reset and shuffle spinner items
    const newSpinnerItems = createExtendedList(
      participants,
      animationSettings.spinnerItemCount
    );
    setSpinnerItems(newSpinnerItems);

    // Find a valid winner
    let winnerIndex = -1;
    const availableIndices = [];

    for (let i = 0; i < newSpinnerItems.length; i++) {
      if (!winners.some((w) => w.workId === newSpinnerItems[i])) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length > 0) {
      winnerIndex =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      winnerIndex = Math.floor(newSpinnerItems.length / 2);
    }

    const intendedWinner = newSpinnerItems[winnerIndex];

    // Play spin sound. The clip is shorter than the spin (spin4.mp3 runs
    // 10.9s against a spin of 18s), so it loops rather than leaving the most
    // tense stretch of the reel in silence. The fade-out below clears `loop`
    // so the clip cannot restart underneath the fade.
    if (spinSound.current && animationSettings.enableSounds) {
      spinSound.current.loop = true;
      spinSound.current.currentTime = 1;
      spinSound.current.play();
    }

    // Reset to start position
    setCenterIndex(0);
    setAnimationOffset(0);

    // Calculate total indices to spin through
    const totalItems = newSpinnerItems.length;
    const spins =
      animationSettings.minSpins +
      Math.random() * (animationSettings.maxSpins - animationSettings.minSpins);
    const baseTarget = Math.floor(spins) * totalItems + winnerIndex;

    const randomOffset = Math.random() * 0.9;
    const finalTarget = baseTarget + randomOffset;

    // Publish to the view-only page before starting our own animation, so the
    // network hop overlaps the spin rather than delaying it. Deliberately not
    // awaited — a failed broadcast must never stall the draw on the big screen.
    if (viewOnlyEnabled) {
      fetch(`/api/admin/luckydraw/${luckydrawId}/spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spinnerItems: newSpinnerItems,
          winner: intendedWinner,
          winnerIndex,
          finalTarget,
          duration: animationSettings.duration,
          easeExponent: animationSettings.easeExponent,
          settings: toViewSettings(animationSettings),
        }),
      }).catch((err) => console.error("Failed to broadcast spin:", err));
    }

    animateSpinnerByIndex(
      0,
      finalTarget,
      animationSettings.duration,
      intendedWinner,
      newSpinnerItems
    );
  }, [
    isSpinning,
    participants,
    winners,
    animationSettings,
    viewOnlyEnabled,
    luckydrawId,
  ]);

  // Initialize audio. Deliberately kept separate from the F5 handler below:
  // `handleSpin` changes identity on every winner/settings change, and tying
  // the Audio objects to it tore them down and rebuilt them each time.
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);

    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
      applauseSound.current = new Audio("/sounds/applause1.mp3");

      // Preload audio
      if (spinSound.current) spinSound.current.load();
      if (celebrateSound.current) celebrateSound.current.load();
      if (applauseSound.current) applauseSound.current.load();
    }

    return () => {
      document.body.style.overflow = "auto";

      // Cleanup audio
      if (spinSound.current) spinSound.current = null;
      if (celebrateSound.current) celebrateSound.current = null;
      if (applauseSound.current) applauseSound.current = null;
    };
  }, []);

  // Presenter clickers send F5 — use it to trigger the spin.
  useEffect(() => {
    const handleF5KeyPress = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault(); // Prevent page refresh
        handleSpin();
      }
    };

    document.addEventListener("keydown", handleF5KeyPress);
    return () => document.removeEventListener("keydown", handleF5KeyPress);
  }, [handleSpin]);

  // Fetch lucky draw data
  useEffect(() => {
    if (!luckydrawId) return;
    fetchLuckyDrawData();
  }, [luckydrawId]);

  const fetchLuckyDrawData = async () => {
    try {
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch data");
      }

      setLuckyDraw(data.luckyDraw);
      setViewOnlyEnabled(Boolean(data.luckyDraw?.viewOnlyEnabled));

      // Fetch corp ID mapping based on lucky draw name
      if (data.luckyDraw?.name) {
        try {
          const mappingRes = await fetch(
            `/api/admin/luckydraw/corpid-name-mapping?name=${encodeURIComponent(
              data.luckyDraw.name
            )}`
          );
          const mappingData = await mappingRes.json();

          if (mappingRes.ok && mappingData.mapping) {
            setCorpIdMapping(mappingData.mapping);
          }
        } catch (err) {
          console.warn("Failed to fetch corp ID mapping:", err);
          // Continue without mapping if it fails
        }
      }

      const uniqueParticipants = Array.from(
        new Set(data.participants)
      ) as string[];

      // Keep all participants in the UI - don't filter out winners
      setParticipants(uniqueParticipants);

      const extendedList = createExtendedList(
        uniqueParticipants,
        animationSettings.spinnerItemCount
      );
      setSpinnerItems(extendedList);

      setCenterIndex(0);
      setAnimationOffset(0);

      if (data.winners && Array.isArray(data.winners)) {
        setWinners(data.winners);
      }
    } catch (err: any) {
      setError("Failed to load data.");
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleDeleteLuckyDraw = async () => {
    if (!luckydrawId) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete lucky draw");

      router.push("/admin/luckydraw");
      toast.success("Lucky draw deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting lucky draw");
    } finally {
      setDeleteLoading(false);
    }
  };

  const animateSpinnerByIndex = useCallback(
    (
      fromIndex: number,
      toIndex: number,
      duration: number,
      winner: string,
      itemsArray: string[]
    ) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const startTime = Date.now();
      let soundFading = false;
      const totalIndices = toIndex - fromIndex;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = rouletteEasing(
          progress,
          animationSettings.easeExponent
        );
        const currentProgress = fromIndex + totalIndices * easeOut;

        const wholeIndex = Math.floor(currentProgress);
        const fractionalPart = currentProgress - wholeIndex;

        setCenterIndex(wholeIndex % itemsArray.length);
        setAnimationOffset(fractionalPart * itemHeight);

        // Fade out sound
        const autoSoundFadeStart = animationSettings.soundFadeStartPercent;
        const autoSoundFadeDuration = animationSettings.soundFadeDuration;

        if (
          spinSound.current &&
          animationSettings.enableSounds &&
          progress > autoSoundFadeStart &&
          !soundFading
        ) {
          soundFading = true;
          // Let the clip run to its end rather than looping into the fade.
          spinSound.current.loop = false;
          const fadeOutDurationMs = duration * autoSoundFadeDuration;
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
        } else {
          const wholeIndex = Math.floor(toIndex);
          const fractionalPart = toIndex - wholeIndex;

          setCenterIndex(wholeIndex % itemsArray.length);
          setAnimationOffset(fractionalPart * itemHeight);

          handleSpinComplete(winner);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [animationSettings, itemHeight]
  );

  const handleSpinComplete = useCallback(
    async (winner: string) => {
      setCurrentWinner(winner);

      // Stop spin sound
      if (spinSound.current) {
        spinSound.current.loop = false;
        spinSound.current.pause();
        spinSound.current.currentTime = 0;
        spinSound.current.volume = 1;
      }

      // Play celebration sounds
      if (celebrateSound.current && animationSettings.enableSounds) {
        celebrateSound.current.currentTime = 0;
        celebrateSound.current.play();
      }

      if (applauseSound.current && animationSettings.enableSounds) {
        applauseSound.current.currentTime = 0;
        applauseSound.current.play();
      }

      // Record winner
      try {
        const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: winner }),
        });

        if (response.ok) {
          const newWinner = { workId: winner, wonAt: new Date().toISOString() };
          setWinners((prev) => [...prev, newWinner]);
          // Note: We don't remove the winner from participants - they stay visible but can't win again
        }
      } catch (error) {
        console.error("Error recording winner:", error);
      }

      // Trigger effects
      if (animationSettings.enableFireworks) {
        triggerFireworks();
      }
      setShowWinner(true);
      setIsSpinning(false);

      // Auto-hide winner
      setTimeout(() => {
        setShowWinner(false);
      }, animationSettings.winnerDisplayDuration);
    },
    [animationSettings, luckydrawId]
  );

  const handleDeleteWinner = useCallback(
    async (winnerWorkId: string) => {
      try {
        const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: winnerWorkId }),
        });

        if (response.ok) {
          setWinners((prev) => prev.filter((w) => w.workId !== winnerWorkId));
          // Note: We don't need to add back to participants since they were never removed
          toast.success("Winner removed");
        } else {
          toast.error("Failed to remove winner");
        }
      } catch (error) {
        console.error("Error removing winner:", error);
        toast.error("Failed to remove winner");
      }
    },
    [luckydrawId]
  );

  const triggerFireworks = useCallback(() => {
    runFireworks(confetti, animationSettings);
  }, [animationSettings]);

  // Idle animation
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      setIsIdleAnimating(true);
      let accumulatedOffset = animationOffset;
      let lastTime = performance.now();

      const animateIdle = () => {
        if (isSpinning || showWinner || spinnerItems.length === 0) {
          setIsIdleAnimating(false);
          return;
        }

        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        accumulatedOffset += animationSettings.idleSpeed * delta;

        if (accumulatedOffset >= itemHeight) {
          setCenterIndex((prev) => (prev + 1) % spinnerItems.length);
          accumulatedOffset = accumulatedOffset % itemHeight;
        }

        setAnimationOffset(accumulatedOffset);

        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      };

      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    } else {
      setIsIdleAnimating(false);
    }

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      setIsIdleAnimating(false);
    };
  }, [
    isSpinning,
    spinnerItems.length,
    showWinner,
    animationSettings.idleSpeed,
    itemHeight,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, []);

  // Dynamic background style based on settings
  const backgroundStyle = useMemo(() => backgroundStyleFor(animationSettings), [
    animationSettings.backgroundMode,
    animationSettings.backgroundSolidColor,
    animationSettings.backgroundGradientAngle,
    animationSettings.backgroundGradientFrom,
    animationSettings.backgroundGradientTo,
  ]);

  return {
    // identity
    luckydrawId,
    luckyDraw,
    // load state
    initialLoading,
    error,
    // draw data
    participants,
    winners,
    corpIdMapping,
    // reel
    spinnerItems,
    centerIndex,
    animationOffset,
    itemHeight,
    isSpinning,
    isIdleAnimating,
    currentWinner,
    showWinner,
    // presentation
    animationSettings,
    setAnimationSettings,
    currentColors,
    backgroundStyle,
    // controls
    handleSpin,
    handleDeleteWinner,
    handleDeleteLuckyDraw,
    deleteLoading,
    showSettings,
    setShowSettings,
    viewOnlyEnabled,
    setViewOnlyEnabled,
  };
}

export type AdminDraw = ReturnType<typeof useAdminDraw>;
