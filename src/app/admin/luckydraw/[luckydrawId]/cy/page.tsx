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
import { Settings, RotateCcw } from "lucide-react";

type Winner = {
  workId: string;
  wonAt: string;
};

type AnimationSettings = {
  duration: number;
  easeExponent: number;
  // Spinner behavior
  minSpins: number;
  maxSpins: number;
  spinnerItemCount: number;
  idleSpeed: number; // pixels per second
  // Visual effects
  enableFireworks: boolean;
  fireworksDuration: number;
  fireworksParticleCount: number;
  winnerDisplayDuration: number;
  // Audio settings
  enableSounds: boolean;
  soundFadeStartPercent: number; // when to start fading spin sound (0-1)
  soundFadeDuration: number; // fade duration as percent of total (0-1)
  // Visual settings
  visibleRange: number; // items above/below center
  centerItemScale: number;
  nearCenterScale: number;
  maxBlur: number;
  // Colors (but keep BASE_COLORS synchronized)
  useCustomColors: boolean;
  customColors: string[];
};

type LuckyDraw = {
  id: number;
  name: string;
  eventIds: number[];
  createdAt: string;
  createdBy: string;
};

const BASE_COLORS = ["#173066", "#509bff", "#0463ce", "#63cbfb"];
// Responsive item heights
const getItemHeight = () => {
  if (typeof window === 'undefined') return 96; // Default for SSR
  if (window.innerWidth < 640) return 64; // Mobile
  if (window.innerWidth < 1024) return 80; // Tablet
  return 96; // Desktop
};
const ITEM_HEIGHT = 96; // Default height - will be calculated dynamically

// Default animation settings - comprehensive configuration
const DEFAULT_SETTINGS: AnimationSettings = {
  duration: 13000, // Match original spinningTime
  easeExponent: 4, // Reduced for more natural feel
  // Spinner behavior
  minSpins: 3,
  maxSpins: 5,
  spinnerItemCount: 200,
  idleSpeed: 30, // pixels per second
  // Visual effects
  enableFireworks: true,
  fireworksDuration: 5000, // 5 seconds
  fireworksParticleCount: 500,
  winnerDisplayDuration: 3000, // 3 seconds
  // Audio settings
  enableSounds: true,
  soundFadeStartPercent: 0.65, // Start fading at 65%
  soundFadeDuration: 0.35, // Fade over remaining 35%
  // Visual settings
  visibleRange: 20, // Number of items to render above and below center
  centerItemScale: 1.08,
  nearCenterScale: 1.02,
  maxBlur: 1,
  // Colors
  useCustomColors: false,
  customColors: ["#173066", "#509bff", "#0463ce", "#63cbfb"], // Default to BASE_COLORS
};

// Smooth easing function that mimics roulette physics without abrupt transitions
const rouletteEasing = (progress: number, exponent: number): number => {
  // Use a smooth curve that gradually increases the easing strength
  // This creates continuous deceleration without sudden changes in speed
  const smoothExponent = 2 + (exponent - 2) * Math.pow(progress, 1.5);
  return 1 - Math.pow(1 - progress, smoothExponent);
};

// Add shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

export default function LuckyDrawCY() {
  const params = useParams();

  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  // Helper to get current colors based on settings
  const getCurrentColors = () => {
    return animationSettings.useCustomColors ? animationSettings.customColors : BASE_COLORS;
  };


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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Vertical spinner states - INDEX BASED SYSTEM
  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [centerIndex, setCenterIndex] = useState(0); // Track which index is at center
  const [animationOffset, setAnimationOffset] = useState(0); // For smooth animations
  const spinnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const [isIdleAnimating, setIsIdleAnimating] = useState(false);

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  // Initialize audio and inject styles
  useEffect(() => {
    // Scroll down to hide the navbar and ensure full page view
    window.scrollTo(0, 100); // Scroll down to hide navbar

    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
      applauseSound.current = new Audio("/sounds/applause1.mp3");
    }

    // Inject shimmer and shine animations
    let style: HTMLStyleElement | null = null;
    if (typeof document !== 'undefined') {
      style = document.createElement('style');
      style.textContent = shimmerKeyframes + `
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Restore scrolling when component unmounts
      document.body.style.overflow = 'auto';

      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
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

      // Create extended list for spinner - more items for seamless scrolling
      const extendedList = createExtendedList(uniqueParticipants, animationSettings.spinnerItemCount);
      setSpinnerItems(extendedList);

      // Start at index 0
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

  const createExtendedList = (items: string[], targetLength: number): string[] => {
    if (items.length === 0) return [];
    const result = [];
    // Simply repeat the items to reach target length
    while (result.length < targetLength) {
      // Shuffle each repetition for variety
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      result.push(...shuffled);
    }
    return result.slice(0, targetLength);
  };

  const handleSpin = async () => {
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

    // Find a valid winner (not already won)
    let winnerIndex = -1;
    const availableIndices = [];

    // Collect all valid indices
    for (let i = 0; i < newSpinnerItems.length; i++) {
      if (!winners.some(w => w.workId === newSpinnerItems[i])) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length > 0) {
      winnerIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      winnerIndex = Math.floor(newSpinnerItems.length / 2); // Fallback
    }

    const intendedWinner = newSpinnerItems[winnerIndex];

    // Play spin sound
    if (spinSound.current && animationSettings.enableSounds) {
      spinSound.current.currentTime = 1;
      spinSound.current.play();
    }

    // Reset to start position for new spin
    setCenterIndex(0);
    setAnimationOffset(0);

    // Calculate total indices to spin through
    const totalItems = newSpinnerItems.length;
    const spins = animationSettings.minSpins + Math.random() * (animationSettings.maxSpins - animationSettings.minSpins);
    const baseTarget = Math.floor(spins) * totalItems + winnerIndex;

    // Add random offset within the winner's card (0 to 0.9 of item height)
    // This makes it stop at different positions within the winner's area
    const randomOffset = Math.random() * 0.9;
    const finalTarget = baseTarget + randomOffset;

    // Animate through indices - include the offset in the final target
    animateSpinnerByIndex(0, finalTarget, animationSettings.duration, intendedWinner, newSpinnerItems);
  };

  const animateSpinnerByIndex = (
    fromIndex: number,
    toIndex: number,
    duration: number,
    winner: string,
    itemsArray: string[]
  ) => {
    // Cancel any existing animation before starting new one
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

      // Use the new roulette-style easing for more natural deceleration
      const easeOut = rouletteEasing(progress, animationSettings.easeExponent);

      const currentProgress = fromIndex + (totalIndices * easeOut);

      // Update center index and animation offset for smooth visual
      const wholeIndex = Math.floor(currentProgress);
      const fractionalPart = currentProgress - wholeIndex;

      setCenterIndex(wholeIndex % itemsArray.length);
      setAnimationOffset(fractionalPart * getItemHeight());

      // Fade out sound based on configurable timing
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
        // Animation complete - we're at toIndex (which already includes the random offset)
        const wholeIndex = Math.floor(toIndex);
        const fractionalPart = toIndex - wholeIndex;

        setCenterIndex(wholeIndex % itemsArray.length);
        setAnimationOffset(fractionalPart * getItemHeight());

        // The winner is determined by the base position (without random offset)
        const baseWinnerIndex = Math.floor(toIndex) % itemsArray.length;
        const actualWinnerAtPosition = itemsArray[baseWinnerIndex];
        if (actualWinnerAtPosition !== winner) {
          console.warn(`Mismatch! Expected: ${winner}, Got: ${actualWinnerAtPosition} at position ${baseWinnerIndex}`);
        }

        // Always use the winner that was predetermined
        handleSpinComplete(winner);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };


  const handleSpinComplete = async (winner: string) => {
    setCurrentWinner(winner);

    // Stop spin sound if still playing (should already be faded out)
    if (spinSound.current) {
      spinSound.current.pause();
      spinSound.current.currentTime = 0;
      spinSound.current.volume = 1; // Reset volume for next spin
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

    // Auto-hide winner after configurable duration
    setTimeout(() => {
      setShowWinner(false);
    }, animationSettings.winnerDisplayDuration);
  };

  const handleDeleteWinner = async (winnerWorkId: string) => {
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
  };

  const triggerFireworks = () => {
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
  };

  // idle animation
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      setIsIdleAnimating(true);
      let accumulatedOffset = animationOffset; // Start from current offset instead of 0
      let lastTime = performance.now();

      const animateIdle = () => {
        if (isSpinning || showWinner || spinnerItems.length === 0) {
          setIsIdleAnimating(false);
          return;
        }

        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        // Accumulate offset
        accumulatedOffset += (animationSettings.idleSpeed * delta); // Configurable idle speed in pixels

        // When we've moved more than one item height, jump to next index
        const currentItemHeight = getItemHeight();
        if (accumulatedOffset >= currentItemHeight) {
          setCenterIndex(prev => (prev + 1) % spinnerItems.length);
          accumulatedOffset = accumulatedOffset % currentItemHeight;
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
  }, [isSpinning, spinnerItems.length, showWinner]);

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

  // Calculate visible items based on center index and settings

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
        offset: i, // Offset from center (-20 to +20)
        key: `${absoluteIndex}-${spinnerItems[wrappedIndex]}`
      });
    }
    return items;
  }, [spinnerItems, centerIndex]);

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
      {/* Clean minimal background */}
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

      {/* Main Content - Full height spinner */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Spinner Container - Full height, no card */}
        <div className="relative w-full max-w-sm sm:max-w-2xl lg:max-w-3xl h-screen">
          {/* Vertical Spinner - Full Height */}
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
                // Calculate position based on offset from center
                const itemPosition = item.offset * getItemHeight();
                const distanceFromCenter = Math.abs(item.offset);

                // Item at offset 0 is the center item
                const isCenter = item.offset === 0;
                const isNearCenter = distanceFromCenter <= 2;

                // Visual properties based on distance from center
                const scale = isCenter ? animationSettings.centerItemScale : isNearCenter ? animationSettings.nearCenterScale : 1;
                const opacity = isCenter ? 1 : Math.max(0.3, 1 - (distanceFromCenter * 0.05));
                const blur = distanceFromCenter > 8 ? Math.min(animationSettings.maxBlur, (distanceFromCenter - 8) * 0.1) : 0;

                return (
                  <div
                    key={item.key}
                    className="absolute left-0 right-0 h-16 sm:h-20 lg:h-24 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12"
                    style={{
                      top: `${itemPosition}px`,
                      opacity,
                      filter: blur > 0 ? `blur(${blur}px)` : 'none',
                      transform: `translateX(-50%) translateX(50%) scale(${scale})`,
                      transition: isIdleAnimating || isSpinning ? 'none' : 'all 0.4s ease-out',
                      willChange: 'transform, opacity, filter'
                    }}
                  >
                    {/* Glassmorphic card container */}
                    <div
                      className={cn(
                        "relative px-4 sm:px-6 lg:px-10 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl overflow-hidden",
                        "transition-all duration-300"
                      )}
                      style={{
                        background: isCenter
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(10px) saturate(150%)',
                        border: isCenter
                          ? `1px solid rgba(255, 255, 255, 0.2)`
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isCenter
                          ? `0 8px 32px 0 rgba(0, 0, 0, 0.1),
                             inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                          : `0 4px 16px 0 rgba(0, 0, 0, 0.05),
                             inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                      }}
                    >
                      <span
                        className={cn(
                          "relative z-10 font-semibold transition-all duration-300 block text-center",
                          isCenter && "font-bold"
                        )}
                        style={{
                          color: isCenter ? '#000000' : '#6B7280',
                          fontSize: isCenter ? 'clamp(1.25rem, 4vw, 2.25rem)' : 'clamp(0.875rem, 2.5vw, 1.5rem)',
                          fontWeight: isCenter ? 800 : 500,
                          letterSpacing: isCenter ? '0.02em' : '0.01em',
                          textShadow: isCenter ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                          willChange: 'transform'
                        }}
                      >
                        {item.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GradualBlur for smooth melting effect - positioned absolutely */}
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
                  background: `linear-gradient(90deg, transparent 0%, ${getCurrentColors()[1]}60 20%, ${getCurrentColors()[1]}80 50%, ${getCurrentColors()[1]}60 80%, transparent 100%)`,
                  boxShadow: `0 0 20px ${getCurrentColors()[1]}30`
                }} />
                {/* Glow effect */}
                <div className="absolute inset-0 h-[1px] w-full top-[1px]" style={{
                  background: `linear-gradient(90deg, transparent 0%, ${getCurrentColors()[3]}40 20%, ${getCurrentColors()[3]}60 50%, ${getCurrentColors()[3]}40 80%, transparent 100%)`,
                  filter: 'blur(4px)'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Previous Winner - Left Side Center */}
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

        {/* Settings Button - Fixed Bottom Right */}
        <div className="fixed right-2 sm:right-4 lg:right-8 bottom-2 sm:bottom-4 lg:bottom-8 z-40">
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size={typeof window !== 'undefined' && window.innerWidth < 640 ? "sm" : "default"}
                className="backdrop-blur-md bg-white/80 border border-white/50 hover:bg-white/90 text-gray-700 shadow-lg text-xs sm:text-sm"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Lucky Draw Settings
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Customize the animation, visual effects, and behavior
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-6 pb-6">
                {/* Basic Settings Section */}
                {/* TODO: ideally we move this settings section to it's own component. */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Basic Settings</h3>

                  {/* Duration Setting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Spin Duration
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {(animationSettings.duration / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="8000"
                      max="18000"
                      step="1000"
                      value={animationSettings.duration}
                      onChange={(e) => setAnimationSettings(prev => ({
                        ...prev,
                        duration: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isSpinning}
                      title="How long the spin animation takes to complete"
                    />
                    <div className="text-xs text-muted-foreground">
                      Controls the total spin time (8-18 seconds)
                    </div>
                  </div>

                  {/* Ease Exponent Setting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Deceleration Intensity
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {animationSettings.easeExponent}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="1"
                      value={animationSettings.easeExponent}
                      onChange={(e) => setAnimationSettings(prev => ({
                        ...prev,
                        easeExponent: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isSpinning}
                      title="How dramatically the spinner slows down near the end"
                    />
                    <div className="text-xs text-muted-foreground">
                      Lower = gradual slowdown, Higher = dramatic brake effect
                    </div>
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Sound Effects</label>
                      <div className="text-xs text-muted-foreground">
                        Spin sounds and celebration audio
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnimationSettings(prev => ({
                        ...prev,
                        enableSounds: !prev.enableSounds
                      }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        animationSettings.enableSounds ? "bg-blue-600" : "bg-gray-200"
                      )}
                      disabled={isSpinning}
                      title="Toggle all sound effects"
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          animationSettings.enableSounds ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Fireworks Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Confetti Animation</label>
                      <div className="text-xs text-muted-foreground">
                        Celebration fireworks when winner is announced
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnimationSettings(prev => ({
                        ...prev,
                        enableFireworks: !prev.enableFireworks
                      }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        animationSettings.enableFireworks ? "bg-blue-600" : "bg-gray-200"
                      )}
                      disabled={isSpinning}
                      title="Toggle confetti celebration"
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          animationSettings.enableFireworks ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSpinning}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Advanced Settings</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showAdvancedSettings ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                </div>

                {/* Advanced Settings Content */}
                <AnimatePresence>
                  {showAdvancedSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden space-y-6"
                    >
                      {/* Animation Advanced Settings */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-700">Animation Control</h4>

                        {/* Spin Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Min Spins</label>
                              <span className="text-sm text-muted-foreground">
                                {animationSettings.minSpins}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={animationSettings.minSpins}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setAnimationSettings(prev => ({
                                  ...prev,
                                  minSpins: value,
                                  maxSpins: Math.max(value, prev.maxSpins)
                                }));
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              disabled={isSpinning}
                              title="Minimum number of full rotations"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Max Spins</label>
                              <span className="text-sm text-muted-foreground">
                                {animationSettings.maxSpins}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="2"
                              max="8"
                              step="1"
                              value={animationSettings.maxSpins}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setAnimationSettings(prev => ({
                                  ...prev,
                                  maxSpins: value,
                                  minSpins: Math.min(value, prev.minSpins)
                                }));
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              disabled={isSpinning}
                              title="Maximum number of full rotations"
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Random spins between min and max for unpredictability
                        </div>

                        {/* Idle Speed */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Idle Animation Speed
                            </label>
                            <span className="text-sm text-muted-foreground">
                              {animationSettings.idleSpeed}px/s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            value={animationSettings.idleSpeed}
                            onChange={(e) => setAnimationSettings(prev => ({
                              ...prev,
                              idleSpeed: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                            title="Speed of the gentle scrolling when not spinning"
                          />
                          <div className="text-xs text-muted-foreground">
                            Controls the gentle movement between spins (0 = disabled)
                          </div>
                        </div>
                      </div>

                      {/* Visual Effects Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Visual Effects</h3>

                        {/* Visual Range */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Visible Items
                            </label>
                            <span className="text-sm text-muted-foreground">
                              {animationSettings.visibleRange * 2 + 1} total
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={animationSettings.visibleRange}
                            onChange={(e) => setAnimationSettings(prev => ({
                              ...prev,
                              visibleRange: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                            title="Number of items visible above and below the center"
                          />
                          <div className="text-xs text-muted-foreground">
                            More items = smoother scrolling, fewer = better performance
                          </div>
                        </div>

                        {/* Scale Settings */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Center Scale</label>
                              <span className="text-sm text-muted-foreground">
                                {animationSettings.centerItemScale}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="150"
                              step="2"
                              value={animationSettings.centerItemScale * 100}
                              onChange={(e) => setAnimationSettings(prev => ({
                                ...prev,
                                centerItemScale: parseInt(e.target.value) / 100
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              disabled={isSpinning}
                              title="How much larger the center item appears"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Near Scale</label>
                              <span className="text-sm text-muted-foreground">
                                {animationSettings.nearCenterScale}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="120"
                              step="1"
                              value={animationSettings.nearCenterScale * 100}
                              onChange={(e) => setAnimationSettings(prev => ({
                                ...prev,
                                nearCenterScale: parseInt(e.target.value) / 100
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              disabled={isSpinning}
                              title="Scale for items near the center"
                            />
                          </div>
                        </div>

                        {/* Max Blur */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Edge Blur Intensity
                            </label>
                            <span className="text-sm text-muted-foreground">
                              {animationSettings.maxBlur}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={animationSettings.maxBlur}
                            onChange={(e) => setAnimationSettings(prev => ({
                              ...prev,
                              maxBlur: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                            title="Blur effect for items far from center"
                          />
                          <div className="text-xs text-muted-foreground">
                            Adds depth by blurring distant items (0 = no blur)
                          </div>
                        </div>

                        {/* Custom Colors */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Custom Theme Colors
                            </label>
                            <button
                              type="button"
                              onClick={() => setAnimationSettings(prev => ({
                                ...prev,
                                useCustomColors: !prev.useCustomColors
                              }))}
                              className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                animationSettings.useCustomColors ? "bg-blue-600" : "bg-gray-200"
                              )}
                              disabled={isSpinning}
                              title="Toggle custom color theme"
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                  animationSettings.useCustomColors ? "translate-x-6" : "translate-x-1"
                                )}
                              />
                            </button>
                          </div>

                          {animationSettings.useCustomColors && (
                            <div className="grid grid-cols-2 gap-2">
                              {animationSettings.customColors.map((color, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                      const newColors = [...animationSettings.customColors];
                                      newColors[index] = e.target.value;
                                      setAnimationSettings(prev => ({
                                        ...prev,
                                        customColors: newColors
                                      }));
                                    }}
                                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                    disabled={isSpinning}
                                    title={`Theme color ${index + 1}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    Color {index + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Audio & Effects Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Audio & Effects</h3>

                        {/* Sound Toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Sound Effects</label>
                            <div className="text-xs text-muted-foreground">
                              Spin sounds and celebration audio
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnimationSettings(prev => ({
                              ...prev,
                              enableSounds: !prev.enableSounds
                            }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              animationSettings.enableSounds ? "bg-blue-600" : "bg-gray-200"
                            )}
                            disabled={isSpinning}
                            title="Toggle all sound effects"
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                animationSettings.enableSounds ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>

                        {/* Fireworks Toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Confetti Animation</label>
                            <div className="text-xs text-muted-foreground">
                              Celebration fireworks when winner is announced
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnimationSettings(prev => ({
                              ...prev,
                              enableFireworks: !prev.enableFireworks
                            }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              animationSettings.enableFireworks ? "bg-blue-600" : "bg-gray-200"
                            )}
                            disabled={isSpinning}
                            title="Toggle confetti celebration"
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                animationSettings.enableFireworks ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>

                        {/* Advanced Audio Settings */}
                        {animationSettings.enableSounds && (
                          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700">Advanced Audio</h4>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">
                                  Sound Fade Start
                                </label>
                                <span className="text-xs text-muted-foreground">
                                  {(animationSettings.soundFadeStartPercent * 100).toFixed(0)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="0.8"
                                step="0.05"
                                value={animationSettings.soundFadeStartPercent}
                                onChange={(e) => setAnimationSettings(prev => ({
                                  ...prev,
                                  soundFadeStartPercent: parseFloat(e.target.value)
                                }))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                disabled={isSpinning}
                                title="When to start fading the spin sound"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium">
                                  Fade Duration
                                </label>
                                <span className="text-xs text-muted-foreground">
                                  {(animationSettings.soundFadeDuration * 100).toFixed(0)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.2"
                                max="0.5"
                                step="0.05"
                                value={animationSettings.soundFadeDuration}
                                onChange={(e) => setAnimationSettings(prev => ({
                                  ...prev,
                                  soundFadeDuration: parseFloat(e.target.value)
                                }))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                disabled={isSpinning}
                                title="How long the sound fade takes"
                              />
                            </div>
                          </div>
                        )}

                        {/* Advanced Effects Settings */}
                        {animationSettings.enableFireworks && (
                          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700">Advanced Effects</h4>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium">Duration</label>
                                  <span className="text-xs text-muted-foreground">
                                    {(animationSettings.fireworksDuration / 1000).toFixed(1)}s
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="3000"
                                  max="10000"
                                  step="500"
                                  value={animationSettings.fireworksDuration}
                                  onChange={(e) => setAnimationSettings(prev => ({
                                    ...prev,
                                    fireworksDuration: parseInt(e.target.value)
                                  }))}
                                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  disabled={isSpinning}
                                  title="How long confetti animation lasts"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-medium">Intensity</label>
                                  <span className="text-xs text-muted-foreground">
                                    {animationSettings.fireworksParticleCount}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="200"
                                  max="1000"
                                  step="50"
                                  value={animationSettings.fireworksParticleCount}
                                  onChange={(e) => setAnimationSettings(prev => ({
                                    ...prev,
                                    fireworksParticleCount: parseInt(e.target.value)
                                  }))}
                                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  disabled={isSpinning}
                                  title="Number of confetti particles"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Winner Display Duration */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Winner Display Time
                            </label>
                            <span className="text-sm text-muted-foreground">
                              {(animationSettings.winnerDisplayDuration / 1000).toFixed(1)}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1000"
                            max="8000"
                            step="500"
                            value={animationSettings.winnerDisplayDuration}
                            onChange={(e) => setAnimationSettings(prev => ({
                              ...prev,
                              winnerDisplayDuration: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                            title="How long the winner announcement is displayed"
                          />
                          <div className="text-xs text-muted-foreground">
                            Duration before winner overlay auto-dismisses
                          </div>
                        </div>
                      </div>

                      {/* Performance Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Performance</h3>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              Spinner Item Pool
                            </label>
                            <span className="text-sm text-muted-foreground">
                              {animationSettings.spinnerItemCount} items
                            </span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="500"
                            step="25"
                            value={animationSettings.spinnerItemCount}
                            onChange={(e) => setAnimationSettings(prev => ({
                              ...prev,
                              spinnerItemCount: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                            title="Total items in the spinner pool for smooth scrolling"
                          />
                          <div className="text-xs text-muted-foreground">
                            More items = smoother long spins, but uses more memory
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reset Section */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setAnimationSettings(DEFAULT_SETTINGS)}
                    disabled={isSpinning}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All Settings
                  </Button>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Restore all settings to their default values
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Winners Button - Fixed Bottom Left */}
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
                  <span className="ml-2 px-2 py-0.5 text-white rounded-full text-xs font-semibold" style={{ backgroundColor: getCurrentColors()[2] }}>
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
                <div className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none px-4" style={{ color: getCurrentColors()[0] }}>
                  {currentWinner}
                </div>
                <motion.div
                  className="absolute -inset-4 blur-3xl rounded-full"
                  style={{ backgroundColor: `${getCurrentColors()[1]}15` }}
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