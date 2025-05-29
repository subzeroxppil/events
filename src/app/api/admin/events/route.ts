// File: app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        attendances: true,
      },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.name,
      country: event.country,
      location: event.location,
      attendees: event.attendances.length,
      eventStartTime: event.eventStartTime,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
    }));

    return NextResponse.json(
      { events: formattedEvents, eventCount: events.length },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
