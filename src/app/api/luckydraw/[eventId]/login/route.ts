import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await req.json();
    const workId: string | undefined = body.workId?.trim();
    const eventId = parseInt(params.eventId);

    if (!workId) {
      return NextResponse.json({ message: "Missing work ID" }, { status: 400 });
    }

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 }
      );
    }

    // Step 1: Find the user by workId
    const user = await prisma.user.findUnique({
      where: { workId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Corp Pass ID not registered at this event" },
        { status: 404 }
      );
    }

    // Step 2: Check if user has attendance for the event
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Corp Pass ID not registered at this event" },
        { status: 404 }
      );
    }

    // Set HTTP-only session cookie
    const cookieKey = `luckyDrawSession${eventId}`;
    const response = NextResponse.json({ message: "Login successful" });
    response.headers.set(
      "Set-Cookie",
      `${cookieKey}=${workId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
        60 * 15
      }`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
