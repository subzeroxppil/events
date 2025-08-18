"use client";
import { useEffect, useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "next/navigation";
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

export default function Page() {
  const params = useParams();

  const encodedParam = Array.isArray(params?.eventIds)
    ? params.eventIds[0]
    : params.eventIds;

  const eventIds = JSON.parse(
    atob(decodeURIComponent(encodedParam || "[]"))
  ) as number[];

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [prizes, setPrizes] = useState<{ text: string }[]>([]);
  const [start, setStart] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [winners, setWinners] = useState<string[]>([]);
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

  const spinAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/spin3.mp3") : null;

  const celebrateAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/celebrate.wav") : null;

  const applauseAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/applause1.mp3") : null;

  useEffect(() => {
    if (!eventIds) return;

    fetchAttendees();

    setSpinSound(spinAudio);
    setCelebrateSound(celebrateAudio);
    setApplauseSound(applauseAudio);
  }, []);

  const fetchAttendees = async () => {
    try {
      // const res = await fetch(
      //   `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/users`
      // );

      // const data = await res.json();

      // if (!res.ok) {
      //   throw new Error(data.message || "Failed to fetch attendees");
      // }

      // const attendeeList = data.users.map((user: any) => ({
      //   text: user.workId, // ✅ use workId only
      // }));

      let allAttendees: { text: string }[] = [];
      console.log("eventIds", eventIds);
      // Loop through all event IDs
      for (const id of eventIds) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${id}/users`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch attendees");
        }

        const attendeeList = data.users.map((user: any) => ({
          text: user.workId,
        }));

        allAttendees = [...allAttendees, ...attendeeList];
      }

      setPrizes(allAttendees);

      // max 50
      const reproducedPrizeList = createRepeatedPrizeList(allAttendees, 120);

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
    winners: string[]
  ): number {
    const baseOffset = 100;
    const maxOffset = 10;
    let attempts = 0;

    while (attempts < 10) {
      const candidateIndex = baseOffset + Math.floor(Math.random() * maxOffset);
      const candidate = prizeList[candidateIndex];
      if (!winners.includes(candidate.text)) {
        return candidateIndex;
      }
      attempts++;
    }

    // fallback: allow repeat
    return baseOffset + Math.floor(Math.random() * maxOffset);
  }

  const handleStart = () => {
    const reproducedPrizeList = createRepeatedPrizeList(prizes, 120);

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

    setStart(false); // reset
    setTimeout(() => {
      setStart(true); // trigger spin
      setIsSpinning(true);
    }, 50); // small delay ensures React registers the change
  };

  const handlePrizeDefined = () => {
    const winner = prizeList[prizeIndex];
    const winnerWorkId = winner?.text;
    if (winnerWorkId) {
      setWinners((prev) => [...prev, winnerWorkId]);
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
    console.log("prizeList", prizeList);
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
    <div className="flex w-full justify-center h-full">
      {initialLoading ? (
        <LoadingSpinner className="mt-5" />
      ) : prizes.length === 0 ? (
        <>
          <div className="w-full py-30 flex flex-col items-center">
            <Lottie animationData={ghostAnimationData} className="h-[170px]" />
            <span className="text-muted-foreground text-sm">
              Roulette game unavailable as no attendees have checked in to this
              event yet
            </span>
          </div>
        </>
      ) : error ? (
        <div className="text-red-500 font-medium text-center mt-5">{error}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="p-10 pb-15  border-0 shadow-none w-screen h-screen">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center">
                <span className="text-[60px] font-bold">Lucky Draw 🎁</span>
              </div>
              <Card className="p-10 mt-2 flex flex-col items-center shadow-none border-0">
                <div className="flex flex-col gap-8 items-center">
                  {/* <Image
                    src="/paypal_logo.png"
                    width={100}
                    height={50}
                    alt="paypal icon"
                  /> */}
                  <RoulettePro
                    prizes={prizeList}
                    prizeIndex={prizeIndex}
                    start={start}
                    onPrizeDefined={handlePrizeDefined}
                    defaultDesignOptions={{ prizesWithText: true }}
                    spinningTime={9}
                  />

                  <Button
                    onClick={handleStart}
                    size={"lg"}
                    disabled={isSpinning}
                    variant={"outline"}
                  >
                    Start
                  </Button>
                  {winners.length > 0 && !isSpinning && (
                    <span className="font-bold text-6xl mt-1 p-4 rounded-md bg-emerald-100 text-green-800">
                      🎉 {winners[winners.length - 1]}
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
