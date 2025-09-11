"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, X } from "lucide-react";
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

  // Vertical spinner states
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
    const itemHeight = 80; // Adjusted for minimal design
    const targetPos = validIndex * itemHeight;

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
      setCurrentPosition(winnerIndex * 80);
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

        idlePosition += 20 * delta; // 20 pixels per second (slower for minimal design)
        if (idlePosition >= spinnerItems.length * 80) {
          idlePosition = idlePosition % (spinnerItems.length * 80);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header */}
      <div className="p-6 flex justify-between items-center border-b bg-white">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/luckydraw/${luckydrawId}/cy`)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CY View
        </Button>
        
        <h1 className="text-xl font-medium text-gray-900">
          {luckyDraw?.name}
        </h1>

        <Button
          variant="outline"
          onClick={() => setShowWinners(!showWinners)}
          className="gap-2"
        >
          <Trophy className="w-4 h-4" />
          Winners ({winners.length})
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {/* Spinner Container */}
          <div className="relative h-[400px] overflow-hidden bg-white rounded-lg border">
            <div
              className="absolute w-full"
              style={{
                transform: `translateY(calc(200px - ${currentPosition}px))`,
                willChange: 'transform'
              }}
            >
              {spinnerItems.map((item, index) => {
                const itemPosition = index * 80;
                const distanceFromCenter = Math.abs(itemPosition - currentPosition) / 80;
                const isCenter = distanceFromCenter < 0.5;
                const opacity = isCenter ? 1 : Math.max(0.2, 1 - distanceFromCenter * 0.15);

                return (
                  <div
                    key={`${item}-${index}`}
                    className="h-20 flex items-center justify-center px-4"
                    style={{
                      opacity,
                      transition: isSpinning ? 'none' : 'opacity 0.3s ease-out'
                    }}
                  >
                    <span
                      className={`font-mono transition-all duration-300 ${
                        isCenter 
                          ? 'text-3xl font-semibold text-gray-900' 
                          : 'text-xl text-gray-500'
                      }`}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Center Indicator Line */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-px bg-blue-500" />
            </div>
          </div>

          {/* SPIN Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              size="lg"
              className="px-12 py-6 text-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSpinning ? 'SPINNING...' : 'SPIN'}
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
              <h2 className="text-lg font-semibold">Winners</h2>
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
                <p className="text-center text-gray-500">No winners yet</p>
              ) : (
                winners.map((winner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{winner.workId}</div>
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
                      className="text-red-500 hover:text-red-700"
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
            className="fixed inset-0 flex items-center justify-center z-40 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-12 shadow-2xl"
            >
              <div className="text-center">
                <div className="text-sm uppercase tracking-widest text-gray-500 mb-4">
                  Winner
                </div>
                <div className="text-5xl font-bold text-gray-900">
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