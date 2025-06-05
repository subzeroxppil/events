import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);
  if (isNaN(eventIdNum)) {
    return NextResponse.json({ message: "Invalid eventId" }, { status: 400 });
  }

  try {
    // Fetch all attendances for this event
    const attendances = await prisma.attendance.findMany({
      where: { eventId: eventIdNum },
      select: {
        user: {
          select: { workId: true },
        },
      },
    });

    if (attendances.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Extract user identifiers (before @ in workId)
    const userWorkIds = attendances.map((a) =>
      a.user.workId.toLowerCase().trim()
    );

    const allMappings = await prisma.businessUnitMapping.findMany({
      select: { email: true, businessUnit: true },
    });

    const mappingMap = new Map<string, string>();

    for (const { email, businessUnit } of allMappings) {
      const prefix = email.split("@")[0].toLowerCase().trim();
      mappingMap.set(prefix, businessUnit);
    }

    const counts: Record<string, number> = {};

    for (const prefix of userWorkIds) {
      const unit = mappingMap.get(prefix) || "Unknown";
      counts[unit] = (counts[unit] || 0) + 1;
    }

    const result = Object.entries(counts).map(([businessUnit, count]) => ({
      businessUnit,
      count,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to compute business unit breakdown", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
