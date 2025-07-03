import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);
  try {
    if (isNaN(eventIdNum)) {
      return NextResponse.json({ message: "Invalid eventId" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "registeredAt";

    const validSortFields = [
      "registeredAt",
      "groupNumber",
      "workId",
      "prizeName",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "registeredAt";

    const attendances = await prisma.events_portal_attendance.findMany({
      where: { eventId: eventIdNum },
      select: {
        registeredAt: true,
        groupNumber: true,
        events_portal_user: {
          select: {
            workId: true,
          },
        },
        events_portal_prize: {
          select: {
            name: true,
            events_portal_brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy:
        sortField === "prizeName"
          ? {
              events_portal_prize: {
                name: "asc",
              },
            }
          : sortField === "workId"
          ? {
              events_portal_user: {
                workId: "asc",
              },
            }
          : {
              [sortField]: "asc",
            },
    });

    const formattedUsers = attendances.map((a) => ({
      workId: a.events_portal_user.workId,
      groupNumber: a.groupNumber,
      registeredAt: a.registeredAt.toISOString(),
      prizeName: a.events_portal_prize?.name || null,
      brandName: a.events_portal_prize?.events_portal_brand?.name || null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching event users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users for event." },
      { status: 500 }
    );
  }
}
