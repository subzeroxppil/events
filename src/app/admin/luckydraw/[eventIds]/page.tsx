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

  const lengthOfNames = 180;
  const baseOffset = 160;

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

      // make unique
      allAttendees = Array.from(
        new Map(allAttendees.map((a) => [a.text, a])).values()
      );

      setPrizes(allAttendees);

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
    winners: string[]
  ): number {
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
    // if (spinSound) {
    //   spinSound.pause(); // Just in case it's already playing
    //   spinSound.currentTime = 0.5;
    //   spinSound.play();
    // }

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
    setTimeout(() => {
      // Capture existing roulette prize list DOM styles & classes
      // Capture the ONLY ul child inside .roulette-pro-wrapper
      const wrapper = document.querySelector(
        ".roulette-pro-wrapper"
      ) as HTMLElement | null;
      const prevEl = wrapper
        ? (wrapper.querySelector("ul") as HTMLElement | null)
        : null;
      const savedClassList = prevEl ? Array.from(prevEl.classList) : [];
      const savedStyleAttr = prevEl ? prevEl.getAttribute("style") : null;

      console.log("savedClassList", savedClassList);
      console.log("savedStyleAttr", savedStyleAttr);

      // const wrapper = document.querySelector(
      //   ".roulette-pro-wrapper"
      // ) as HTMLElement | null;
      // const prevEl = wrapper
      //   ? (wrapper.querySelector("ul") as HTMLElement | null)
      //   : null;
      // const savedClassList = prevEl ? Array.from(prevEl.classList) : [];
      // const savedStyleAttr = prevEl ? prevEl.getAttribute("style") : null;

      // console.log("savedClassList", savedClassList);
      // console.log("savedStyleAttr", savedStyleAttr);

      // // Capture geometry & proportional position BEFORE changing list
      // const prevWrapperWidth = wrapper?.clientWidth || 0;
      // const prevUlWidth = prevEl?.scrollWidth || 0;
      // const computedLeft = prevEl
      //   ? parseFloat(window.getComputedStyle(prevEl).left || "0")
      //   : 0;
      // const positionRatio =
      //   prevUlWidth > prevWrapperWidth
      //     ? computedLeft / (prevUlWidth - prevWrapperWidth)
      //     : 0;

      // Extend prizeList by appending first 100 names again (with new ids)
      setPrizeList((prev) => {
        const count = Math.min(100, prev.length);
        const duplicated = prev.slice(0, count).map((p) => ({
          ...p,
          id:
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : generateId(),
        }));
        return [...prev, ...duplicated];
      });

      // // After React commits the new prizeList, restore styles & classes
      // requestAnimationFrame(() => {
      //   const wrapperEl = document.querySelector(
      //     ".roulette-pro-wrapper"
      //   ) as HTMLElement | null;
      //   if (!wrapperEl) return;

      //   const ulList = wrapperEl.querySelectorAll("ul");
      //   if (ulList.length !== 1) return;
      //   const newUl = ulList[0] as HTMLElement;

      //   // Completely replace class list
      //   if (savedClassList.length) {
      //     console.log("after re render savedClassList", savedClassList);
      //     newUl.className = savedClassList.join(" ");
      //   } else {
      //     newUl.removeAttribute("class");
      //   }

      //   // Completely replace inline styles
      //   if (savedStyleAttr) {
      //     console.log("after re render savedStyleAttr", savedStyleAttr);
      //     newUl.setAttribute("style", savedStyleAttr);
      //   } else {
      //     newUl.removeAttribute("style");
      //   }

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
        // Optional: fire twice if timing sensitive
        setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
        // After resize(s), strip any transition the library injects
        const removeTransitionOnce = () => {
          const wrapperEl = document.querySelector(".roulette-pro-wrapper");
          if (!wrapperEl) return;
          const ul = wrapperEl.querySelector("ul") as HTMLElement | null;
          if (!ul) return;

          // Remove inline transition property if present
          if (ul.style.transition) {
            ul.style.removeProperty("transition");
          }

          // Also clean transition from the style attribute text if still there
          const styleAttr = ul.getAttribute("style");
          if (styleAttr && /transition\s*:/.test(styleAttr)) {
            const cleaned = styleAttr
              .replace(/transition:[^;]+;?/gi, "")
              .trim();
            if (cleaned) ul.setAttribute("style", cleaned);
            else ul.removeAttribute("style");
          }
        };

        // Try several frames (library may set it slightly later)
        let tries = 0;
        const rafStrip = () => {
          removeTransitionOnce();
          if (tries++ < 12) requestAnimationFrame(rafStrip);
        };
        requestAnimationFrame(rafStrip);
      });

      const roulettePrizeList = document.querySelector(
        ".roulette-pro-prize-list"
      );
      if (roulettePrizeList) {
        // Remove all inline styles
        roulettePrizeList.removeAttribute("style");

        // Add the specific styles
        const element = roulettePrizeList as HTMLElement;
        element.style.left = "0px";
        element.style.willChange = "left";

        // Add the animation class
        roulettePrizeList.classList.add("with-animation");
      }
    }, 5000);

    // requestAnimationFrame(() => {
    //   const wrapperEl = document.querySelector(
    //     ".roulette-pro-wrapper"
    //   ) as HTMLElement | null;
    //   if (!wrapperEl) return;

    //   const ulList = wrapperEl.querySelectorAll("ul");
    //   if (ulList.length !== 1) return;
    //   const newUl = ulList[0] as HTMLElement;

    //   // Replace class list exactly
    //   if (savedClassList.length) {
    //     newUl.className = savedClassList.join(" ");
    //   } else {
    //     newUl.removeAttribute("class");
    //   }

    //   // Start from a clean style (do not reapply old width-dependent left directly)
    //   if (savedStyleAttr) {
    //     // Extract transition (so we can momentarily disable while repositioning)
    //     const transitionMatch = savedStyleAttr.match(/transition:[^;]+;/i);
    //     const transitionValue = transitionMatch
    //       ? transitionMatch[0]
    //           .replace("transition:", "")
    //           .replace(";", "")
    //           .trim()
    //       : "";
    //     // Set initial style without transition to avoid a jump animation
    //     newUl.style.transition = "none";

    //     // Compute proportional new left
    //     const newUlWidth = newUl.scrollWidth;
    //     const newWrapperWidth = wrapperEl.clientWidth;
    //     const newLeft =
    //       newUlWidth > newWrapperWidth
    //         ? positionRatio * (newUlWidth - newWrapperWidth)
    //         : 0;

    //     // Apply restored style baseline (except left & transition we control)
    //     // Clear then reapply left + transition
    //     // We rebuild from savedStyleAttr but override left & transition
    //     const leftRegex = /left:\s*[-\d.]+px;?/i;
    //     const cleaned = savedStyleAttr
    //       .replace(leftRegex, "")
    //       .replace(/transition:[^;]+;?/i, "");
    //     newUl.setAttribute("style", cleaned.trim());
    //     newUl.style.left = `${newLeft}px`;
    //     if (transitionValue) {
    //       // Force reflow then restore transition
    //       void newUl.offsetWidth;
    //       newUl.style.transition = transitionValue;
    //     } else {
    //       newUl.style.removeProperty("transition");
    //     }
    //   } else {
    //     newUl.removeAttribute("style");
    //   }
    // });

    setIsSpinning(false);
    console.log("prizeList", prizeList);

    // make slow animation begin after 3 seconds
    // setTimeout(() => {
    //   const roulettePrizeList = document.querySelector(
    //     ".roulette-pro-prize-list"
    //   );
    //   if (roulettePrizeList) {
    //     // Remove all inline styles
    //     roulettePrizeList.removeAttribute("style");

    //     // Add the specific styles
    //     const element = roulettePrizeList as HTMLElement;
    //     element.style.left = "0px";
    //     element.style.willChange = "left";

    //     // Add the animation class
    //     roulettePrizeList.classList.add("with-animation");
    //   }
    // }, 5000);
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
          <Card className="p-10 pb-15  border-0 shadow-none w-screen max-w-[1500px] overflow-hidden">
            <div className="flex flex-col items-center text-center mt-20">
              <div className="flex items-center">
                <span className="text-[60px] font-bold">Lucky Draw 🎁</span>
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
                  {winners.length > 0 && !isSpinning && (
                    <span className="font-bold text-6xl mt-1 p-4 rounded-md text-[#008cff]">
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
