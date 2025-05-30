import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = parseInt(params.eventId);
  if (isNaN(eventId)) {
    return NextResponse.json({ message: "Invalid eventId" }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: true,
        location: true,
        country: true,
        eventStartTime: true,
        eventEndTime: true,
        groupingStrategy: true,
        groupConfigNumber: true,
        hasLuckyDraw: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { eventId },
      select: {
        id: true,
        groupNumber: true,
        prizeId: true,
      },
    });

    const prizeWinners = attendances.filter((a) => a.prizeId !== null);
    const totalPrizesLeft = await prisma.prize.aggregate({
      where: { eventId },
      _sum: { quantity: true },
    });

    const groupCounts = await prisma.attendance.groupBy({
      by: ["groupNumber"],
      where: { eventId },
      _count: true,
    });

    return NextResponse.json({
      event,
      stats: {
        totalAttendees: attendances.length,
        luckyDrawCompleted: prizeWinners.length,
        unredeemedLuckyDraws: attendances.length - prizeWinners.length,
        totalPrizesLeft: totalPrizesLeft._sum.quantity || 0,
      },
      groupCounts: groupCounts.map((g) => ({
        groupNumber: g.groupNumber,
        count: g._count,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
