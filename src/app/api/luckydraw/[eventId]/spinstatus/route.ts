import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const workId = searchParams.get("workId");
    const eventId = params.eventId;

    if (!workId || !eventId) {
      return NextResponse.json(
        { message: "Missing workId or eventId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { workId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: Number(eventId),
        },
      },
      select: {
        prize: {
          select: {
            name: true,
            imageBlob: true,
            brand: { select: { name: true } },
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

    if (attendance.prize) {
      return NextResponse.json({
        hasSpun: true,
        brand: attendance.prize.brand.name,
        name: attendance.prize.name,
        imageUrl: `data:image/png;base64,${Buffer.from(
          attendance.prize.imageBlob
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
