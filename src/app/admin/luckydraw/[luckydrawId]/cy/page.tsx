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
const ITEM_HEIGHT = 96; // Height of each name card
const SPIN_DURATION_MS = 7500; // Duration of spin animation in milliseconds (7.5 seconds default)

// Add shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

const formatDisplayName = (id: string | null | undefined): string => {
  try {
    if (!id) return "";
    const beforeAt = id.includes("@") ? id.split("@")[0] : id;
    const cleaned = beforeAt.replace(/[_\-.]+/g, " ").trim();
    if (!cleaned) return beforeAt;
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((word) =>
        word.length > 3
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toUpperCase()
      )
      .join(" ");
  } catch {
    return String(id ?? "");
  }
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

    // Cancel idle animation
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }
    setIsIdleAnimating(false);

    setIsSpinning(true);
    setShowWinner(false);
    setError("");

    // Reset and shuffle spinner items
    const newSpinnerItems = createExtendedList(participants, 200);
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
    if (spinSound.current) {
      spinSound.current.currentTime = 1;
      spinSound.current.play();
    }

    // Reset to start position
    setCenterIndex(0);
    setAnimationOffset(0);

    // Calculate total indices to spin through
    const totalItems = newSpinnerItems.length;
    const spins = 3 + Math.random() * 2; // 3-5 rotations
    const totalIndices = Math.floor(spins * totalItems) + winnerIndex;

    // Animate through indices - totalIndices already points to winnerIndex after spins
    animateSpinnerByIndex(0, totalIndices, SPIN_DURATION_MS, intendedWinner);
  };

  const animateSpinnerByIndex = (
    fromIndex: number,
    toIndex: number,
    duration: number,
    winner: string
  ) => {
    const startTime = Date.now();
    let soundFading = false;
    const totalIndices = toIndex - fromIndex;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing (easeOutCubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentProgress = fromIndex + (totalIndices * easeOut);

      // Update center index and animation offset for smooth visual
      const wholeIndex = Math.floor(currentProgress);
      const fractionalPart = currentProgress - wholeIndex;

      setCenterIndex(wholeIndex % spinnerItems.length);
      setAnimationOffset(fractionalPart * ITEM_HEIGHT);

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
        // Animation complete - we're at toIndex
        // toIndex was calculated as (spins * totalItems) + winnerIndex
        // So toIndex % totalItems should equal winnerIndex
        const finalPosition = toIndex % spinnerItems.length;
        setCenterIndex(finalPosition);
        setAnimationOffset(0); // Reset offset for perfect alignment
        
        // The item at finalPosition should be our intended winner
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

  // Simple idle animation - index based
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      setIsIdleAnimating(true);
      let accumulatedOffset = 0;
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
        accumulatedOffset += (30 * delta); // Slower idle speed in pixels

        // When we've moved more than one item height, jump to next index
        if (accumulatedOffset >= ITEM_HEIGHT) {
          setCenterIndex(prev => (prev + 1) % spinnerItems.length);
          accumulatedOffset = accumulatedOffset % ITEM_HEIGHT;
        }

        setAnimationOffset(accumulatedOffset);

        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      };

      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    } else {
      setIsIdleAnimating(false);
      if (!isSpinning) {
        setAnimationOffset(0); // Reset offset when not animating
      }
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

  // Calculate visible items based on center index
  const visibleRange = 20; // Number of items to render above and below center

  const renderedItems = useMemo(() => {
    if (spinnerItems.length === 0) return [];
    const items = [];
    const totalItems = spinnerItems.length;

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
                top: '50%',
                transform: `translateY(calc(-50% - ${animationOffset}px))`,
                willChange: 'transform',
                transition: 'none'
              }}
            >
              {renderedItems.map((item) => {
                // Calculate position based on offset from center
                const itemPosition = item.offset * ITEM_HEIGHT;
                const distanceFromCenter = Math.abs(item.offset);

                // Item at offset 0 is the center item
                const isCenter = item.offset === 0;
                const isNearCenter = distanceFromCenter <= 2;

                // Visual properties based on distance
                const scale = isCenter ? 1.08 : isNearCenter ? 1.02 : 1;  // Reduced scale
                const opacity = isCenter ? 1 : Math.max(0.3, 1 - (distanceFromCenter * 0.05));
                const blur = distanceFromCenter > 8 ? Math.min(1, (distanceFromCenter - 8) * 0.1) : 0;

                return (
                  <div
                    key={item.key}
                    className="absolute left-0 right-0 h-24 w-full flex items-center justify-center px-12"
                    style={{
                      top: `${itemPosition}px`,
                      opacity,
                      filter: blur > 0 ? `blur(${blur}px)` : 'none',
                      transform: `translateX(-50%) translateX(50%) scale(${scale})`,
                      transition: isIdleAnimating || isSpinning ? 'none' : 'all 0.4s ease-out',  // Slower transition
                      willChange: 'transform, opacity, filter'
                    }}
                  >
                    {/* Glassmorphic card container */}
                    <div
                      className={cn(
                        "relative px-10 py-4 rounded-2xl",
                        "transition-all duration-300"
                      )}
                      style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: isCenter
                          ? `2px solid ${BASE_COLORS[1]}`
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: isCenter
                          ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px ${BASE_COLORS[1]}30`
                          : '0 4px 16px 0 rgba(31, 38, 135, 0.1)'
                      }}
                    >
                      <span
                        className={cn(
                          "relative z-10 font-semibold transition-all duration-300 block text-center",
                          isCenter && "font-bold"
                        )}
                        style={{
                          color: isCenter ? '#000000' : '#6B7280',
                          fontSize: isCenter ? '2.25rem' : '1.5rem',
                          fontWeight: isCenter ? 800 : 500,
                          letterSpacing: isCenter ? '0.02em' : '0.01em',
                          textShadow: isCenter ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                          willChange: 'transform'
                        }}
                      >
                        {formatDisplayName(item.text)}
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

        {/* Previous Winner - Left Side Center */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40">
          <AnimatePresence mode="wait">
            {winners.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 rounded-xl backdrop-blur-md"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div className="text-xs uppercase tracking-widest mb-2 leading-tight font-medium text-gray-500">
                  Previous Winner
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatDisplayName(winners[winners.length - 1].workId)}
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

        {/* Winners Button - Bottom Left */}
        <div className="absolute left-8 bottom-8 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="backdrop-blur-md bg-white/80 border border-white/50 hover:bg-white/90 text-gray-700 shadow-lg relative"
                style={{
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
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
                        <span className="font-semibold tracking-wide leading-tight">{formatDisplayName(winner.workId)}</span>
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

        {/* SPIN Button - Minimal, Contemporary Design */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-40">
          <button
            onClick={handleSpin}
            disabled={isSpinning || participants.length === 0}
            className={cn(
              "relative group",
              "px-12 py-5",
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
                "font-medium text-sm tracking-wider uppercase",
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
                <div className="text-7xl font-bold tracking-tight leading-none" style={{ color: BASE_COLORS[0] }}>
                  {formatDisplayName(currentWinner)}
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