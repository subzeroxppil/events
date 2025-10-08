"use client";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useParams } from "next/navigation";
import luckydrawAnimation from "@/app/assets/luckydraw-animation.json";
import { QrDisplayCard } from "@/components/QrDisplayCard";

export default function Page() {
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params.eventId;

  const [eventTitle, setEventTitle] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const qrLink = `${process.env.NEXT_PUBLIC_BASE_URL}/luckydraw/${eventId}`;

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch event data");
        }

        if (!data.hasLuckyDraw) {
          setError("Lucky Draw not enabled for this event.");
        }

        setEventTitle(data.name);
      } catch (err: any) {
        setError("Unexpected error occurred, please refresh this page.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return (
    <div className="flex w-full justify-center p-4 h-full">
      {initialLoading ? (
        <LoadingSpinner className="mt-5" />
      ) : error ? (
        <div className="text-red-500 font-medium text-center mt-5">{error}</div>
      ) : (
        <QrDisplayCard
          title={eventTitle}
          qrLink={qrLink}
          headingText="🎁 Scan to enter the Lucky Draw!"
          animationData={luckydrawAnimation}
          animationClassName="h-[140px] mr-[-20px] mt-[-15px]"
        />
      )}
    </div>
  );
}
