import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Extract the search query
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase() || "";

    const events = await prisma.events_portal_event.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        events_portal_attendance: true,
      },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.name,
      country: event.country,
      location: event.location,
      attendees: event.events_portal_attendance.length,
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

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getUserIdFromCookie();

    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = sessionUser;

    // Lookup user by ID to get email
    const user = await prisma.events_portal_admin_user.findUnique({
      where: { id: parseInt(userId) }, // adjust if userId is string
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const requesterEmail = user.email.trim().toLowerCase();

    const body = await req.json();
    const {
      name,
      country,
      location,
      eventStartTime,
      eventEndTime,
      hasLuckyDraw,
      groupingStrategy,
      groupConfigNumber,
      prizes,
      terms,
    } = body;

    if (!name || !country || !location || !eventStartTime || !eventEndTime) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const createdEvent = await prisma.events_portal_event.create({
      data: {
        name,
        country,
        location,
        eventStartTime: new Date(eventStartTime),
        eventEndTime: new Date(eventEndTime),
        hasLuckyDraw,
        groupingStrategy:
          groupingStrategy === "noNeed" ? null : groupingStrategy,
        groupConfigNumber,
        createdBy: requesterEmail,
        terms: terms?.trim() || null,
      },
    });

    if (hasLuckyDraw && prizes?.length > 0) {
      for (const prize of prizes) {
        const existingBrand = await prisma.events_portal_brand.upsert({
          where: { name: prize.brand },
          update: {},
          create: { name: prize.brand },
        });

        await prisma.events_portal_prize.create({
          data: {
            name: prize.name,
            quantity: prize.quantity,
            imageBlob: Buffer.from(prize.imageBlob),
            brandId: existingBrand.id,
            eventId: createdEvent.id,
          },
        });
      }
    }

    return NextResponse.json({ message: "Event created successfully." });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
