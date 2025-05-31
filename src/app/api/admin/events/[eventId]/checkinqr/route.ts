import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = parseInt(params.eventId);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 }
      );
    }

    console.log("eventId", eventId);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true }, // only return what you need
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ name: event.name }, { status: 200 });
  } catch (err) {
    console.error("Error fetching event:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
