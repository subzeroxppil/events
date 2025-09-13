"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
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
import LuckyDrawSettings, { AnimationSettings, DEFAULT_SETTINGS } from "./LuckyDrawSettings";
import SpinnerItem from "./SpinnerItem";

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

export default function LuckyDrawCY() {
  const params = useParams();
  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

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
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // Memoized values for performance
  const itemHeight = useMemo(() => {
    if (typeof window === 'undefined') return 96;
    if (window.innerWidth < 640) return 64;
    if (window.innerWidth < 1024) return 80;
    return 96;
  }, []);

  const currentColors = useMemo(() => {
    return animationSettings.useCustomColors ? animationSettings.customColors : BASE_COLORS;
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

  // Initialize audio
  useEffect(() => {
    window.scrollTo(0, 100);

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
      document.body.style.overflow = 'auto';
      
      // Cleanup audio
      if (spinSound.current) spinSound.current = null;
      if (celebrateSound.current) celebrateSound.current = null;
      if (applauseSound.current) applauseSound.current = null;
    };
  }, []);

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

      const uniqueParticipants = Array.from(
        new Set(data.participants)
      ) as string[];

      setParticipants(uniqueParticipants);

      const extendedList = createExtendedList(uniqueParticipants, animationSettings.spinnerItemCount);
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

  const createExtendedList = useCallback((items: string[], targetLength: number): string[] => {
    if (items.length === 0) return [];
    const result = [];
    while (result.length < targetLength) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      result.push(...shuffled);
    }
    return result.slice(0, targetLength);
  }, []);

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
    const newSpinnerItems = createExtendedList(participants, animationSettings.spinnerItemCount);
    setSpinnerItems(newSpinnerItems);

    // Find a valid winner
    let winnerIndex = -1;
    const availableIndices = [];

    for (let i = 0; i < newSpinnerItems.length; i++) {
      if (!winners.some(w => w.workId === newSpinnerItems[i])) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length > 0) {
      winnerIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
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
    const spins = animationSettings.minSpins + Math.random() * (animationSettings.maxSpins - animationSettings.minSpins);
    const baseTarget = Math.floor(spins) * totalItems + winnerIndex;

    const randomOffset = Math.random() * 0.9;
    const finalTarget = baseTarget + randomOffset;

    animateSpinnerByIndex(0, finalTarget, animationSettings.duration, intendedWinner, newSpinnerItems);
  }, [isSpinning, participants, winners, animationSettings, createExtendedList]);

  const animateSpinnerByIndex = useCallback((
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

      const easeOut = rouletteEasing(progress, animationSettings.easeExponent);
      const currentProgress = fromIndex + (totalIndices * easeOut);

      const wholeIndex = Math.floor(currentProgress);
      const fractionalPart = currentProgress - wholeIndex;

      setCenterIndex(wholeIndex % itemsArray.length);
      setAnimationOffset(fractionalPart * itemHeight);

      // Fade out sound
      const autoSoundFadeStart = animationSettings.soundFadeStartPercent;
      const autoSoundFadeDuration = animationSettings.soundFadeDuration;

      if (spinSound.current && animationSettings.enableSounds && progress > autoSoundFadeStart && !soundFading) {
        soundFading = true;
        const fadeOutDurationMs = duration * autoSoundFadeDuration;
        const steps = 20;
        const stepMs = Math.max(16, Math.floor(fadeOutDurationMs / steps));
        const decrement = 1 / steps;
        const fadeInterval = setInterval(() => {
          if (spinSound.current) {
            spinSound.current.volume = Math.max(0, spinSound.current.volume - decrement);
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
  }, [animationSettings, itemHeight]);

  const handleSpinComplete = useCallback(async (winner: string) => {
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
        setWinners(prev => [
          ...prev,
          { workId: winner, wonAt: new Date().toISOString() }
        ]);
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
  }, [animationSettings, luckydrawId]);

  const handleDeleteWinner = useCallback(async (winnerWorkId: string) => {
    try {
      const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: winnerWorkId }),
      });

      if (response.ok) {
        setWinners(prev => prev.filter(w => w.workId !== winnerWorkId));
        toast.success("Winner removed successfully");
      } else {
        toast.error("Failed to remove winner");
      }
    } catch (error) {
      console.error("Error removing winner:", error);
      toast.error("Failed to remove winner");
    }
  }, [luckydrawId]);

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

      const particleCount = animationSettings.fireworksParticleCount * (timeLeft / duration);
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

        accumulatedOffset += (animationSettings.idleSpeed * delta);

        if (accumulatedOffset >= itemHeight) {
          setCenterIndex(prev => (prev + 1) % spinnerItems.length);
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
  }, [isSpinning, spinnerItems.length, showWinner, animationSettings.idleSpeed, itemHeight]);

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

  // Calculate visible items
  const renderedItems = useMemo(() => {
    if (spinnerItems.length === 0) return [];
    const items = [];
    const totalItems = spinnerItems.length;
    const visibleRange = animationSettings.visibleRange;

    for (let i = -visibleRange; i <= visibleRange; i++) {
      const absoluteIndex = centerIndex + i;
      const wrappedIndex = ((absoluteIndex % totalItems) + totalItems) % totalItems;
      items.push({
        text: spinnerItems[wrappedIndex],
        offset: i,
        key: `${absoluteIndex}-${spinnerItems[wrappedIndex]}`
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
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-center z-40">
        <BackButton />
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight text-gray-900">
            {luckyDraw?.name}
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
                top: '50%',
                transform: `translateY(calc(-50% - ${animationOffset}px))`,
                willChange: 'transform',
                transition: 'none'
              }}
            >
              {renderedItems.map((item) => {
                const distanceFromCenter = Math.abs(item.offset);
                const isCenter = item.offset === 0;
                const isNearCenter = distanceFromCenter <= 2;

                const scale = isCenter ? animationSettings.centerItemScale : 
                            isNearCenter ? animationSettings.nearCenterScale : 1;
                const opacity = isCenter ? 1 : Math.max(0.3, 1 - (distanceFromCenter * 0.05));
                const blur = distanceFromCenter > 8 ? 
                           Math.min(animationSettings.maxBlur, (distanceFromCenter - 8) * 0.1) : 0;

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
                pointerEvents: 'none'
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
                pointerEvents: 'none'
              }}
            />

            {/* Center Indicator */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div className="relative">
                <div className="h-[2px] w-full" style={{
                  background: `linear-gradient(90deg, transparent 0%, ${currentColors[1]}60 20%, ${currentColors[1]}80 50%, ${currentColors[1]}60 80%, transparent 100%)`,
                  boxShadow: `0 0 20px ${currentColors[1]}30`
                }} />
                <div className="absolute inset-0 h-[1px] w-full top-[1px]" style={{
                  background: `linear-gradient(90deg, transparent 0%, ${currentColors[3]}40 20%, ${currentColors[3]}60 50%, ${currentColors[3]}40 80%, transparent 100%)`,
                  filter: 'blur(4px)'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Previous Winner */}
        <div className="absolute left-2 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-40 hidden sm:block">
          <AnimatePresence mode="wait">
            {winners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl backdrop-blur-md"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div className="text-xs sm:text-sm uppercase tracking-widest mb-1 sm:mb-2 leading-tight font-medium text-gray-500">
                  Previous Winner
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {winners[winners.length - 1].workId}
                </div>
                <div className="text-xs mt-1 sm:mt-2 tracking-wide leading-relaxed text-gray-500">
                  {new Date(winners[winners.length - 1].wonAt).toLocaleTimeString("en-SG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Button */}
        <div className="fixed right-2 sm:right-4 lg:right-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40">
          <LuckyDrawSettings
            settings={animationSettings}
            onSettingsChange={setAnimationSettings}
            isSpinning={isSpinning}
            showSettings={showSettings}
            onShowSettingsChange={setShowSettings}
          />
        </div>

        {/* Winners Button */}
        <div className="fixed left-2 sm:left-4 lg:left-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size={typeof window !== 'undefined' && window.innerWidth < 640 ? "sm" : "default"}
                className="backdrop-blur-md bg-white/80 border border-white/50 hover:bg-white/90 text-gray-700 shadow-lg relative text-xs sm:text-sm"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Winners
                {winners.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-white rounded-full text-xs font-semibold" style={{ backgroundColor: currentColors[2] }}>
                    {winners.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Lucky Draw Winners</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3 pb-6">
                {winners.length === 0 ? (
                  <p className="text-center text-muted-foreground">No winners yet</p>
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
                        <span className="font-semibold tracking-wide leading-tight">{winner.workId}</span>
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
          <button
            onClick={handleSpin}
            disabled={isSpinning || participants.length === 0}
            className={cn(
              "relative group",
              "px-6 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4",
              "bg-white/90 backdrop-blur-sm",
              "border border-gray-200",
              "rounded-full",
              "transition-all duration-200 ease-out",
              "hover:bg-gray-50",
              "hover:border-gray-300",
              "hover:shadow-lg",
              "active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "disabled:hover:bg-white/90 disabled:hover:shadow-none"
            )}
          >
            <span
              className={cn(
                "font-medium text-xs sm:text-sm tracking-wider uppercase",
                "transition-colors duration-200",
                isSpinning ? "text-blue-600" : "text-gray-700",
                "group-hover:text-gray-900"
              )}
            >
              {isSpinning ? 'Spinning...' : 'Spin'}
            </span>
          </button>
        </div>
      </div>

      {/* Winner Display */}
      <AnimatePresence>
        {showWinner && currentWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-center relative"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium uppercase tracking-[0.3em] mb-4 leading-tight text-gray-500"
              >
                Congratulations
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  damping: 10,
                  stiffness: 200
                }}
                className="relative"
              >
                <div className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none px-4" style={{ color: currentColors[0] }}>
                  {currentWinner}
                </div>
                <motion.div
                  className="absolute -inset-4 blur-3xl rounded-full"
                  style={{ backgroundColor: `${currentColors[1]}15` }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}