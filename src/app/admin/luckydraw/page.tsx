"use client";
import EventCheckbox from "@/components/EventCheckbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Page() {
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
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
        <Button className="mt-4">Start</Button>
      </div>
    </div>
  );
}
