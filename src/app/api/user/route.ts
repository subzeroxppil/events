import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    let { workId, eventId } = await req.json();

    workId = workId?.trim();
    eventId = parseInt(eventId.trim());

    if (!workId || !eventId) {
      return NextResponse.json(
        { message: "Missing workId or eventId" },
        { status: 400 }
      );
    }

    // Step 1: Get or create the user
    let user = await prisma.events_portal_user.findUnique({
      where: { workId },
    });

    if (!user) {
      user = await prisma.events_portal_user.create({ data: { workId } });
    }

    // Step 2: Check if user already checked in
    const existingAttendance = await prisma.events_portal_attendance.findUnique(
      {
        where: {
          userId_eventId: {
            userId: user.id,
            eventId,
          },
        },
      }
    );

    if (existingAttendance) {
      return NextResponse.json(
        { groupNumber: existingAttendance.groupNumber },
        { status: 200 }
      );
    }

    // Step 3: Fetch event and related attendances
    const event = await prisma.events_portal_event.findUnique({
      where: { id: eventId },
      include: { attendances: true },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    let groupNumber: number | null = null;

    if (event.groupingStrategy && event.groupConfigNumber) {
      const attendances = event.attendances;

      if (event.groupingStrategy === "roundRobin") {
        const totalGroups = event.groupConfigNumber;
        groupNumber = (attendances.length % totalGroups) + 1;
      } else if (event.groupingStrategy === "maxGroupCapacity") {
        const maxPerGroup = event.groupConfigNumber;

        // Count how many people are in each group
        const groupCounts: Record<number, number> = {};
        attendances.forEach((a) => {
          if (a.groupNumber == null) return;
          groupCounts[a.groupNumber] = (groupCounts[a.groupNumber] || 0) + 1;
        });

        // Find the first group with less than maxPerGroup
        for (let i = 1; ; i++) {
          const count = groupCounts[i] || 0;
          if (count < maxPerGroup) {
            groupNumber = i;
            break;
          }
        }
      }
    }

    // Step 4: Create attendance
    await prisma.events_portal_attendance.create({
      data: {
        userId: user.id,
        eventId,
        groupNumber,
      },
    });

    return NextResponse.json({ groupNumber }, { status: 200 });
  } catch (err) {
    console.error("Failed to register user:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
