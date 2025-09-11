"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, X, ChevronUp } from "lucide-react";
import { toast } from "sonner";

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

export default function LuckyDrawCY2() {
  const params = useParams();
  const router = useRouter();

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
  const [showWinners, setShowWinners] = useState(false);

  // Horizontal spinner states
  const [spinnerItems, setSpinnerItems] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      spinSound.current = new Audio("/sounds/spin4.mp3");
      celebrateSound.current = new Audio("/sounds/celebrate.wav");
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

      // Set initial position
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

    setIsSpinning(true);
    setShowWinner(false);
    setError("");

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

    // Start animation
    const itemWidth = 200; // Width per item
    const targetPos = validIndex * itemWidth;

    setCurrentPosition(0);

    // Animate the spinner
    animateSpinner(0, targetPos, 6000, () => {
      handleSpinComplete(newSpinnerItems[validIndex]);
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

      // Smoother easing function
      const easeOut = 1 - Math.pow(1 - progress, 4);
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

    // Play celebration sound
    if (celebrateSound.current) {
      celebrateSound.current.currentTime = 0;
      celebrateSound.current.play();
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

    // Ensure perfect center alignment for winner
    const winnerIndex = spinnerItems.findIndex(item => item === winner);
    if (winnerIndex !== -1) {
      setCurrentPosition(winnerIndex * 200);
    }

    // Trigger effects
    triggerConfetti();
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

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
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

  // Idle animation with smooth continuous motion
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0 && !showWinner) {
      let idlePosition = currentPosition;
      let lastTime = Date.now();

      const animateIdle = () => {
        const now = Date.now();
        const delta = (now - lastTime) / 1000; // Convert to seconds
        lastTime = now;

        idlePosition += 30 * delta; // 30 pixels per second
        if (idlePosition >= spinnerItems.length * 200) {
          idlePosition = idlePosition % (spinnerItems.length * 200);
        }
        setCurrentPosition(idlePosition);
        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      };

      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    }

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/luckydraw/${luckydrawId}/cy`)}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-sm font-light text-gray-600 tracking-wide uppercase">
          {luckyDraw?.name}
        </h1>

        <Button
          variant="ghost"
          onClick={() => setShowWinners(!showWinners)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Winners ({winners.length})
        </Button>
      </div>

      {/* Main Content - Centered Horizontal Spinner */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full relative">
          {/* Horizontal Spinner Container */}
          <div className="relative h-32 overflow-hidden w-full">
            <div
              className="absolute flex items-center h-full"
              style={{
                transform: `translateX(calc(50vw - ${currentPosition}px - 100px))`,
                willChange: 'transform',
                transition: isSpinning ? 'none' : 'transform 0.1s linear'
              }}
            >
              {spinnerItems.map((item, index) => {
                const itemPosition = index * 200;
                const distanceFromCenter = Math.abs(itemPosition - currentPosition);
                const isCenter = distanceFromCenter < 100;
                const isNear = distanceFromCenter < 300;

                return (
                  <div
                    key={`${item}-${index}`}
                    className="w-[200px] h-full flex items-center justify-center flex-shrink-0"
                  >
                    <span
                      className={`font-light tracking-wide transition-all duration-300 ${
                        isCenter 
                          ? 'text-gray-900 text-2xl' 
                          : isNear
                          ? 'text-gray-500 text-xl'
                          : 'text-gray-300 text-lg'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Center Indicator - Arrow pointing up */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
              <ChevronUp className="w-8 h-8 text-gray-900" strokeWidth={1} />
            </div>
          </div>

          {/* SPIN Button */}
          <div className="mt-16 flex justify-center">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              variant="outline"
              className="px-8 py-3 text-sm font-light tracking-widest uppercase border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-colors"
            >
              {isSpinning ? 'Spinning' : 'Spin'}
            </Button>
          </div>
        </div>
      </div>

      {/* Winners Panel */}
      <AnimatePresence>
        {showWinners && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l z-50"
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-light">Winners</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWinners(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto h-[calc(100vh-80px)]">
              {winners.length === 0 ? (
                <p className="text-center text-gray-500 font-light">No winners yet</p>
              ) : (
                winners.map((winner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-light">{winner.workId}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(winner.wonAt).toLocaleTimeString("en-SG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWinner(winner.workId)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Display */}
      <AnimatePresence>
        {showWinner && currentWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-40"
          >
            <motion.div
              className="absolute inset-0 bg-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
            >
              <div className="text-center">
                <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
                  Congratulations
                </div>
                <div className="text-6xl font-light text-gray-900 tracking-wide">
                  {currentWinner}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}