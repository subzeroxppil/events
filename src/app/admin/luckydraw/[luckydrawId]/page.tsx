"use client";
import { useEffect, useState, useRef } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import RoulettePro from "react-roulette-pro";
import "react-roulette-pro/dist/index.css";
import "@/app/globals.css";
import confetti from "canvas-confetti";
import ghostAnimationData from "@/app/assets/ghost-animation.json";
import Lottie from "lottie-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { Trash2, Sparkles } from "lucide-react";

type LuckyDraw = {
  id: number;
  name: string;
  eventIds: number[];
  createdAt: string;
  createdBy: string;
};

export default function Page() {
  const params = useParams();
  const router = useRouter();

  const luckydrawId = Array.isArray(params?.luckydrawId)
    ? params.luckydrawId[0]
    : params?.luckydrawId;

  const [initialLoading, setInitialLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState("");
  const [prizes, setPrizes] = useState<{ text: string }[]>([]);
  const [start, setStart] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [winners, setWinners] = useState<{ workId: string; wonAt: string }[]>(
    []
  );
  const [prizeList, setPrizeList] = useState<
    { text: string; id: string; image: string }[]
  >([]);
  const [spinSound, setSpinSound] = useState<HTMLAudioElement | null>(null);
  const [celebrateSound, setCelebrateSound] = useState<HTMLAudioElement | null>(
    null
  );
  const [applauseSound, setApplauseSound] = useState<HTMLAudioElement | null>(
    null
  );
  const [luckyDraw, setLuckyDraw] = useState<LuckyDraw | null>(null);

  // Add near other refs at top inside component:
  const idleAnimationRestartRef = useRef<number | null>(null);

  // (Optional) Cleanup on unmount: add in a useEffect:
  useEffect(() => {
    return () => {
      if (idleAnimationRestartRef.current) {
        clearTimeout(idleAnimationRestartRef.current);
      }
    };
  }, []);

  const previousUlStyleRef = useRef<string | null>(null);

  const isSpinningRef = useRef(isSpinning);
  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

  const spinAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/spin4.mp3") : null;

  const celebrateAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/celebrate.wav") : null;

  const applauseAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/applause1.mp3") : null;

  const lengthOfNames = 180;
  const baseOffset = 160;

  useEffect(() => {
    if (!luckydrawId) return;

    fetchLuckyDrawData();

    setSpinSound(spinAudio);
    setCelebrateSound(celebrateAudio);
    setApplauseSound(applauseAudio);
  }, []);

  const fetchLuckyDrawData = async () => {
    try {
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch attendees");
      }

      setLuckyDraw(data.luckyDraw);

      let allAttendees = data.participants.map((workId: any) => ({
        text: workId,
      }));

      // make unique
      allAttendees = Array.from(
        new Map(allAttendees.map((a: { text: any }) => [a.text, a])).values()
      );

      setPrizes(allAttendees);

      // Set existing winners from API response
      if (data.winners && Array.isArray(data.winners)) {
        console.log("data.winners", data.winners);
        setWinners(data.winners);
      }

      // max 50
      const reproducedPrizeList = createRepeatedPrizeList(
        allAttendees,
        lengthOfNames
      );

      console.log("reset prize list");
      setPrizeList(
        reproducedPrizeList.map((prize) => ({
          ...prize,
          image: null,
          id:
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : generateId(),
        }))
      );
    } catch (err: any) {
      setError("Failed to load attendees.");
    } finally {
      setInitialLoading(false);
    }
  };

  function createRepeatedPrizeList(prizes: any[], targetLength: number): any[] {
    if (prizes.length === 0) return [];

    const shuffled = [...prizes].sort(() => 0.5 - Math.random());

    if (shuffled.length === targetLength) {
      return shuffled;
    }

    if (shuffled.length < targetLength) {
      const repeated = [];
      while (repeated.length < targetLength) {
        repeated.push(...shuffled.sort(() => 0.5 - Math.random()));
      }
      return repeated.slice(0, targetLength);
    }

    // shuffled.length > targetLength
    return shuffled.slice(0, targetLength);
  }

  const generateId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

  // INIT STUFF

  function getValidPrizeIndex(
    prizeList: { text: string }[],
    winners: { workId: string; wonAt: string }[]
  ): number {
    const maxOffset = 10;
    let attempts = 0;

    while (attempts < 10) {
      const candidateIndex = baseOffset + Math.floor(Math.random() * maxOffset);
      const candidate = prizeList[candidateIndex];
      if (!winners.some((winner) => winner.workId === candidate.text)) {
        return candidateIndex;
      }
      attempts++;
    }

    // fallback: allow repeat
    return baseOffset + Math.floor(Math.random() * maxOffset);
  }

  const handleStart = () => {
    const reproducedPrizeList = createRepeatedPrizeList(prizes, lengthOfNames);

    const newPrizeList = reproducedPrizeList.map((prize) => ({
      ...prize,
      image: null,
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : generateId(),
    }));
    const prizeIndex = getValidPrizeIndex(newPrizeList, winners);

    setPrizeList(newPrizeList);
    setPrizeIndex(prizeIndex);

    if (spinSound) {
      spinSound.pause(); // Just in case it's already playing
      spinSound.currentTime = 1;

      // Add event listener to stop at 12 seconds
      const handleTimeUpdate = () => {
        if (spinSound.currentTime >= 10.5) {
          spinSound.pause();
          spinSound.removeEventListener("timeupdate", handleTimeUpdate);
        }
      };

      spinSound.addEventListener("timeupdate", handleTimeUpdate);
      spinSound.play();
    }

    if (celebrateSound) {
      celebrateSound.pause();
      celebrateSound.currentTime = 0;
    }

    if (applauseSound) {
      applauseSound.pause();
      applauseSound.currentTime = 0;
    }

    // In handleStart (before setStart(false)) clear any pending restart:
    if (idleAnimationRestartRef.current) {
      clearTimeout(idleAnimationRestartRef.current);
      idleAnimationRestartRef.current = null;
    }

    setStart(false); // reset
    setTimeout(() => {
      setStart(true); // trigger spin
      setIsSpinning(true);
      setHasStarted(true); // Mark that user has started at least once
    }, 50); // small delay ensures React registers the change
  };

  const handlePrizeDefined = async () => {
    const winner = prizeList[prizeIndex];
    const winnerWorkId = winner?.text;

    if (winnerWorkId) {
      try {
        // Send POST request to record the winner
        const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workId: winnerWorkId }),
        });

        if (response.ok) {
          // Only update UI if the API call was successful
          setWinners((prev) => [
            ...prev,
            { workId: winnerWorkId, wonAt: new Date().toISOString() },
          ]);
        } else {
          const errorData = await response.json();
          console.error("Error recording winner:", errorData.message);
        }
      } catch (error) {
        console.error("Error recording winner:", error);
      }
    }

    if (spinSound) {
      spinSound.pause();
      spinSound.currentTime = 0;
    }

    if (celebrateSound) {
      celebrateSound.pause();
      celebrateSound.currentTime = 0; // restart from beginning
      celebrateSound.play().catch((e) => {
        console.warn("Playback failed:", e);
      });
    }

    if (applauseSound) {
      applauseSound.pause();
      applauseSound.currentTime = 0; // restart from beginning
      applauseSound.play().catch((e) => {
        console.warn("Playback failed:", e);
      });
    }

    // triggerConfetti();
    triggerFireworks();
    setIsSpinning(false);

    setTimeout(() => {
      if (isSpinningRef.current) return;

      const roulettePrizeList = document.querySelector(
        ".roulette-pro-prize-list"
      ) as HTMLElement | null;
      if (roulettePrizeList) {
        roulettePrizeList.classList.add("with-animation");

        // Schedule restart after 60s (adjust as needed)
        if (idleAnimationRestartRef.current) {
          clearTimeout(idleAnimationRestartRef.current);
        }
        idleAnimationRestartRef.current = window.setTimeout(() => {
          if (!roulettePrizeList.isConnected) return;
          roulettePrizeList.classList.remove("with-animation");
          roulettePrizeList.style.transform = "translate3d(0px,0px,0px)";
          roulettePrizeList.style.removeProperty("transition");
          roulettePrizeList.style.left = "0px";
          void roulettePrizeList.offsetWidth;
          roulettePrizeList.classList.add("with-animation");
        }, 60000); // 1 minute
      }
      // });
    }, 5000);
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

  const handleDeleteWinner = async (winnerWorkId: string) => {
    try {
      const response = await fetch(`/api/admin/luckydraw/${luckydrawId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workId: winnerWorkId }),
      });

      if (response.ok) {
        // Remove winner from UI
        setWinners((prev) =>
          prev.filter((winner) => winner.workId !== winnerWorkId)
        );
        toast.success("Winner removed successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to remove winner");
      }
    } catch (error) {
      console.error("Error removing winner:", error);
      toast.error("Failed to remove winner");
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
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

  return (
    <div className="flex w-full justify-center h-full max-w-[2000px] self-center">
      {initialLoading ? (
        <LoadingSpinner className="mt-5" />
      ) : prizes.length === 0 ? (
        <>
          <div className="w-full py-30 flex flex-col items-center">
            <Lottie animationData={ghostAnimationData} className="h-[170px]" />
            <span className="text-muted-foreground text-sm">
              Lucky Draw unavailable as no attendees have checked in to this
              event yet
            </span>
          </div>
        </>
      ) : error ? (
        <div className="text-red-500 font-medium text-center mt-5">{error}</div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex w-full justify-between p-4">
            <BackButton />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/luckydraw/${luckydrawId}/cy`)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try New Design
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    View Winners
                    {winners.length > 0 && (
                      <span className="px-2 py-1 bg-[#60cdff] rounded-full text-xs">
                        {winners.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Lucky Draw Winners</SheetTitle>
                    {/* <SheetDescription>
                      List of all winners from this lucky draw session
                    </SheetDescription> */}
                  </SheetHeader>
                  <div className="mt-6">
                    {winners.length === 0 ? (
                      <div className="w-full py-30 flex flex-col items-center">
                        <Lottie
                          animationData={ghostAnimationData}
                          className="h-[170px]"
                        />
                        <span className="text-muted-foreground text-sm text-center">
                          No winners yet! Start the lucky draw to see winners.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                          Total winners:{" "}
                          <span className="text-black font-semibold">
                            {winners.length}
                          </span>
                        </p>
                        {winners.map((winner, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-auto px-2 py-1 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {new Date(winner.wonAt).toLocaleTimeString(
                                  "en-SG",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                              <span className="font-medium">
                                {winner.workId}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWinner(winner.workId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={"outline"}>Delete </Button>
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
                      className="w-full sm:w-[75px]"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <LoadingSpinner /> : "Delete"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <Card className="px-15 pb-15  border-0 shadow-none w-screen max-w-[1500px] overflow-hidden self-center">
            <div className="flex flex-col items-center text-center mt-10">
              <div className="flex items-center">
                <span className="text-[60px] font-bold">Lucky Draw 🎁</span>
              </div>
              <div className="w-auto px-2 py-1 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                {prizes.length} participant{prizes.length === 1 ? "" : "s"}
              </div>
              <Card className="p-10 mt-2 flex flex-col items-center shadow-none border-0">
                <div className="flex flex-col gap-8 items-center">
                  <RoulettePro
                    prizes={prizeList}
                    prizeIndex={prizeIndex}
                    start={start}
                    onPrizeDefined={handlePrizeDefined}
                    defaultDesignOptions={{ prizesWithText: true }}
                    spinningTime={13} //prev was 9
                  />

                  <Button
                    onClick={handleStart}
                    size={"lg"}
                    disabled={isSpinning}
                    variant={"outline"}
                  >
                    Start
                  </Button>
                  {winners.length > 0 && !isSpinning && hasStarted && (
                    <span className="font-bold text-6xl mt-1 p-4 rounded-md text-[#008cff]">
                      🎉 {winners[winners.length - 1]?.workId}
                    </span>
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
