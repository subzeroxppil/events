import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);

  if (isNaN(eventIdNum)) {
    return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
  }

  try {
    await prisma.events_portal_attendance.deleteMany({
      where: { eventId: eventIdNum },
    });

    await prisma.events_portal_prize.deleteMany({
      where: { eventId: eventIdNum },
    });

    await prisma.events_portal_event.delete({ where: { id: eventIdNum } });

    await prisma.events_portal_brand.deleteMany({
      where: {
        prizes: {
          none: {},
        },
      },
    });

    await prisma.events_portal_user.deleteMany({
      where: {
        attendances: {
          none: {},
        },
      },
    });

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 }
    );
  }
}
