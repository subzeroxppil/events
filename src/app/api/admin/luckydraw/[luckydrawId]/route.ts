import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ luckydrawId: string }> }
): Promise<Response> {
  try {
    const { luckydrawId } = await params;
    const luckydrawIdNum = Number(luckydrawId);

    if (isNaN(luckydrawIdNum)) {
      return NextResponse.json(
        { message: "Invalid luckydrawId" },
        { status: 400 }
      );
    }

    // First, get the lucky draw and its associated eventIds
    const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
      select: {
        id: true,
        name: true,
        eventIds: true,
        createdAt: true,
        createdBy: true,
      },
    });

    if (!luckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    // Get all participants from the events associated with this lucky draw
    const attendances = await prisma.events_portal_attendance.findMany({
      where: {
        eventId: {
          in: luckyDraw.eventIds,
        },
      },
      select: {
        events_portal_user: {
          select: {
            workId: true,
          },
        },
      },
    });

    // Extract unique workIds
    const uniqueWorkIds = Array.from(
      new Set(
        attendances.map((attendance) => attendance.events_portal_user.workId)
      )
    );

    return NextResponse.json({
      luckyDraw: {
        id: luckyDraw.id,
        name: luckyDraw.name,
        eventIds: luckyDraw.eventIds,
        createdAt: luckyDraw.createdAt,
        createdBy: luckyDraw.createdBy,
      },
      participants: uniqueWorkIds,
      participantCount: uniqueWorkIds.length,
    });
  } catch (error) {
    console.error("Error fetching lucky draw participants:", error);
    return NextResponse.json(
      { message: "Failed to fetch lucky draw participants." },
      { status: 500 }
    );
  }
}

// sample response
// {
//   "luckyDraw": {
//     "id": 1,
//     "name": "Sample Lucky Draw",
//     "eventIds": [1, 2, 3],
//     "createdAt": "2025-09-10T10:00:00.000Z",
//     "createdBy": "admin@example.com"
//   },
//   "participants": ["WORK001", "WORK002", "WORK003"],
//   "participantCount": 3
// }
