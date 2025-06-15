"use client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AdminSearch from "@/components/AdminSearch";
import { CalendarPlus } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import Link from "next/link";
import Lottie from "lottie-react";
import searchAnimationData from "../assets/search-cartoon-animation.json";
import { useUser } from "../UserContext";
import { TypeAnimation } from "react-type-animation";

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
  const { fetchUser, user } = useUser();

  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
    checkUser();
  }, [query]);

  const checkUser = async () => {
    const fetchedUser = await fetchUser();
    if (!fetchedUser) {
      router.push("/admin/login");
    }
  };

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
          Events Portal
        </h1>
        {/* <p className="text-center text-lg text-muted-foreground sm:text-xl mt-3 mb-3 font-bold">
          Organise Events and Track Attendance
        </p> */}
        <div className="mt-3 mb-5 ">
          <TypeAnimation
            className="text-center text-lg sm:text-xl text-muted-foreground font-bold"
            speed={60}
            sequence={[
              "Organise Events",
              1500,
              "Host Spin-&-Win Games",
              1500,
              "Run Lucky Draws",
              1500,
              "Monitor Attendance Live",
              1500,
              "Auto-Assign Groups in Real-Time",
              1500,
              "Generate Check-In QR Codes",
              1500,
            ]}
            repeat={Infinity}
          />
        </div>
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
