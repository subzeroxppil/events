"use client";
import EventCheckbox from "@/components/EventCheckbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { CircleAlert } from "lucide-react";

export default function Page() {
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (selectedEventIds.length === 0 || !name.trim()) return;

    try {
      setLoading(true);

      const response = await fetch("/api/admin/luckydraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          eventIds: selectedEventIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.success("Event admin added");
        return;
      }

      // Show success toast
      toast.success("Lucky draw created!");

      // Redirect to the created lucky draw page
      // router.push(`/admin/luckydraw/${result.luckyDraw.id}`);
      router.push(`/admin/luckydraw/`);
    } catch (err) {
      console.error("Error creating lucky draw:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center p-6 md:p-10 ">
      <Card className="flex flex-col max-w-lg w-full p-6 gap-0">
        <span className="text-3xl font-bold mb-3">Create Lucky Draw</span>
        <div className="mb-3">
          <Label htmlFor="name" className="text-base font-medium">
            Lucky Draw Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter lucky draw name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2"
            disabled={loading}
          />
        </div>
        <Label className="text-base font-medium block">
          Select Participants
        </Label>
        <span className="text-md text-muted-foreground mb-2">
          You can select participants from multiple events
        </span>
        <EventCheckbox
          selectedEventIds={selectedEventIds}
          onChange={setSelectedEventIds}
        />
        {error && (
          <div className="flex items-center gap-1">
            <div>
              <CircleAlert size="20px" color="#ef4444" />
            </div>
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}
        <Button
          className="mt-3 w-full self-center"
          onClick={handleCreate}
          disabled={selectedEventIds.length === 0 || !name.trim() || loading}
        >
          {loading ? <LoadingSpinner /> : "Create"}
        </Button>
      </Card>
    </div>
  );
}
