"use client";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "next/navigation";
import luckydrawAnimation from "@/app/assets/luckydraw-animation.json";
import { QrDisplayCard } from "@/components/QrDisplayCard";
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
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params.eventId;

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [prizes, setPrizes] = useState<{ text: string }[]>([]);
  const [start, setStart] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [winners, setWinners] = useState<string[]>([]);
  const [prizeList, setPrizeList] = useState<{ text: string; id: string }[]>(
    []
  );

  useEffect(() => {
    if (!eventId) return;

    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/users`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch attendees");
      }

      const attendeeList = data.users.map((user: any) => ({
        text: user.workId, // ✅ use workId only
      }));

      setPrizes(attendeeList);

      // max 50
      const reproducedPrizeList = createRepeatedPrizeList(attendeeList, 50);

      setPrizeList(
        reproducedPrizeList.map((prize) => ({
          ...prize,
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
    const baseOffset = 35;
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
    const winPrizeIndex = Math.floor(Math.random() * 10);
    const baseOffset = 35;
    const prizeIndex = getValidPrizeIndex(prizeList, winners);
    setPrizeIndex(prizeIndex);

    setStart(false); // reset
    setTimeout(() => {
      setStart(true); // trigger spin
    }, 50); // small delay ensures React registers the change
  };

  const handlePrizeDefined = () => {
    const winner = prizeList[prizeIndex];
    const winnerWorkId = winner?.text;
    if (winnerWorkId) {
      setWinners((prev) => [...prev, winnerWorkId]);
    }
    triggerConfetti();
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

  return (
    <div className="flex w-full justify-center p-4 h-full">
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
          <Card className="p-10 pb-15 bg-[#f8f8f8] border-0 shadow-none">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center">
                <span className="text-[60px] font-bold">Lucky Draw</span>
              </div>
              <Card className="p-10 mt-2 flex flex-col items-center bg-white w-7xl overflow-hidden">
                <div className="flex flex-col gap-8 items-center">
                  <Image
                    src="/paypal_logo.png"
                    width={80}
                    height={80}
                    alt="paypal icon"
                  />
                  {/* <span className="font-bold text-2xl max-w-md break-words whitespace-normal mt-1">
                    {prizeList}
                  </span> */}
                  <RoulettePro
                    prizes={prizeList}
                    prizeIndex={prizeIndex}
                    start={start}
                    onPrizeDefined={handlePrizeDefined}
                    defaultDesignOptions={{ prizesWithText: true }}
                    spinningTime={5}
                  />

                  <Button onClick={handleStart} size={"lg"}>
                    Start
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
