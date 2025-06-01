"use client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AdminSearch from "@/components/AdminSearch";
import { CalendarPlus } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import Link from "next/link";
import Lottie from "lottie-react";
import searchAnimationData from "../assets/search-cartoon-animation.json";

type Event = {
  id: number;
  title: string;
  country: string;
  location: string;
  attendees: number;
  eventStartTime: string; // from API, dates are strings
  createdAt: string;
  createdBy: string;
};

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCount, setEventCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
  }, [query]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/events?q=${encodeURIComponent(query.trim())}`
      );
      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.message || "Failed to fetch events");
        return;
      }

      setEvents(result.events);
      setEventCount(result.eventCount);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col p-8 bg-slate-100 items-center">
        <h1 className="text-center text-4xl font-bold sm:text-5xl">
          Admin Portal
        </h1>
        <p className="text-center text-lg text-muted-foreground sm:text-xl mt-3 mb-3 font-bold">
          Organise Events and Track Attendance
        </p>
        <AdminSearch query={query} setQuery={setQuery} />
      </div>
      <div className="w-full flex flex-col px-8 py-8 items-center max-w-7xl self-center">
        <div className="flex items-center justify-between p-4 text-xs sm:text-sm md:text-base w-full">
          <span className="text-muted-foreground text-center text-l">
            {eventCount} {eventCount === 1 ? "result" : "results"}
          </span>
          <Link href="/admin/event/create">
            <Button>
              <CalendarPlus />
              Create Event
            </Button>
          </Link>
        </div>
        <div className="w-full flex flex-col gap-2">
          {loading ? (
            <LoadingSpinner className="my-10 self-center" />
          ) : errorMessage ? (
            <p className="text-red-500 text-sm text-center">{errorMessage}</p>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center">
              <Lottie
                animationData={searchAnimationData}
                className="h-[150px]"
              />
              <span className="text mt-2">No events found</span>
              <span className="text-muted-foreground mt-1 text-sm">
                Try using general keywords or check your spelling
              </span>
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                country={event.country}
                location={event.location}
                attendees={event.attendees}
                eventStartTime={new Date(event.eventStartTime)}
                createdAt={new Date(event.createdAt)}
                createdBy={event.createdBy}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
