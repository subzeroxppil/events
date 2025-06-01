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

export default function Page() {
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params.eventId;
  const [isClient, setIsClient] = useState(false);

  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   if (!eventId) return;

  //   const fetchEvent = async () => {
  //     try {
  //       const res = await fetch(
  //         `${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}`
  //       );
  //       const data = await res.json();

  //       if (!res.ok) {
  //         throw new Error(data.message || "Failed to fetch event data");
  //       }

  //       if (!data.hasLuckyDraw) {
  //         setError("Lucky Draw not enabled for this event.");
  //       }

  //       setEventTitle(data.name);
  //     } catch (err: any) {
  //       setError("Unexpected error occurred, please refresh this page.");
  //     } finally {
  //       setInitialLoading(false);
  //     }
  //   };

  //   fetchEvent();
  // }, [eventId]);

  return (
    <div className="flex w-full justify-center p-4 h-full">
      {initialLoading ? (
        <LoadingSpinner className="mt-5" />
      ) : error ? (
        <div className="text-red-500 font-medium text-center mt-5">{error}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="p-10 pb-15 bg-[#f8f8f8] border-0 shadow-none">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center">
                <span className="text-[60px] font-bold">Impact Day</span>
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

                  {/* <Button onClick={handleStart} size={"lg"}>
                    Start
                  </Button> */}
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
