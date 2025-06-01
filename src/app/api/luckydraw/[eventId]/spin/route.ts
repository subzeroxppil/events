import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await params;
    const eventIdNum = Number(eventId);

    const { workId } = await req.json();
    if (!workId || isNaN(eventIdNum)) {
      return NextResponse.json(
        { message: "Missing or invalid workId or eventId" },
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
          eventId: eventIdNum,
        },
      },
      include: {
        prize: {
          include: { brand: true },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "User is not registered for this event" },
        { status: 404 }
      );
    }

    if (attendance.prize) {
      return NextResponse.json(
        { message: "User has already spun" },
        { status: 400 }
      );
    }

    const availablePrizes = await prisma.prize.findMany({
      where: {
        eventId: eventIdNum,
        quantity: { gt: 0 },
      },
      include: { brand: true },
    });

    if (availablePrizes.length === 0) {
      return NextResponse.json({ message: "No prizes left" }, { status: 400 });
    }

    const selectedPrize =
      availablePrizes[Math.floor(Math.random() * availablePrizes.length)];

    // Atomically assign prize to attendance and decrement quantity
    await prisma.$transaction([
      prisma.attendance.update({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventIdNum,
          },
        },
        data: {
          prizeId: selectedPrize.id,
        },
      }),
      prisma.prize.update({
        where: { id: selectedPrize.id },
        data: {
          quantity: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      prize: {
        brand: selectedPrize.brand.name,
        name: selectedPrize.name,
        imageUrl: `data:image/png;base64,${Buffer.from(
          selectedPrize.imageBlob
        ).toString("base64")}`,
      },
    });
  } catch (error) {
    console.error("Spin API error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
