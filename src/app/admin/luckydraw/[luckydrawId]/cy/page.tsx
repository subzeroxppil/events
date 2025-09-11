"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import GradualBlur from "@/components/GradualBlur";
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
    
    // Start animation
    setCurrentPosition(0);
    setTargetPosition(validIndex * 80); // 80px per item
    
    // Animate the spinner
    animateSpinner(0, validIndex * 80, 8000, () => {
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
    
    // Trigger effects
    triggerFireworks();
    setShowWinner(true);
    setIsSpinning(false);
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const themeStyles = {
    gradient: isDarkMode
      ? "from-slate-900 via-purple-900 to-slate-900"
      : "from-blue-50 via-purple-50 to-pink-50",
    card: isDarkMode
      ? "bg-black/20 border-white/10"
      : "bg-white/10 border-white/20",
    text: isDarkMode ? "text-white" : "text-gray-900",
    mutedText: isDarkMode ? "text-gray-400" : "text-gray-600",
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
      {/* Gradual Blur Effects */}
      <GradualBlur position="top" height="8rem" strength={3} opacity={0.6} />
      <GradualBlur position="bottom" height="8rem" strength={3} opacity={0.6} />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <BackButton />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/luckydraw/${luckydrawId}`)}
            className={`backdrop-blur-md ${themeStyles.card} ${themeStyles.text}`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Classic View
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className={`backdrop-blur-md ${themeStyles.card} ${themeStyles.text}`}
              >
                Winners
                {winners.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-500 text-white rounded-full text-xs">
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
            variant="outline"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`backdrop-blur-md ${themeStyles.card} ${themeStyles.text}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="flex gap-8 items-center">
          {/* Spinner Container */}
          <div 
            className={`relative w-[400px] h-[400px] rounded-3xl backdrop-blur-xl ${themeStyles.card} border p-8 overflow-hidden`}
          >
            {/* Center Indicator with Gradient */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 pointer-events-none z-10">
              <div className="h-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] bg-purple-500/50" />
            </div>
            
            {/* Vertical Spinner */}
            <div className="relative h-full flex items-center justify-center">
              <div 
                ref={spinnerRef}
                className="absolute w-full transition-transform"
                style={{
                  transform: `translateY(${-currentPosition}px)`,
                  transition: isSpinning ? 'none' : 'transform 0.3s ease-out'
                }}
              >
                {spinnerItems.map((item, index) => {
                  const distanceFromCenter = Math.abs(index - currentPosition / 80);
                  const opacity = Math.max(0.2, 1 - distanceFromCenter * 0.3);
                  const scale = Math.max(0.8, 1 - distanceFromCenter * 0.1);
                  const isCenter = distanceFromCenter < 0.5;
                  
                  return (
                    <div
                      key={`${item}-${index}`}
                      className={`h-20 flex items-center justify-center px-4 transition-all duration-300 ${themeStyles.text}`}
                      style={{
                        opacity,
                        transform: `scale(${scale})`,
                        fontSize: isCenter ? '1.5rem' : '1.2rem',
                        fontWeight: isCenter ? 'bold' : 'normal',
                        color: isCenter 
                          ? 'rgb(168, 85, 247)' 
                          : undefined
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Spin Button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleSpin}
              disabled={isSpinning || participants.length === 0}
              size="lg"
              className="backdrop-blur-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform transition-all hover:scale-105"
            >
              SPIN
            </Button>
            
            <div className={`text-sm ${themeStyles.mutedText}`}>
              {participants.length} participants
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
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ filter: "blur(20px)", opacity: 0, scale: 0.8 }}
              animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`text-6xl font-bold ${themeStyles.text} text-center`}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Winner!
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-8xl mt-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                {currentWinner}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}