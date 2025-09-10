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
      <div className="flex flex-col max-w-2xl w-full">
        <span className="text-3xl font-bold">Select participants 💁🏼‍♀️</span>
        <span className="text-md text-muted-foreground mb-2">
          You can select multiple events, then click "create" below when ready!
        </span>
        <EventCheckbox
          selectedEventIds={selectedEventIds}
          onChange={setSelectedEventIds}
        />
        <Button
          className="mt-3 w-sm self-center"
          onClick={handleStart}
          disabled={selectedEventIds.length === 0}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
