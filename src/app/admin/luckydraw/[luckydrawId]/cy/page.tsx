"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import GradualBlur from "@/components/GradualBlur";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, LayoutGrid } from "lucide-react";
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

export default function LuckyDrawCY() {
  const params = useParams();
  const router = useRouter();

  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  // Theme state
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
  const [targetPosition, setTargetPosition] = useState(0);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);

  // Audio refs
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const celebrateSound = useRef<HTMLAudioElement | null>(null);
  const applauseSound = useRef<HTMLAudioElement | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("luckydraw-theme");
    setIsDarkMode(savedTheme === "dark");
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem("luckydraw-theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
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

    // Start animation - calculate position to center the winner
    // We want the winner to be in the exact center of the viewport
    const itemHeight = 96; // h-24 = 96px
    const targetPos = validIndex * itemHeight;

    setCurrentPosition(0);
    setTargetPosition(targetPos);

    // Animate the spinner
    animateSpinner(0, targetPos, 8000, () => {
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

      // Easing function for deceleration
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

    // Ensure perfect center alignment for winner
    const winnerIndex = spinnerItems.findIndex(item => item === winner);
    if (winnerIndex !== -1) {
      setCurrentPosition(winnerIndex * 96);
    }

    // Trigger effects
    triggerFireworks();
    setShowWinner(true);
    setIsSpinning(false);

    // Auto-hide winner after 3 seconds and resume idle animation
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

  // Idle animation with magnetic snap
  useEffect(() => {
    if (!isSpinning && spinnerItems.length > 0) {
      if (showWinner) {
        // Magnetic snap to exact center when winner is shown
        const winnerIndex = spinnerItems.findIndex(item => item === currentWinner);
        if (winnerIndex !== -1) {
          const targetPos = winnerIndex * 96;
          // Smooth snap to center
          const currentPos = currentPosition;
          const diff = targetPos - currentPos;
          if (Math.abs(diff) > 1) {
            const animateSnap = () => {
              setCurrentPosition(prev => {
                const step = diff * 0.1; // Smooth easing
                const newPos = prev + step;
                if (Math.abs(targetPos - newPos) < 1) {
                  return targetPos;
                }
                requestAnimationFrame(animateSnap);
                return newPos;
              });
            };
            animateSnap();
          }
        }
      } else {
        // Continuous idle spinning
        let idlePosition = currentPosition;

        const animateIdle = () => {
          idlePosition += 0.3; // Slow continuous movement
          if (idlePosition >= spinnerItems.length * 96) {
            idlePosition = 0;
          }
          setCurrentPosition(idlePosition);
          idleAnimationRef.current = requestAnimationFrame(animateIdle);
        };

        idleAnimationRef.current = requestAnimationFrame(animateIdle);
      }
    }

    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, [isSpinning, spinnerItems.length, showWinner, currentWinner]);

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

  const themeStyles = {
    gradient: isDarkMode
      ? "from-slate-950 via-indigo-950 to-slate-950"
      : "from-slate-50 via-indigo-50 to-blue-50",
    card: isDarkMode
      ? "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl"
      : "bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl",
    text: isDarkMode ? "text-white" : "text-slate-900",
    mutedText: isDarkMode ? "text-slate-400" : "text-slate-600",
    primaryColor: isDarkMode ? "#818cf8" : "#6366f1",
    secondaryColor: isDarkMode ? "#a5b4fc" : "#8b5cf6",
    accentColor: isDarkMode ? "#c7d2fe" : "#a78bfa",
  };

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
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles.gradient} relative overflow-hidden`}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-indigo-800/20' : 'bg-indigo-400/20'} blur-3xl animate-pulse`} />
        <div className={`absolute top-1/2 -right-40 w-96 h-96 rounded-full ${isDarkMode ? 'bg-purple-800/20' : 'bg-purple-400/20'} blur-3xl animate-pulse animation-delay-2000`} />
        <div className={`absolute -bottom-40 left-1/3 w-80 h-80 rounded-full ${isDarkMode ? 'bg-blue-800/20' : 'bg-blue-400/20'} blur-3xl animate-pulse animation-delay-4000`} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <BackButton />
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/luckydraw/${luckydrawId}`)}
            className={`${themeStyles.card} ${themeStyles.text} hover:bg-white/10 transition-all duration-300`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Classic View
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className={`${themeStyles.card} ${themeStyles.text} hover:bg-white/10 transition-all duration-300 relative`}
              >
                Winners
                {winners.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs font-semibold">
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
                        <span className="text-xs">
                          {new Date(winner.wonAt).toLocaleTimeString("en-SG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="font-medium">{winner.workId}</span>
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
            className={`${themeStyles.card} ${themeStyles.text} hover:bg-white/10 transition-all duration-300`}
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

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-8 py-20">
        <div className="flex gap-8 items-center h-[75vh] w-full max-w-7xl">

          {/* Last Winner Display - Left Side */}
          <div className="flex-shrink-0 w-72">
            <AnimatePresence mode="wait">
              {winners.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{ type: "spring", damping: 20 }}
                  className={`h-40 rounded-2xl ${themeStyles.card} p-6 flex flex-col justify-center`}
                >
                  <div className={`text-xs uppercase tracking-widest ${themeStyles.mutedText} mb-3 font-medium`}>
                    Previous Winner
                  </div>
                  <motion.div
                    key={winners[winners.length - 1].workId}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`text-2xl font-semibold bg-gradient-to-r ${isDarkMode ? 'from-indigo-400 to-purple-400' : 'from-indigo-600 to-purple-600'} bg-clip-text text-transparent`}
                  >
                    {winners[winners.length - 1].workId}
                  </motion.div>
                  <div className={`text-xs ${themeStyles.mutedText} mt-2 font-light`}>
                    {new Date(winners[winners.length - 1].wonAt).toLocaleTimeString("en-SG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spinner Container - Center */}
          <div className={`flex-1 relative rounded-3xl ${themeStyles.card} overflow-hidden max-w-2xl mx-auto`}>
            {/* GradualBlur for melting effect */}
            <GradualBlur 
              position="top" 
              height="12rem" 
              strength={4} 
              divCount={10}
              opacity={1}
              exponential={true}
              style={{ zIndex: 30 }}
            />
            <GradualBlur 
              position="bottom" 
              height="12rem" 
              strength={4} 
              divCount={10}
              opacity={1}
              exponential={true}
              style={{ zIndex: 30 }}
            />

            {/* Center Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-full h-20 relative">
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-indigo-500/20' : 'via-indigo-400/30'} to-transparent`}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-1 h-12 ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-full`} />
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-1 h-12 ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-full`} />
              </div>
            </div>

            {/* Vertical Spinner - Full Height */}
            <div className="relative h-full flex items-center justify-center px-12">
              <div
                ref={spinnerRef}
                className="absolute w-full"
                style={{
                  transform: `translateY(calc(50% - ${currentPosition}px - 48px))`, // Center alignment
                  transition: isSpinning ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {spinnerItems.map((item, index) => {
                  const itemPosition = index * 96;
                  const distanceFromCenter = Math.abs(itemPosition - currentPosition) / 96;
                  const isCenter = distanceFromCenter < 0.3;
                  const isNearCenter = distanceFromCenter < 1;
                  const opacity = isCenter ? 1 : isNearCenter ? 0.8 : Math.max(0.15, 1 - distanceFromCenter * 0.15);
                  const scale = isCenter ? 1 : Math.max(0.85, 1 - distanceFromCenter * 0.03);
                  const blur = distanceFromCenter > 4 ? 2 : distanceFromCenter > 2 ? 0.5 : 0;

                  return (
                    <motion.div
                      key={`${item}-${index}`}
                      className={`h-24 flex items-center justify-center px-8`}
                      initial={false}
                      animate={{
                        opacity,
                        scale,
                        filter: `blur(${blur}px)`,
                      }}
                      transition={{
                        duration: isSpinning ? 0.1 : 0.5,
                        ease: "easeOut",
                      }}
                      style={{
                        fontSize: isCenter ? '2.25rem' : isNearCenter ? '1.75rem' : '1.25rem',
                        fontWeight: isCenter ? '700' : isNearCenter ? '500' : '400',
                      }}
                    >
                      <span
                        className={`transition-all duration-300 font-semibold ${isCenter
                            ? `bg-gradient-to-r ${isDarkMode ? 'from-indigo-300 via-purple-300 to-pink-300' : 'from-indigo-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent`
                            : isNearCenter
                              ? isDarkMode ? 'text-white' : 'text-slate-800'
                              : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        style={{
                          textShadow: isCenter
                            ? isDarkMode
                              ? '0 0 40px rgba(129, 140, 248, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
                              : '0 0 30px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
                            : isNearCenter
                            ? isDarkMode
                              ? '0 2px 8px rgba(0, 0, 0, 0.5)'
                              : '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : 'none',
                          letterSpacing: isCenter ? '0.02em' : '0'
                        }}
                      >
                        {item}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Spin Button */}
          <div className="flex-shrink-0 w-72 flex flex-col justify-center items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSpin}
                disabled={isSpinning || participants.length === 0}
                size="lg"
                className={`group relative overflow-hidden bg-gradient-to-br ${isDarkMode ? 'from-indigo-500 to-purple-600' : 'from-indigo-600 to-purple-700'} hover:from-indigo-600 hover:to-purple-700 text-white px-20 py-10 text-2xl font-semibold rounded-2xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <motion.span
                  className="relative z-10 tracking-wider"
                  animate={isSpinning ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
                >
                  {isSpinning ? 'SPINNING' : 'SPIN'}
                </motion.span>
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
            </motion.div>

            <div className={`text-center ${themeStyles.card} rounded-2xl px-8 py-4`}>
              <motion.div
                className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {participants.length}
              </motion.div>
              <div className={`text-xs uppercase tracking-widest ${themeStyles.mutedText} mt-1`}>participants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Display with Framer Motion */}
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
              className="absolute inset-0 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 300
              }}
              className="text-center relative"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-lg font-medium uppercase tracking-[0.4em] ${themeStyles.mutedText} mb-4`}
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
                <div className={`text-7xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-indigo-400 via-purple-400 to-pink-400' : 'from-indigo-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent`}>
                  {currentWinner}
                </div>
                <motion.div
                  className={`absolute -inset-4 bg-gradient-to-r ${isDarkMode ? 'from-indigo-500/20 via-purple-500/20 to-pink-500/20' : 'from-indigo-500/10 via-purple-500/10 to-pink-500/10'} blur-2xl rounded-full`}
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
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className={`mt-6 h-0.5 bg-gradient-to-r from-transparent ${isDarkMode ? 'via-indigo-400' : 'via-indigo-600'} to-transparent`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}