"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// Dynamically import the Wheel component with SSR disabled
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);

const colors = [
  { backgroundColor: "green", textColor: "white" },
  { backgroundColor: "red", textColor: "white" },
  { backgroundColor: "blue", textColor: "white" },
  { backgroundColor: "orange", textColor: "black" },
  { backgroundColor: "purple", textColor: "white" },
  { backgroundColor: "yellow", textColor: "black" },
  { backgroundColor: "pink", textColor: "black" },
  { backgroundColor: "teal", textColor: "white" },
];

type WheelItem = {
  option: string;
};

export default function Home() {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [resultPrizeBrand, setResultPrizeBrand] = useState("");
  const [resultPrizeName, setResultPrizeName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wheelData, setWheelData] = useState<WheelItem[]>([]); // brands to display on the wheel
  const [spinComplete, setSpinComplete] = useState(false);
  const [resultPrizeImgSrc, setResultPrizeImgSrc] = useState("");
  let workId = useRef<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    setIsClient(true);
    setError("");
    fetchWorkId();
    fetchBrandsForWheel();
  }, []);

  const fetchWorkId = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/session`
      );
      const data = await res.json();

      if (res.ok && data.workId) {
        workId.current = data.workId;
        fetchSpinCompletionStatus();
      } else {
      }
    } catch (err) {
      console.error("Failed to fetch workId:", err);
    }
  };

  const fetchSpinCompletionStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/spinstatus?workId=${workId.current}`
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
        setError(result.message || "Failed to fetch spin status");
      }
    } catch (err) {
      console.error("Error fetching spin status:", err);
      setError("An error occurred, please try again");
    }
  };

  const fetchBrandsForWheel = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/brands`
      );

      const result = await res.json();

      if (res.ok) {
        const brands = result.map((item: { brand: any }, index: any) => ({
          option: item.brand,
        }));
        setWheelData(brands);
      } else {
        setError(result.message || "Failed to fetch brands data");
      }
    } catch (err) {
      console.error("Error fetching brands data:", err);
      setError("An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleSpinClick = async () => {
    if (mustSpin || !workId.current) return;

    setError("");

    try {
      setMustSpin(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/spin`,
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
        (item) => item.option === result.prize.brand
      );
      if (index === -1) {
        setError("Prize brand not found on the wheel.");
        return;
      }
      setPrizeNumber(index);
    } catch (err) {
      console.error("Spin error:", err);
      setError("Spin failed. Please try again.");
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setSpinComplete(true);
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

  const handleSignOut = async () => {
    await fetch("/api/luckydraw/logout", { method: "POST" });
    router.push("/luckydraw/login");
  };

  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
      <div className="flex flex-col gap-4">
        <Card className="mx-auto p-6">
          <Button
            className="cursor-pointer w-[80px]"
            variant="outline"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
          <div className="flex flex-col items-center text-center">
            <Image
              src="/paypal_logo.png"
              width={60}
              height={60}
              alt="paypal icon"
            />

            <p className="mb-2 text-2xl font-bold">Lucky Draw</p>
            <p className="text-muted-foreground">
              Thank you for attending our event!
            </p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center self-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <p className="text-center text-red-600 dark:text-red-200">
              {error}
            </p>
          ) : isClient ? (
            <>
              <div className="w-auto">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  backgroundColors={["#173066", "#0463ce", "#63cbfb"]}
                  textColors={["#ffffff"]}
                  onStopSpinning={handleStopSpinning}
                  outerBorderColor="#f5f5f5"
                  radiusLineColor="#f5f5f5"
                  fontFamily="Arial"
                  fontSize={16}
                />
              </div>

              <div className="flex flex-col items-center gap-4 mt-4">
                <Button
                  className="cursor-pointer"
                  onClick={handleSpinClick}
                  disabled={mustSpin || spinComplete}
                  size={"lg"}
                >
                  SPIN
                </Button>

                {spinComplete && (
                  <>
                    <p className="text-lg font-semibold">
                      {`You won: ${resultPrizeName} (${resultPrizeBrand})! 🥳`}
                    </p>
                    <div>
                      <Image
                        src={`/sample/${resultPrizeImgSrc}`}
                        alt="prize picture"
                        width={150}
                        height={150}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <></>
          )}
        </Card>
      </div>
    </div>
  );
}
