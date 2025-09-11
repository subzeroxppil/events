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

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  // Initialize audio and inject styles
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
      applauseSound.current = new Audio("/sounds/applause1.mp3");
    }

    // Inject shimmer animation
    let style: HTMLStyleElement | null = null;
    if (typeof document !== 'undefined') {
      style = document.createElement('style');
      style.textContent = shimmerKeyframes;
      document.head.appendChild(style);
    }

    return () => {
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
      const extendedList = createExtendedList(uniqueParticipants, 200);
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

    // Get current position from idle animation
    const itemHeight = 96;
    let startPos = idlePositionRef.current || currentPosition;

    // Cancel idle animation
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }

    setIsSpinning(true);
    setShowWinner(false);
    setError("");

    // Sync state position from idle animation for a seamless transition
    setCurrentPosition(startPos);

    // Reset and shuffle spinner items
    const newSpinnerItems = createExtendedList(participants, 200);
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
    }

    // Calculate precise final position for the winner to be centered
    const itemHeight2 = ITEM_HEIGHT; // 96px
    const N = newSpinnerItems.length;
    const baseHeight = N * itemHeight2;

    // Work with normalized offsets to avoid large jumps and keep within tripled track
    const startNormalized = baseHeight === 0
      ? 0
      : ((startPos % baseHeight) + baseHeight) % baseHeight;
    const targetNormalized = validIndex * itemHeight2;

    // Travel a modest number of loops for smoothness (about 0.8-1.2)
    const loops = 0.8 + Math.random() * 0.4;

    // Forward distance within a single base loop
    const distanceWithinBase = ((targetNormalized - startNormalized + baseHeight) % baseHeight);
    const totalDistance = loops * baseHeight + distanceWithinBase;
    const finalPosition = startPos + totalDistance;

    // Smooth single-phase animation with gentle deceleration
    animateSpinnerSmooth(startPos, finalPosition, 7500, newSpinnerItems[validIndex]);
  };

  const animateSpinnerSmooth = (
    from: number,
    to: number,
    duration: number,
    winner: string
  ) => {
    const startTime = Date.now();
    let soundFading = false;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Simpler, smoother easing (easeOutCubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPos = from + (to - from) * easeOut;
      setCurrentPosition(currentPos);

      // Fade out sound gradually near the end
      if (spinSound.current && progress > 0.8 && !soundFading) {
        soundFading = true;
        const fadeOutDurationMs = duration * 0.2; // last 20%
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
        setCurrentPosition(to);
        handleSpinComplete(winner);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
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

    // Stop spin sound if still playing (should already be faded out)
    if (spinSound.current) {
      spinSound.current.pause();
      spinSound.current.currentTime = 0;
      spinSound.current.volume = 1; // Reset volume for next spin
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

    // Position is already precise from animateSpinnerSmooth - no adjustment needed

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

  // Idle animation - continuous slow rotation
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      let idlePosition = currentPosition;
      let lastTime = Date.now();

      const animateIdle = () => {
        if (isSpinning || showWinner || spinnerItems.length === 0) {
          return;
        }

        const now = Date.now();
        const delta = (now - lastTime) / 1000; // seconds
        lastTime = now;

        // Smooth continuous motion similar to cy2
        idlePosition += 40 * delta; // pixels per second
        const track = spinnerItems.length * ITEM_HEIGHT;
        if (track > 0) {
          idlePosition = ((idlePosition % track) + track) % track;
        }

        idlePositionRef.current = idlePosition;
        setCurrentPosition(idlePosition);

        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      };

      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    }

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
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

  // Derived values for infinite scroll
  const ITEM_HEIGHT = 96;
  const BASE_HEIGHT = spinnerItems.length * ITEM_HEIGHT;
  const normalizedPosition = BASE_HEIGHT === 0
    ? 0
    : ((currentPosition % BASE_HEIGHT) + BASE_HEIGHT) % BASE_HEIGHT;
  const displayOffset = BASE_HEIGHT; // show middle copy

  // Tripled array for seamless infinite scrolling
  const renderedItems = useMemo(
    () => (spinnerItems.length ? [...spinnerItems, ...spinnerItems, ...spinnerItems] : []),
    [spinnerItems]
  );

  // Virtualization around center to avoid rendering all items every frame
  const TRIPLE_BASE_HEIGHT = BASE_HEIGHT * 3;
  const centerIndexTripled = spinnerItems.length + Math.floor(normalizedPosition / ITEM_HEIGHT);
  const VISIBLE_WINDOW = 30; // render ~61 items total for stability while spinning
  const visibleStartIndex = Math.max(0, centerIndexTripled - VISIBLE_WINDOW);
  const visibleEndIndex = Math.min(spinnerItems.length * 3 - 1, centerIndexTripled + VISIBLE_WINDOW);
  const visibleIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
      indices.push(i);
    }
    return indices;
  }, [visibleStartIndex, visibleEndIndex, spinnerItems.length]);

  // While spinning, render the full tripled list to prevent gaps at high speed
  const totalTripledLength = spinnerItems.length * 3;
  const indicesToRender = useMemo(() => {
    if (spinnerItems.length === 0) return [] as number[];
    if (isSpinning) {
      return Array.from({ length: totalTripledLength }, (_, i) => i);
    }
    return visibleIndices;
  }, [isSpinning, totalTripledLength, visibleIndices, spinnerItems.length]);

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
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
        <BackButton />
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-gray-900">
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
                transform: `translateY(calc(50vh - ${displayOffset + normalizedPosition}px - 48px))`,
                willChange: 'transform',
                transition: isSpinning ? 'none' : 'transform 0.05s linear',
                height: `${TRIPLE_BASE_HEIGHT}px`
              }}
            >
              {indicesToRender.map((i) => {
                const text = spinnerItems[i % spinnerItems.length];
                const containerShift = displayOffset + normalizedPosition;
                const itemTop = i * ITEM_HEIGHT;
                const distanceFromCenter = Math.abs(itemTop - containerShift);

                const isCenter = distanceFromCenter < ITEM_HEIGHT * 0.5;
                const isNearCenter = distanceFromCenter < ITEM_HEIGHT * 2;
                const isVisible = distanceFromCenter < ITEM_HEIGHT * 8;

                const opacity = isCenter ? 1 : isNearCenter ? 0.95 : isVisible ? 0.8 : 0.5;
                const scale = isCenter ? 1.12 : isNearCenter ? 1.05 : 1;
                const blur = distanceFromCenter > ITEM_HEIGHT * 6
                  ? Math.min(0.5, (distanceFromCenter - ITEM_HEIGHT * 6) * 0.001)
                  : 0;

                return (
                  <div
                    key={`row-${i}`}
                    className="absolute left-0 right-0 h-24 w-full flex items-center justify-center px-12"
                    style={{
                      top: `${itemTop}px`,
                      opacity,
                      transform: `scale(${scale})`,
                      filter: blur > 0 ? `blur(${blur}px)` : 'none',
                      transition: isSpinning ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'transform, opacity, filter'
                    }}
                  >
                    {/* Glassmorphic card container */}
                    <div
                      className={cn(
                        "relative px-10 py-4 rounded-2xl",
                        "transition-all duration-300",
                        isCenter && "animate-pulse"
                      )}
                      style={{
                        background: isCenter
                          ? 'rgba(255, 255, 255, 0.95)'
                          : isNearCenter
                            ? 'rgba(255, 255, 255, 0.8)'
                            : 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: isCenter
                          ? `2px solid ${BASE_COLORS[1]}`
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: isCenter
                          ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px ${BASE_COLORS[1]}30, inset 0 0 20px rgba(255, 255, 255, 0.5)`
                          : isNearCenter
                            ? '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.3)'
                            : '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
                        willChange: 'transform'
                      }}
                    >
                      {/* Inner glow effect for center item */}
                      {isCenter && (
                        <div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `radial-gradient(circle at center, ${BASE_COLORS[3]}20, transparent)`,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}
                        />
                      )}

                      <span
                        className={cn(
                          "relative z-10 font-semibold transition-all duration-300 block text-center",
                          isCenter && "font-bold"
                        )}
                        style={{
                          color: isCenter ? BASE_COLORS[0] : isNearCenter ? BASE_COLORS[2] : '#4B5563',
                          fontSize: isCenter ? '2.25rem' : isNearCenter ? '1.875rem' : '1.5rem',
                          fontWeight: isCenter ? 800 : isNearCenter ? 600 : 500,
                          letterSpacing: isCenter ? '0.02em' : '0.01em',
                          textShadow: isCenter
                            ? `0 2px 10px ${BASE_COLORS[1]}40`
                            : isNearCenter
                              ? '0 1px 3px rgba(0,0,0,0.1)'
                              : 'none',
                          willChange: 'transform'
                        }}
                      >
                        {text}
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

            {/* Center Indicator - enhanced accent line */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-30">
              <div className="relative">
                {/* Main line */}
                <div className="h-[3px] w-full" style={{
                  background: `linear-gradient(90deg, transparent 0%, ${BASE_COLORS[1]}60 20%, ${BASE_COLORS[1]}80 50%, ${BASE_COLORS[1]}60 80%, transparent 100%)`,
                  boxShadow: `0 0 20px ${BASE_COLORS[1]}30`
                }} />
                {/* Glow effect */}
                <div className="absolute inset-0 h-[1px] w-full top-[1px]" style={{
                  background: `linear-gradient(90deg, transparent 0%, ${BASE_COLORS[3]}40 20%, ${BASE_COLORS[3]}60 50%, ${BASE_COLORS[3]}40 80%, transparent 100%)`,
                  filter: 'blur(4px)'
                }} />
              </div>
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
                className="p-6 rounded-xl backdrop-blur-sm"
              >
                <div className="text-xs uppercase tracking-widest mb-2 leading-tight font-medium text-gray-500">
                  Previous Winner
                </div>
                <div className="text-xl font-bold" style={{ color: BASE_COLORS[0] }}>
                  {winners[winners.length - 1].workId}
                </div>
                <div className="text-xs mt-2 tracking-wide leading-relaxed text-gray-500">
                  {new Date(winners[winners.length - 1].wonAt).toLocaleTimeString("en-SG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls - Right Side with SPIN button and Winners sheet */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-40">
          {/* SPIN Button - Glassmorphic */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              className={cn(
                "group relative overflow-hidden",
                "px-12 py-6 text-xl font-semibold rounded-2xl",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-300",
                "hover:shadow-xl hover:scale-105",
                "active:scale-95"
              )}
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1.5px solid ${isSpinning ? BASE_COLORS[2] : 'rgba(255, 255, 255, 0.5)'}`,
                boxShadow: isSpinning
                  ? `0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 30px ${BASE_COLORS[2]}30`
                  : `0 8px 24px -4px rgba(0, 0, 0, 0.15), inset 0 0 12px rgba(255, 255, 255, 0.5)`,
              }}
            >
              {/* Text */}
              <span
                className="relative z-10 tracking-widest leading-none font-bold"
                style={{
                  color: isSpinning ? BASE_COLORS[2] : BASE_COLORS[0],
                  textShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  letterSpacing: '0.15em'
                }}
              >
                {isSpinning ? 'SPINNING' : 'SPIN'}
              </span>

              {/* Subtle pulse when spinning */}
              {isSpinning && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${BASE_COLORS[2]}10, transparent)`,
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </button>
          </motion.div>

          {/* Winners Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="backdrop-blur-sm bg-white/70 border border-gray-200 hover:bg-white/80 text-gray-700 shadow-md relative"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Winners
                {winners.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-white rounded-full text-xs font-semibold" style={{ backgroundColor: BASE_COLORS[2] }}>
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
                <div className="text-7xl font-bold tracking-tight leading-none" style={{ color: BASE_COLORS[0] }}>
                  {currentWinner}
                </div>
                <motion.div
                  className="absolute -inset-4 blur-3xl rounded-full"
                  style={{ backgroundColor: `${BASE_COLORS[1]}15` }}
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