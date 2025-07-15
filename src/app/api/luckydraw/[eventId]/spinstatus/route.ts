import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await params;
    const eventIdNum = Number(eventId);
    const { searchParams } = new URL(req.url);
    const workId = searchParams.get("workId");

    if (!workId || isNaN(eventIdNum)) {
      return NextResponse.json(
        { message: "Missing workId or eventId" },
        { status: 400 }
      );
    }

    const user = await prisma.events_portal_user.findUnique({
      where: { workId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const attendance = await prisma.events_portal_attendance.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventIdNum,
        },
      },
      select: {
        events_portal_prize: {
          select: {
            name: true,
            imageBlob: true,
            events_portal_brand: { select: { name: true } },
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Attendance not found" },
        { status: 404 }
      );
    }

    if (attendance.events_portal_prize) {
      return NextResponse.json({
        hasSpun: true,
        brand: attendance.events_portal_prize.events_portal_brand.name,
        name: attendance.events_portal_prize.name,
        imageUrl: `data:image/png;base64,${Buffer.from(
          attendance.events_portal_prize.imageBlob
        ).toString("base64")}`,
      });
    } else {
      return NextResponse.json({
        hasSpun: false,
        brand: null,
        name: null,
        imageUrl: null,
      });
    }
  } catch (error) {
    console.error("Spin status error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
