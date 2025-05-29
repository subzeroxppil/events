import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      id,
      eventTitle,
      groupCount = 0,
      eventStartTime,
      eventEndTime,
      country,
      location,
      hasLuckyDraw = false,
    } = await req.json();

    // Get the authenticated user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const createdBy = user.email;

    // Validate required fields
    if (
      !eventTitle ||
      !eventStartTime ||
      !eventEndTime ||
      !country ||
      !location
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    let event;
    if (id) {
      // Update existing event
      event = await prisma.event.update({
        where: { id },
        data: {
          name: eventTitle,
          groupCount,
          eventStartTime: new Date(eventStartTime),
          eventEndTime: new Date(eventEndTime),
          country,
          location,
          hasLuckyDraw,
        },
      });
    } else {
      // Create new event
      event = await prisma.event.create({
        data: {
          name: eventTitle,
          groupCount,
          eventStartTime: new Date(eventStartTime),
          eventEndTime: new Date(eventEndTime),
          country,
          location,
          hasLuckyDraw,
          createdBy,
        },
      });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (err) {
    console.error("Event create/update error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
