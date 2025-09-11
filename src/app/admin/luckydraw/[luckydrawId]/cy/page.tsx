"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import GradualBlur from "@/components/GradualBlur";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, LayoutGrid, Trophy } from "lucide-react";
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

export default function LuckyDrawCY() {
  const params = useParams();
  const router = useRouter();

  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  // Theme state - local only
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Core states
  const [initialLoading, setInitialLoading] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [luckyDraw, setLuckyDraw] = useState<LuckyDraw | null>(null);
  const [error, setError] = useState("");
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  // Vertical spinner states
  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const idlePositionRef = useRef<number>(0);
  const viewportHalfRef = useRef<number>(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  const idleAnimationWAAPIRef = useRef<Animation | null>(null);
  const idleStartPosRef = useRef<number>(0);
  const idleStartTimeRef = useRef<number>(0);
  const idleSpeedRef = useRef<number>(30);

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  // Track viewport half for transform math and restart idle animation on resize
  useEffect(() => {
    const handleResize = () => {
      viewportHalfRef.current = window.innerHeight / 2;

      // Restart idle animation to match new viewport
      if (!isSpinning && spinnerItems.length > 0 && !showWinner && spinnerRef.current) {
        const itemHeight = 96;
        const baseHeight = spinnerItems.length * itemHeight;
        const now = performance.now();

        let startPos = baseHeight === 0
          ? 0
          : ((currentPosition % baseHeight) + baseHeight) % baseHeight;

        if (idleAnimationWAAPIRef.current) {
          const elapsedSec = (now - idleStartTimeRef.current) / 1000;
          startPos = (idleStartPosRef.current + idleSpeedRef.current * elapsedSec) % baseHeight;
          idleAnimationWAAPIRef.current.cancel();
          idleAnimationWAAPIRef.current = null;
        }

        idleStartPosRef.current = startPos;
        idleStartTimeRef.current = now;
        idlePositionRef.current = startPos;

        const fromY = viewportHalfRef.current - (baseHeight + startPos) - 48;
        const toY = fromY - baseHeight;
        const duration = (baseHeight / idleSpeedRef.current) * 1000;

        const anim = spinnerRef.current.animate(
          [
            { transform: `translate3d(0, ${fromY}px, 0)` },
            { transform: `translate3d(0, ${toY}px, 0)` }
          ],
          {
            duration,
            iterations: Infinity,
            easing: 'linear'
          }
        );
        idleAnimationWAAPIRef.current = anim;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSpinning, spinnerItems.length, showWinner, currentPosition]);

  // Initialize theme from localStorage (page-specific)
  useEffect(() => {
    const savedTheme = localStorage.getItem("luckydraw-cy-theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  // Save theme preference (page-specific)
  useEffect(() => {
    localStorage.setItem("luckydraw-cy-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Initialize audio
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
      applauseSound.current = new Audio("/sounds/applause1.mp3");
    }
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

      // Create extended list for spinner
      const extendedList = createExtendedList(uniqueParticipants, 100);
      setSpinnerItems(extendedList);

      // Set initial position to show some items
      setCurrentPosition(0);

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
    while (result.length < targetLength) {
      result.push(...[...items].sort(() => Math.random() - 0.5));
    }
    return result.slice(0, targetLength);
  };

  const handleSpin = async () => {
    if (isSpinning || participants.length === 0) return;

    // Derive seamless start position from idle WAAPI, if running
    const itemHeight = 96;
    const baseHeight = spinnerItems.length * itemHeight;
    let startPos = currentPosition;
    if (idleAnimationWAAPIRef.current && baseHeight > 0) {
      const now = performance.now();
      const elapsedSec = (now - idleStartTimeRef.current) / 1000;
      startPos = (idleStartPosRef.current + idleSpeedRef.current * elapsedSec) % baseHeight;
      idleAnimationWAAPIRef.current.cancel();
      idleAnimationWAAPIRef.current = null;
    } else if (idlePositionRef.current) {
      startPos = idlePositionRef.current;
    }

    setIsSpinning(true);
    setShowWinner(false);
    setError("");

    // Sync state position from idle animation for a seamless transition
    setCurrentPosition(startPos);

    // Reset and shuffle spinner items
    const newSpinnerItems = createExtendedList(participants, 100);
    setSpinnerItems(newSpinnerItems);

    // Find a valid winner (not already won)
    let validIndex = -1;
    let attempts = 0;
    while (attempts < 20) {
      const candidateIndex = 40 + Math.floor(Math.random() * 20);
      const candidate = newSpinnerItems[candidateIndex];
      if (!winners.some(w => w.workId === candidate)) {
        validIndex = candidateIndex;
        break;
      }
      attempts++;
    }

    if (validIndex === -1) {
      validIndex = 50; // Fallback
    }

    targetIndexRef.current = validIndex;

    // Play spin sound
    if (spinSound.current) {
      spinSound.current.currentTime = 1;
      spinSound.current.play();

      const handleTimeUpdate = () => {
        if (spinSound.current && spinSound.current.currentTime >= 10.5) {
          spinSound.current.pause();
          spinSound.current.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };
      spinSound.current.addEventListener("timeupdate", handleTimeUpdate);
    }

    // Start animation - compute a target that lands with the item centered
    const itemHeight2 = 96; // h-24 = 96px

    // Compute target row so that after spinning, the chosen index is exactly centered
    const cycles = 6; // full loops for excitement
    const N = newSpinnerItems.length;
    const baseRow = Math.round(startPos / itemHeight2);
    const rowOffset = (validIndex - (baseRow % N) + N) % N; // rows to reach chosen index from current row
    const targetRow = baseRow + cycles * N + rowOffset; // ensures k % N === validIndex

    const from = startPos;
    const to = targetRow * itemHeight2;

    // Main spin
    animateSpinner(from, to, 4200, () => {
      // Anticipation: small stepped bumps into the final center
      const stepCount = 6;
      const stepSize = itemHeight2 / stepCount;
      const anticipation = (i: number) => {
        if (i >= stepCount) {
          // Final snap to exact center position
          const normalizedTargetIndex = (Math.floor((to / itemHeight2)) % spinnerItems.length);
          const centerIndex = normalizedTargetIndex; // already integer index
          const finalPos = Math.round((to / itemHeight2)) * itemHeight2; // align to exact row
          setCurrentPosition(finalPos);
          handleSpinComplete(newSpinnerItems[validIndex]);
          return;
        }
        const segmentTo = to + (i + 1) * stepSize;
        animateSpinner(i === 0 ? to : to + i * stepSize, segmentTo, 120 + i * 40, () => anticipation(i + 1));
      };

      anticipation(0);
    });
  };

  const animateSpinner = (
    from: number,
    to: number,
    duration: number,
    onComplete: () => void
  ) => {
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smoother easing function with easeOutCubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPos = from + (to - from) * easeOut;

      setCurrentPosition(currentPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  };

  const handleSpinComplete = async (winner: string) => {
    setCurrentWinner(winner);

    // Stop spin sound
    if (spinSound.current) {
      spinSound.current.pause();
      spinSound.current.currentTime = 0;
    }

    // Play celebration sounds
    if (celebrateSound.current) {
      celebrateSound.current.currentTime = 0;
      celebrateSound.current.play();
    }

    if (applauseSound.current) {
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

    // Ensure perfect center alignment using modulo track
    const index = spinnerItems.findIndex(item => item === winner);
    if (index !== -1) {
      const itemHeight = 96;
      const currentCycles = Math.floor(currentPosition / (spinnerItems.length * itemHeight));
      const finalPos = (currentCycles * spinnerItems.length + index) * itemHeight;
      setCurrentPosition(finalPos);
    }

    // Trigger effects
    triggerFireworks();
    setShowWinner(true);
    setIsSpinning(false);

    // Auto-hide winner after 3 seconds
    setTimeout(() => {
      setShowWinner(false);
    }, 3000);
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
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 500 * (timeLeft / duration);
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

  // Improved idle animation with smooth continuous motion
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner && spinnerRef.current) {
      const itemHeight = 96;
      const baseHeight = spinnerItems.length * itemHeight;

      const startPos = baseHeight === 0
        ? 0
        : ((currentPosition % baseHeight) + baseHeight) % baseHeight;

      idleStartPosRef.current = startPos;
      idleStartTimeRef.current = performance.now();
      idlePositionRef.current = startPos;

      // Compute start and end transforms in pixels
      const fromY = viewportHalfRef.current - (baseHeight + startPos) - 48;
      const toY = fromY - baseHeight;

      const duration = (baseHeight / idleSpeedRef.current) * 1000;

      // Cancel any existing WAAPI animation
      if (idleAnimationWAAPIRef.current) {
        idleAnimationWAAPIRef.current.cancel();
        idleAnimationWAAPIRef.current = null;
      }

      // Start WAAPI animation
      const anim = spinnerRef.current.animate(
        [
          { transform: `translate3d(0, ${fromY}px, 0)` },
          { transform: `translate3d(0, ${toY}px, 0)` }
        ],
        {
          duration,
          iterations: Infinity,
          easing: 'linear'
        }
      );
      idleAnimationWAAPIRef.current = anim;
    }

    return () => {
      if (idleAnimationWAAPIRef.current) {
        idleAnimationWAAPIRef.current.cancel();
        idleAnimationWAAPIRef.current = null;
      }
    };
  }, [isSpinning, spinnerItems.length, showWinner, currentPosition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
      if (idleAnimationWAAPIRef.current) {
        idleAnimationWAAPIRef.current.cancel();
      }
    };
  }, []);

  // Derived sizes for infinite scroll and center positioning
  const BASE_HEIGHT = spinnerItems.length * 96;
  const normalizedPosition = BASE_HEIGHT === 0
    ? 0
    : ((currentPosition % BASE_HEIGHT) + BASE_HEIGHT) % BASE_HEIGHT;
  const displayOffset = BASE_HEIGHT; // show the middle copy in a tripled track

  const renderedItems = useMemo(
    () => (spinnerItems.length ? [...spinnerItems, ...spinnerItems, ...spinnerItems] : []),
    [spinnerItems]
  );

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
    <div className={cn("min-h-screen relative overflow-hidden", isDarkMode ? "dark bg-black" : "bg-white")}>
      {/* PayPal colors background with ripple effect */}
      <div className="absolute inset-0 z-0">
        {/* Custom gradient overlay with PayPal colors */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${BASE_COLORS[0]}40 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, ${BASE_COLORS[1]}40 0%, transparent 50%),
                        radial-gradient(circle at 40% 20%, ${BASE_COLORS[2]}40 0%, transparent 50%),
                        radial-gradient(circle at 90% 10%, ${BASE_COLORS[3]}40 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
        <BackButton />
        <div className="flex items-center gap-3">
          <h1 className={cn(
            "text-2xl font-bold tracking-tight leading-tight",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {luckyDraw?.name}
          </h1>
        </div>
      </div>

      {/* Main Content - Full height spinner */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Spinner Container - Full height, no card */}
        <div className="relative w-full max-w-3xl h-screen">
          {/* Vertical Spinner - Full Height */}
          <div className="relative h-full flex items-center justify-center overflow-hidden">
            <div
              ref={spinnerRef}
              className="absolute w-full"
              style={{
                transform: `translate3d(0, calc(50vh - ${(displayOffset + normalizedPosition)}px - 48px), 0)`,
                willChange: 'transform'
              }}
            >
              {renderedItems.map((item, index) => {
                // Compute distance from the center line using the wrapped position
                const containerShift = displayOffset + normalizedPosition; // px
                const itemTop = index * 96; // px
                const distanceFromCenter = Math.abs(itemTop - containerShift) / 96;
                const isCenter = distanceFromCenter < 0.5;
                const isNearCenter = distanceFromCenter < 2;
                const opacity = isCenter ? 1 : isNearCenter ? 0.9 : Math.max(0.5, 1 - distanceFromCenter * 0.1);
                const scale = isCenter ? 1.05 : Math.max(0.98, 1 - distanceFromCenter * 0.01);
                const blur = 0; // No blur effect

                return (
                  <div
                    key={`${item}-${index}`}
                    className="h-24 flex items-center justify-center px-8"
                    style={{
                      opacity,
                      transform: `scale(${scale})`,
                      filter: `blur(${blur}px)`,
                      transition: isSpinning ? 'none' : 'all 0.2s ease-out'
                    }}
                  >
                    <div
                      className={cn(
                        "px-8 py-3 rounded-xl shadow-2xl",
                        "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                        "border border-white/20 dark:border-white/10",
                        isCenter
                          ? "ring-2 ring-offset-0 ring-[#509bff]/60"
                          : ""
                      )}
                    >
                      <span
                        className={cn(
                          "transition-all duration-200",
                          isCenter
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-[#173066] via-[#0463ce] to-[#509bff] tracking-wide"
                            : isNearCenter
                              ? isDarkMode ? "text-white/90 tracking-normal" : "text-gray-800 tracking-normal"
                              : isDarkMode ? "text-white/50 tracking-normal" : "text-gray-600 tracking-normal"
                        )}
                        style={{
                          fontSize: isCenter ? '2.25rem' : isNearCenter ? '1.9rem' : '1.5rem',
                          fontWeight: isCenter ? 700 : isNearCenter ? 600 : 500,
                          lineHeight: isCenter ? '1.1' : isNearCenter ? '1.2' : '1.3',
                          letterSpacing: isCenter ? '0.025em' : isNearCenter ? '0.01em' : '0',
                          textShadow: isCenter
                            ? `0 0 30px ${BASE_COLORS[1]}80, 0 2px 4px rgba(0,0,0,0.2)`
                            : isNearCenter
                              ? '0 1px 2px rgba(0,0,0,0.1)'
                              : 'none'
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GradualBlur for smooth melting effect - positioned absolutely */}
            <GradualBlur
              position="top"
              height="10rem"
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
              height="10rem"
              strength={2.5}
              divCount={10}
              opacity={0.95}
              exponential={true}
              style={{
                zIndex: 20,
                pointerEvents: 'none'
              }}
            />

            {/* Center Indicator - single line */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#509bff] to-transparent opacity-80" />
            </div>
          </div>
        </div>

        {/* Previous Winner - Left Side */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40">
          <AnimatePresence mode="wait">
            {winners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={cn(
                  "p-6 rounded-2xl",
                  "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                  "border border-white/20 dark:border-white/10"
                )}
              >
                <div className={cn(
                  "text-xs uppercase tracking-widest mb-2 leading-tight font-medium",
                  isDarkMode ? "text-white/60" : "text-gray-600"
                )}>
                  Previous Winner
                </div>
                <div className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#173066] to-[#509bff] tracking-wide leading-tight">
                  {winners[winners.length - 1].workId}
                </div>
                <div className={cn(
                  "text-xs mt-2 tracking-wide leading-relaxed",
                  isDarkMode ? "text-white/40" : "text-gray-500"
                )}>
                  {new Date(winners[winners.length - 1].wonAt).toLocaleTimeString("en-SG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls - Right Side with SPIN button and config below */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-40">
          {/* SPIN Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              size="lg"
              className={cn(
                "group relative overflow-hidden",
                "px-20 py-10 text-3xl font-bold rounded-2xl",
                "bg-gradient-to-br from-[#173066] via-[#0463ce] to-[#509bff]",
                "hover:from-[#0463ce] hover:to-[#173066]",
                "text-white shadow-2xl",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-300"
              )}
            >
              <span className="relative z-10 tracking-widest leading-none font-extrabold">
                {isSpinning ? 'SPINNING' : 'SPIN'}
              </span>
              {isSpinning && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </Button>
          </motion.div>

          {/* Config buttons below SPIN */}
          <div className="flex flex-col gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push(`/admin/luckydraw/${luckydrawId}`)}
              className={cn(
                "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                "border border-white/20 dark:border-white/10",
                "hover:bg-white/20 dark:hover:bg-black/30",
                isDarkMode ? "text-white" : "text-gray-800"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Classic View
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push(`/admin/luckydraw/${luckydrawId}/cy2`)}
              className={cn(
                "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                "border border-white/20 dark:border-white/10",
                "hover:bg-white/20 dark:hover:bg-black/30",
                isDarkMode ? "text-white" : "text-gray-800"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Minimal View
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                    "border border-white/20 dark:border-white/10",
                    "hover:bg-white/20 dark:hover:bg-black/30",
                    isDarkMode ? "text-white" : "text-gray-800",
                    "relative"
                  )}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Winners
                  {winners.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-[#173066] to-[#509bff] text-white rounded-full text-xs font-semibold">
                      {winners.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Lucky Draw Winners</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
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

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "backdrop-blur-xl bg-white/10 dark:bg-black/20",
                "border border-white/20 dark:border-white/10",
                "hover:bg-white/20 dark:hover:bg-black/30",
                isDarkMode ? "text-white" : "text-gray-800"
              )}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDarkMode ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </motion.div>
            </Button>
          </div>
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
                className={cn(
                  "text-lg font-semibold uppercase tracking-[0.4em] mb-4 leading-tight",
                  isDarkMode ? "text-white/60" : "text-gray-600"
                )}
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
                <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#173066] via-[#0463ce] to-[#509bff] tracking-wide leading-none">
                  {currentWinner}
                </div>
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-[#509bff]/20 via-[#0463ce]/20 to-[#173066]/20 blur-2xl rounded-full"
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