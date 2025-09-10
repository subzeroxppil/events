import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const luckyDraws = await prisma.events_portal_luckydraw.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      { luckyDraws, count: luckyDraws.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch lucky draws:", error);
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
      where: { id: parseInt(userId) },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, eventIds } = body;

    // Validate required fields
    if (!name || !eventIds) {
      return NextResponse.json(
        { message: "Name and eventIds are required fields." },
        { status: 400 }
      );
    }

    // Validate that eventIds is an array
    if (!Array.isArray(eventIds)) {
      return NextResponse.json(
        { message: "eventIds must be an array." },
        { status: 400 }
      );
    }

    // Validate that all eventIds are numbers
    const validEventIds = eventIds.every((id) => Number.isInteger(id));
    if (!validEventIds) {
      return NextResponse.json(
        { message: "All eventIds must be integers." },
        { status: 400 }
      );
    }

    // Verify that all events exist
    const existingEvents = await prisma.events_portal_event.findMany({
      where: {
        id: {
          in: eventIds,
        },
      },
      select: { id: true },
    });

    if (existingEvents.length !== eventIds.length) {
      return NextResponse.json(
        { message: "One or more events do not exist." },
        { status: 400 }
      );
    }

    const createdLuckyDraw = await prisma.events_portal_luckydraw.create({
      data: {
        name: name.trim(),
        eventIds,
        createdBy: user.email.trim().toLowerCase(),
      },
    });

    return NextResponse.json(
      {
        message: "Lucky draw created successfully.",
        luckyDraw: createdLuckyDraw,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lucky draw:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
