"use client";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
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
  }, []);

  const fetchEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch(`/api/admin/events`);
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
  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      router.push("/admin/login");
      if (error) {
        setErrorMessage(error.message || "Failed to sign out");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred during sign out.");
    }
  }

  const handleSearch = (q: string) => {
    console.log("Searching for:", q);
    // Your search logic here
  };
  return (
    <>
      <div className="w-full flex flex-col p-8 bg-slate-100 items-center">
        <h1 className="text-center text-4xl font-bold sm:text-5xl">
          Impact Day Admin Portal
        </h1>
        <p className="text-center text-lg text-muted-foreground sm:text-xl mt-3 mb-3">
          Organise Events and Track Attendance
        </p>
        <AdminSearch
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
        />
      </div>
      <div className="w-full flex flex-col px-8 py-8 items-center">
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
            <p className="text-muted-foreground text-sm text-center">
              No events found.
            </p>
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
