"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CircleCheck, CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Skeleton } from "./ui/skeleton";

type Event = {
  id: number;
  title: string;
  attendees: number;
  eventStartTime: string; // from API
};

function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

type Props = {
  selectedEventIds: number[];
  onChange: (ids: number[]) => void;
};

const EventCheckbox = ({ selectedEventIds, onChange }: Props) => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/events");
      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.message || "Failed to fetch events");
        return;
      }

      const formatted = result.events.map((e: any) => ({
        id: e.id,
        title: e.title,
        attendees: e.attendees,
        eventStartTime: e.eventStartTime,
      }));

      setEvents(formatted);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number, checked: boolean) => {
    if (checked) {
      onChange([...selectedEventIds, id]);
    } else {
      onChange(selectedEventIds.filter((eid) => eid !== id));
    }
  };

  if (errorMessage)
    return <p className="text-red-500 text-sm text-center">{errorMessage}</p>;
  if (loading) {
    return (
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
    );
  }
  if (events.length === 0)
    return (
      <p className="text-muted-foreground text-sm text-center">
        No events found
      </p>
    );

  return (
    <div className="w-full max-w-sm flex flex-col gap-3 mt-5">
      {events.map((ev) => {
        const isChecked = selectedEventIds.includes(ev.id);

        return (
          <CheckboxPrimitive.Root
            key={ev.id}
            checked={isChecked}
            onCheckedChange={(checked) =>
              toggleSelection(ev.id, Boolean(checked))
            }
            className={cn(
              "relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground",
              isChecked ? "ring-2 ring-primary" : "hover:ring-primary"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium tracking-tight text-foreground line-clamp-1">
                  {ev.title}
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm">
                  <CalendarDays className="size-4 shrink-0" />
                  <span>{formatDateTime(ev.eventStartTime)}</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm">
                  <Users className="size-4 shrink-0" />
                  <span>
                    {ev.attendees} attendee{ev.attendees === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <CheckboxPrimitive.Indicator className="absolute top-2 right-2">
                <CircleCheck className="fill-primary text-primary-foreground" />
              </CheckboxPrimitive.Indicator>
            </div>
          </CheckboxPrimitive.Root>
        );
      })}
    </div>
  );
};

export default EventCheckbox;
