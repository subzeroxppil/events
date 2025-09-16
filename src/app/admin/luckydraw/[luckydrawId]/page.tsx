"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import GradualBlur from "@/components/GradualBlur";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
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
import SpinnerItem from "./SpinnerItem";
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
};

const BASE_COLORS = ["#173066", "#509bff", "#0463ce", "#63cbfb"];

// Smooth easing function
const rouletteEasing = (progress: number, exponent: number): number => {
  const smoothExponent = 2 + (exponent - 2) * Math.pow(progress, 1.5);
  return 1 - Math.pow(1 - progress, smoothExponent);
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

  // Memoized values for performance
  const itemHeight = useMemo(() => {
    if (typeof window === "undefined") return 96;
    if (window.innerWidth < 640) return 64;
    if (window.innerWidth < 1024) return 80;
    return 96;
  }, []);

  const currentColors = useMemo(() => {
    return animationSettings.useCustomColors
      ? animationSettings.customColors
      : BASE_COLORS;
  }, [animationSettings.useCustomColors, animationSettings.customColors]);

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

  const createExtendedList = useCallback(
    (items: string[], targetLength: number): string[] => {
      if (items.length === 0) return [];
      const result = [];
      while (result.length < targetLength) {
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        result.push(...shuffled);
      }
      return result.slice(0, targetLength);
    },
    []
  );

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
    createExtendedList,
  ]);

  // Initialize audio
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

    // Add right-click event listener to trigger spin
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu
      handleSpin();
    };

    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      document.body.style.overflow = "auto";

      // Cleanup audio
      if (spinSound.current) spinSound.current = null;
      if (celebrateSound.current) celebrateSound.current = null;
      if (applauseSound.current) applauseSound.current = null;

      // Remove right-click event listener
      document.removeEventListener("contextmenu", handleRightClick);
    };
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
    const duration = animationSettings.fireworksDuration;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount =
        animationSettings.fireworksParticleCount * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
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
  const backgroundStyle = useMemo(() => {
    if (animationSettings.backgroundMode === "solid") {
      return {
        background: animationSettings.backgroundSolidColor,
      } as React.CSSProperties;
    }
    return {
      background: `linear-gradient(${animationSettings.backgroundGradientAngle}deg, ${animationSettings.backgroundGradientFrom}, ${animationSettings.backgroundGradientTo})`,
    } as React.CSSProperties;
  }, [
    animationSettings.backgroundMode,
    animationSettings.backgroundSolidColor,
    animationSettings.backgroundGradientAngle,
    animationSettings.backgroundGradientFrom,
    animationSettings.backgroundGradientTo,
  ]);

  // Calculate visible items
  const renderedItems = useMemo(() => {
    if (spinnerItems.length === 0) return [];
    const items = [];
    const totalItems = spinnerItems.length;
    const visibleRange = animationSettings.visibleRange;

    for (let i = -visibleRange; i <= visibleRange; i++) {
      const absoluteIndex = centerIndex + i;
      const wrappedIndex =
        ((absoluteIndex % totalItems) + totalItems) % totalItems;
      items.push({
        text: spinnerItems[wrappedIndex],
        offset: i,
        key: `${absoluteIndex}-${spinnerItems[wrappedIndex]}`,
      });
    }
    return items;
  }, [spinnerItems, centerIndex, animationSettings.visibleRange]);

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
          <div className="relative h-full flex items-center justify-center overflow-hidden">
            <div
              ref={spinnerRef}
              className="absolute w-full"
              style={{
                top: "50%",
                transform: `translateY(calc(-50% - ${animationOffset}px))`,
                willChange: "transform",
                transition: "none",
              }}
            >
              {renderedItems.map((item) => {
                const distanceFromCenter = Math.abs(item.offset);
                const isCenter = item.offset === 0;
                const isNearCenter = distanceFromCenter <= 2;

                const scale = isCenter
                  ? animationSettings.centerItemScale
                  : isNearCenter
                  ? animationSettings.nearCenterScale
                  : 1;
                const opacity = isCenter
                  ? 1
                  : Math.max(0.3, 1 - distanceFromCenter * 0.05);
                const blur =
                  distanceFromCenter > 8
                    ? Math.min(
                        animationSettings.maxBlur,
                        (distanceFromCenter - 8) * 0.1
                      )
                    : 0;

                return (
                  <SpinnerItem
                    key={item.key}
                    text={item.text}
                    offset={item.offset}
                    itemHeight={itemHeight}
                    isCenter={isCenter}
                    isNearCenter={isNearCenter}
                    scale={scale}
                    opacity={opacity}
                    blur={blur}
                    isAnimating={isIdleAnimating || isSpinning}
                  />
                );
              })}
            </div>

            {/* Gradual Blur */}
            <GradualBlur
              position="top"
              height="8rem"
              strength={2.5}
              divCount={10}
              opacity={0.95}
              exponential={true}
              style={{
                zIndex: 20,
                pointerEvents: "none",
              }}
            />
            <GradualBlur
              position="bottom"
              height="8rem"
              strength={2.5}
              divCount={10}
              opacity={0.95}
              exponential={true}
              style={{
                zIndex: 20,
                pointerEvents: "none",
              }}
            />

            {/* Center Arrow Indicator */}
            <div className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div className="relative flex items-center">
                {/* Arrow character */}
                <div
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold select-none"
                  style={{
                    color: currentColors[1],
                    filter: `drop-shadow(0 0 ${
                      typeof window !== "undefined" && window.innerWidth < 640
                        ? "8px"
                        : "12px"
                    } ${currentColors[1]}60)`,
                    textShadow: `0 0 20px ${currentColors[1]}40`,
                  }}
                >
                  ▶
                </div>
                {/* Glow effect behind arrow */}
                <div
                  className="absolute inset-0 text-2xl sm:text-3xl lg:text-4xl font-bold select-none"
                  style={{
                    color: currentColors[3],
                    filter: "blur(4px)",
                    opacity: 0.6,
                  }}
                >
                  ▶
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Winner */}
        <div className="absolute left-2 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
          <AnimatePresence mode="wait">
            {winners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.9 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                }}
                className="relative p-4 sm:p-5 lg:p-6 rounded-2xl overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <motion.div className="absolute inset-0 opacity-30" />

                <div className="relative z-10">
                  <motion.div
                    className="text-sm sm:text-base lg:text-lg uppercase tracking-[0.2em] mb-2 font-semibold"
                    style={{
                      background: `linear-gradient(90deg, ${currentColors[1]}99 0%, ${currentColors[2]}99 10%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Previous Winner
                  </motion.div>
                  <motion.div
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {winners[winners.length - 1].workId}
                  </motion.div>
                  <motion.div
                    className="text-sm sm:text-base tracking-wide text-gray-600 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {new Date(
                      winners[winners.length - 1].wonAt
                    ).toLocaleTimeString("en-SG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Button */}
        <div className="fixed right-2 sm:right-4 lg:right-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40 flex gap-2 items-center">
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete{" "}
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

        {/* Winners Button */}
        <div className="fixed left-2 sm:left-4 lg:left-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40">
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
      <AnimatePresence>
        {showWinner && currentWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 100%)",
                backdropFilter: "blur(12px) saturate(150%)",
                WebkitBackdropFilter: "blur(12px) saturate(150%)",
              }}
            />

            {/* Winner card container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.6,
              }}
              className="text-center relative px-10 py-12 max-w-lg mx-4"
            >
              {/* Winner Card */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              />

              {/* Content */}
              <div className="relative z-10 text-center flex flex-col items-center">
                {/* Winner label */}
                <motion.div
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mb-6 text-center"
                >
                  <div
                    className="text-xl font-medium uppercase tracking-[0.3em] text-center"
                    style={{
                      background: `linear-gradient(135deg, ${currentColors[1]} 0%, ${currentColors[2]} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Winner
                  </div>
                </motion.div>

                {/* Winner name with subtle glow */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    damping: 15,
                    stiffness: 200,
                  }}
                  className="relative mb-8 text-center"
                >
                  {/* Subtle glow effect */}
                  <motion.div
                    className="absolute -inset-4 rounded-xl opacity-20"
                    style={{
                      background: `radial-gradient(ellipse, ${currentColors[1]}30 0%, transparent 70%)`,
                      filter: "blur(15px)",
                    }}
                    animate={{
                      opacity: [0.15, 0.25, 0.15],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Winner text */}
                  <motion.div
                    className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-center"
                    style={{
                      color: "#1a1a1a",
                      textShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {currentWinner}
                  </motion.div>

                  {currentWinner && corpIdMapping[currentWinner] && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mt-4 text-center"
                      style={{
                        color: "#4a4a4a",
                        textShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      ({corpIdMapping[currentWinner]})
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="text-lg sm:text-xl lg:text-2xl text-gray-700 font-medium tracking-wide text-center"
                >
                  Congratulations!
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
