import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);
  try {
    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await prisma.events_portal_event.findUnique({
      where: { id: eventIdNum },
      select: {
        name: true,
        groupingStrategy: true,
        hasLuckyDraw: true,
        terms: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch event:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
