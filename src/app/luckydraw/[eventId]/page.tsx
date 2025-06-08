"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Gift } from "lucide-react";
import Lottie from "lottie-react";
import luckydrawAnimation from "@/app/assets/luckydraw-animation.json";

// Dynamically import the Wheel component with SSR disabled
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);

type WheelItem = {
  option: string;
};

export default function Home() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [resultPrizeBrand, setResultPrizeBrand] = useState("");
  const [resultPrizeName, setResultPrizeName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [wheelData, setWheelData] = useState<WheelItem[]>([]);
  const [spinComplete, setSpinComplete] = useState(false);
  const [resultPrizeImgSrc, setResultPrizeImgSrc] = useState("");
  const [isSpinClicked, setIsSpinClicked] = useState(false);
  const [startingIndex, setStartingIndex] = useState<number | undefined>(
    undefined
  );
  const [spinClickLoading, setSpinClickLoading] = useState(false);
  const [wheelColors, setWheelColors] = useState<string[]>([]);

  let workId = useRef<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params.eventId;

  useEffect(() => {
    setError("");
    const fetchAll = async () => {
      await fetchWorkId();
      await fetchItemsForWheel();
      setIsClient(true);
      setInitialLoading(false);
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (spinComplete && resultPrizeName && wheelData.length > 0) {
      const index = wheelData.findIndex(
        (item) => item.option === resultPrizeName
      );
      if (index !== -1) {
        setStartingIndex(index);
      }
    }
  }, [spinComplete, resultPrizeName, wheelData]);

  const fetchWorkId = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/session`
      );
      const data = await res.json();

      if (res.ok && data.workId) {
        workId.current = data.workId;
        fetchSpinCompletionStatus();
      } else {
        router.push(`/luckydraw/${eventId}/login`);
        return Promise.reject("Redirected to login");
      }
    } catch (err) {
      console.error("Failed to fetch workId:", err);
    }
  };

  const fetchSpinCompletionStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/spinstatus/?workId=${workId.current}`
      );
      const result = await res.json();

      if (res.ok) {
        setSpinComplete(result.hasSpun);
        if (result.hasSpun) {
          setResultPrizeBrand(result.brand);
          setResultPrizeName(result.name);
          setResultPrizeImgSrc(result.imageUrl);
        }
      } else {
        setError("An error occurred, please try again");
      }
    } catch (err) {
      setError("An error occurred, please try again");
    }
  };

  const BASE_COLORS = ["#173066", "#509bff", "#0463ce", "#63cbfb"];
  const fetchItemsForWheel = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/prizes`
      );

      const result = await res.json();

      if (res.ok) {
        const prizes = result.map((item: { prize: any }, index: any) => ({
          option: item.prize,
        }));

        setWheelData(prizes);
        // Use first 3 colors if odd, all 4 if even
        const colorsToUse =
          prizes.length % 2 === 0 ? BASE_COLORS.slice(0, 3) : BASE_COLORS;

        setWheelColors(colorsToUse);
        console.log("colorsToUse", colorsToUse);
      } else {
        setError("An error occurred, please try again");
      }
    } catch (err) {
      setError("An error occurred, please try again");
    }
  };
  const spinSound =
    typeof Audio !== "undefined" ? new Audio("/sounds/spin3.mp3") : null;

  const handleSpinClick = async () => {
    if (mustSpin || !workId.current || isSpinClicked) return;
    setIsSpinClicked(true);
    setSpinClickLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/spin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: workId.current }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Something went wrong, please try again");
        return;
      }

      // Set brand and prize name separately
      setResultPrizeBrand(result.prize.brand);
      setResultPrizeName(result.prize.name);
      setResultPrizeImgSrc(result.prize.imageUrl);

      // Spin the wheel to that brand
      const index = wheelData.findIndex(
        (item) => item.option === result.prize.name
      );
      if (index === -1) {
        setError("Prize not found on the wheel.");
        return;
      }
      spinSound?.play();
      setSpinClickLoading(false);
      setPrizeNumber(index);
      setMustSpin(true);
    } catch (err) {
      console.error("Spin error:", err);
      setError("Spin failed. Please try again.");
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setSpinComplete(true);
    triggerConfetti();
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
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

  const handleSignOut = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/logout`,
      {
        method: "POST",
      }
    );
    router.push(`/luckydraw/${eventId}/login`);
  };

  return (
    <div className="flex w-full justify-center px-6 pt-2 pb-10 md:p-10 md:w-2xl self-center">
      {/* <div className="flex flex-col gap-4"> */}
      {initialLoading ? (
        <div className="flex flex-col items-center self-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-center text-red-600 dark:text-red-200">{error}</p>
      ) : isClient ? (
        <Card className="px-3 pb-6 pt-3 w-full gap-0">
          <Button
            className="cursor-pointer w-[80px]"
            variant="outline"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
          <div className="flex flex-col items-center text-center w-full">
            {/* <Gift size={60} /> */}
            <Lottie
              animationData={luckydrawAnimation}
              className="h-[140px] mt-[-30px] mb-[-20px]"
            />
            <p className="text-2xl font-bold">Spin & Win</p>
            <p className="text-muted-foreground">
              Spin the wheel to win a gift from one of our merchants!
            </p>
          </div>
          <div className="w-full flex justify-center mt-2">
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              backgroundColors={wheelColors}
              textColors={["#ffffff"]}
              onStopSpinning={handleStopSpinning}
              outerBorderColor="#ebebee"
              radiusLineColor="#ebebee"
              fontFamily="Arial"
              fontSize={14}
              startingOptionIndex={startingIndex}
            />
          </div>

          <div className="flex flex-col items-center w-full">
            <Button
              onClick={handleSpinClick}
              disabled={mustSpin || spinComplete || isSpinClicked}
              size={"lg"}
              className="w-[70px]"
            >
              {spinClickLoading ? <LoadingSpinner /> : "SPIN"}
            </Button>

            {spinComplete && (
              <>
                <div className="flex flex-col items-center text-center p-2 mt-2 gap-2">
                  {/* TODO: revert */}
                  {/* <p className="text-lg font-semibold">
                    {`🎉 You won: ${resultPrizeName} - ${resultPrizeBrand}!`}
                  </p> */}
                  <p className="text-lg font-semibold">
                    {`🎉 Pop by ${resultPrizeName.replace(
                      /'s$/,
                      ""
                    )}'s booth to collect your ${resultPrizeBrand}!`}
                  </p>
                  <div>
                    <Image
                      src={resultPrizeImgSrc}
                      alt="prize picture"
                      width={150}
                      height={150}
                      className="object-contain"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        <></>
      )}
      {/* </div> */}
    </div>
  );
}
