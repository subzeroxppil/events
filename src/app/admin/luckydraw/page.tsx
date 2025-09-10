"use client";
import LuckydrawCard from "@/components/LuckydrawCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Lottie from "lottie-react";
import ghostAnimationData from "@/app/assets/ghost-animation.json";

type LuckyDraw = {
  id: number;
  name: string;
  createdAt: string;
  createdBy: string;
  eventIds: number[];
};

export default function Page() {
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const [luckyDraws, setLuckyDraws] = useState<LuckyDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLuckyDraws();
  }, []);

  const fetchLuckyDraws = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/luckydraw");
      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.message || "Failed to fetch lucky draws");
        return;
      }

      setLuckyDraws(result.luckyDraws);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch lucky draws");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10 ">
      <div className="max-w-sm flex flex-col">
        <span className="text-2xl font-bold ">Lucky Draw</span>
        <span className="text-md text-muted-foreground mb-2">
          View past lucky draws or create a new one!
        </span>
        {loading ? (
          <div className="w-full max-w-sm flex flex-col gap-3 mt-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="relative ring-[1px] ring-border rounded-lg px-4 py-3"
              >
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : luckyDraws.length === 0 ? (
          <div className="w-full py-30 flex flex-col items-center">
            <Lottie animationData={ghostAnimationData} className="h-[170px]" />
            <span className="text-muted-foreground text-sm">
              No Lucky Draws have been created yet.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {luckyDraws.map((luckyDraw) => (
              <LuckydrawCard
                key={luckyDraw.id}
                id={luckyDraw.id}
                name={luckyDraw.name}
                createdAt={new Date(luckyDraw.createdAt)}
                createdBy={luckyDraw.createdBy}
                eventCount={luckyDraw.eventIds.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
