"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import GradualBlur from "@/components/GradualBlur";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import BackButton from "@/components/BackButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LuckyDrawSettings, {
  AnimationSettings,
  DEFAULT_SETTINGS,
} from "./LuckyDrawSettings";
import SpinnerReel from "@/components/luckydraw/SpinnerReel";
import WinnerOverlay from "@/components/luckydraw/WinnerOverlay";
import PreviousWinner from "@/components/luckydraw/PreviousWinner";
import ViewOnlyShareSheet from "@/components/luckydraw/ViewOnlyShareSheet";
import { useItemHeight } from "@/app/hooks/use-item-height";
import {
  backgroundStyleFor,
  createExtendedList,
  resolveColors,
  rouletteEasing,
  triggerFireworks as runFireworks,
} from "@/lib/luckydraw";
import { toViewSettings } from "@/lib/luckydraw-settings";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Winner = {
  workId: string;
  wonAt: string;
};

type LuckyDraw = {
  id: number;
  name: string;
  eventIds: number[];
  createdAt: string;
  createdBy: string;
  viewOnlyEnabled: boolean;
};

export default function LuckyDraw() {
  const params = useParams();
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  const router = useRouter();
  // Core states
  const [initialLoading, setInitialLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [luckyDraw, setLuckyDraw] = useState<LuckyDraw | null>(null);
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
  const spinnerRef = useRef<HTMLDivElement>(null);
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

    // Play spin sound
    if (spinSound.current && animationSettings.enableSounds) {
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Overlay veil for contrast */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `rgba(255,255,255,${animationSettings.backgroundOverlayOpacity})`,
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-center z-40">
        <BackButton />
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight text-gray-900">
            🎉 {luckyDraw?.name}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Spinner Container */}
        <div className="relative w-full max-w-sm sm:max-w-2xl lg:max-w-3xl h-screen">
          {/* Vertical Spinner */}
          <SpinnerReel
            spinnerItems={spinnerItems}
            centerIndex={centerIndex}
            animationOffset={animationOffset}
            itemHeight={itemHeight}
            visibleRange={animationSettings.visibleRange}
            centerItemScale={animationSettings.centerItemScale}
            nearCenterScale={animationSettings.nearCenterScale}
            maxBlur={animationSettings.maxBlur}
            accentColors={currentColors}
            isAnimating={isIdleAnimating || isSpinning}
          />
        </div>

        {/* Previous Winner */}
        <PreviousWinner winners={winners} accentColors={currentColors} />

        {/* Bottom control bar. One row rather than two pinned corners — on a
            phone the left and right groups sat on top of each other. */}
        <div className="fixed inset-x-2 sm:inset-x-4 lg:inset-x-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40 flex flex-wrap gap-2 items-center justify-end">
        {/* Winners Button */}
        <div className="mr-auto">
          <Sheet>
            <SheetTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Button
                  variant="ghost"
                  size={
                    typeof window !== "undefined" && window.innerWidth < 640
                      ? "sm"
                      : "default"
                  }
                  className="backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg text-xs sm:text-sm font-medium"
                >
                  <Trophy
                    className="w-4 h-4 mr-2"
                    style={{ color: currentColors[1] }}
                  />
                  Winners
                  {winners.length > 0 && (
                    <motion.span
                      className="ml-2 px-2 py-0.5 text-white rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: currentColors[2],
                        boxShadow: `0 0 10px ${currentColors[2]}40`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                    >
                      {winners.length}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Lucky Draw Winners</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3 pb-6">
                {winners.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    No winners yet
                  </p>
                ) : (
                  winners.map((winner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs tracking-wide leading-relaxed font-medium text-muted-foreground">
                          {new Date(winner.wonAt).toLocaleTimeString("en-SG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-semibold tracking-wide leading-tight">
                          {winner.workId}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWinner(winner.workId)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
          <ViewOnlyShareSheet
            luckydrawId={String(luckydrawId)}
            enabled={viewOnlyEnabled}
            onEnabledChange={setViewOnlyEnabled}
          />
          <LuckyDrawSettings
            settings={animationSettings}
            onSettingsChange={setAnimationSettings}
            isSpinning={isSpinning}
            showSettings={showSettings}
            onShowSettingsChange={setShowSettings}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant={"ghost"}
                size={
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? "sm"
                    : "default"
                }
                className="backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete lucky draw?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your lucky draw and all data
                  related to it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDeleteLuckyDraw}
                  className="w-full sm:w-[75px] "
                  disabled={deleteLoading}
                >
                  {deleteLoading ? <LoadingSpinner /> : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>


        {/* SPIN Button */}
        <div className="absolute right-2 sm:right-6 lg:right-12 top-1/2 -translate-y-1/2 z-40">
          <motion.div
            initial={false}
            animate={{
              scale: isSpinning ? 0.95 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            <button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              className={cn(
                "backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg",
                "px-4 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4",
                "rounded-full text-sm sm:text-base font-semibold tracking-widest uppercase",
                "transition-all duration-300 ease-out",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {/* Button text */}
              <motion.span
                className={cn(
                  "relative z-10 font-semibold text-sm sm:text-base tracking-widest uppercase",
                  "transition-all duration-300",
                  "drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                )}
                style={{
                  color: isSpinning ? currentColors[0] : "#1a1a1a",
                  textShadow: isSpinning
                    ? `0 0 20px ${currentColors[1]}40`
                    : "0 1px 2px rgba(0,0,0,0.05)",
                }}
                animate={{
                  letterSpacing: isSpinning ? "0.2em" : "0.15em",
                }}
              >
                {isSpinning ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Spinning
                    <motion.div
                      className="flex gap-0.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: currentColors[1] }}
                          animate={{
                            y: [0, -3, 0],
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Spin
                  </motion.span>
                )}
              </motion.span>

              {/* Pulse ring animation when not spinning */}
              {!isSpinning && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    border: `1px solid ${currentColors[1]}20`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Winner Display */}
      <WinnerOverlay
        show={showWinner}
        winner={currentWinner}
        winnerName={currentWinner ? corpIdMapping[currentWinner] : undefined}
        accentColors={currentColors}
      />
    </div>
  );
}
