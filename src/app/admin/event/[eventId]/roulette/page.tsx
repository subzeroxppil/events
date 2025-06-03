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

  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");
  const [prizes, setPrizes] = useState<{ text: string }[]>([]);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchAttendees = async () => {
      try {
        setInitialLoading(true);

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
      } catch (err: any) {
        console.error(err);
        setError("Failed to load attendees.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  function createRepeatedPrizeList(prizes: any[], targetLength: number): any[] {
    if (prizes.length === 0) return [];

    const repeated = [];
    while (repeated.length < targetLength) {
      repeated.push(...prizes);
    }

    return repeated.slice(0, targetLength); // trim to exact length
  }

  // i think here max 50
  const reproducedPrizeList = createRepeatedPrizeList(prizes, 50);

  const generateId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

  const prizeList = reproducedPrizeList.map((prize) => ({
    ...prize,
    id:
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : generateId(),
  }));

  // const prizeIndex = prizes.length * 4 + winPrizeIndex;

  // const prizeIndex = 44;
  // const prizeIndex = Math.floor(Math.random() * prizeList.length);
  const winPrizeIndex = Math.floor(Math.random() * prizes.length);

  // Then calculate a final prizeIndex that ensures a long enough spin
  const baseOffset = 40; // ensures at least 40 items before landing
  const prizeIndex = baseOffset + winPrizeIndex;
  // console.log("prizeIndex", prizeIndex);

  const handleStart = () => {
    setStart(false); // reset
    setTimeout(() => {
      setStart(true); // trigger spin
    }, 50); // small delay ensures React registers the change
  };

  const handlePrizeDefined = () => {
    console.log("🥳 Prize defined! 🥳");
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
                    hi
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
