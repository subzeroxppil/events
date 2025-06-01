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

    const attendances = await prisma.attendance.findMany({
      where: { eventId: eventIdNum },
      select: {
        registeredAt: true,
        groupNumber: true,
        user: {
          select: {
            workId: true,
          },
        },
        prize: {
          select: {
            name: true,
            brand: {
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
              prize: {
                name: "asc",
              },
            }
          : sortField === "workId"
          ? {
              user: {
                workId: "asc",
              },
            }
          : {
              [sortField]: "asc",
            },
    });

    const formattedUsers = attendances.map((a) => ({
      workId: a.user.workId,
      groupNumber: a.groupNumber,
      registeredAt: a.registeredAt.toISOString(),
      prizeName: a.prize?.name || null,
      brandName: a.prize?.brand?.name || null,
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
