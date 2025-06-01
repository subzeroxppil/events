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

    const prizes = await prisma.prize.findMany({
      where: {
        eventId,
        quantity: { gt: 0 },
      },
      select: {
        name: true,
      },
    });

    if (prizes.length === 0) {
      return NextResponse.json(
        { message: "No prizes available" },
        { status: 404 }
      );
    }

    return NextResponse.json(prizes.map((prize) => ({ prize: prize.name })));
  } catch (error) {
    console.error("Error fetching prizes:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
