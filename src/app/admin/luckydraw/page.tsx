"use client";
import EventCheckbox from "@/components/EventCheckbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const router = useRouter();

  const handleStart = () => {
    if (selectedEventIds.length === 0) return;
    const encoded = encodeURIComponent(btoa(JSON.stringify(selectedEventIds)));
    router.push(`/admin/luckydraw/${encoded}`);
  };

  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10 ">
      <div className="max-w-sm flex flex-col">
        <span className="text-2xl font-bold">
          Select your participants for Lucky Draw 🎁
        </span>
        <EventCheckbox
          selectedEventIds={selectedEventIds}
          onChange={setSelectedEventIds}
        />
        <Button
          className="mt-4"
          onClick={handleStart}
          disabled={selectedEventIds.length === 0}
        >
          Start
        </Button>
      </div>
    </div>
  );
}
