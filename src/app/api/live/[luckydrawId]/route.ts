import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readCorpIdMapping } from "@/lib/corpid-mapping";
import { readWinners } from "@/lib/live-hub";

/**
 * Public read-only snapshot for the view-only page (`/live/[luckydrawId]`).
 *
 * Unauthenticated by design — this path is outside the middleware matcher.
 * The gate is `viewOnlyEnabled`: with the toggle off, nothing about the draw
 * is readable, even by someone holding the link.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ luckydrawId: string }> }
): Promise<Response> {
  try {
    const { luckydrawId } = await params;
    const luckydrawIdNum = Number(luckydrawId);

    if (isNaN(luckydrawIdNum)) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
      select: {
        name: true,
        eventIds: true,
        viewOnlyEnabled: true,
        liveSpinAt: true,
      },
    });

    // Same 404 for "no such draw" and "not shared", so the endpoint can't be
    // used to probe which draw ids exist.
    if (!luckyDraw || !luckyDraw.viewOnlyEnabled) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const attendances = await prisma.events_portal_attendance.findMany({
      where: { eventId: { in: luckyDraw.eventIds } },
      select: { events_portal_user: { select: { workId: true } } },
    });

    const participants = Array.from(
      new Set(attendances.map((a) => a.events_portal_user.workId))
    );

    const winners = await readWinners(luckydrawIdNum);

    return NextResponse.json({
      name: luckyDraw.name,
      participants,
      winners,
      corpIdMapping: readCorpIdMapping(luckyDraw.name),
      // So the page can subscribe without being replayed a finished spin.
      lastSpinId: luckyDraw.liveSpinAt ? luckyDraw.liveSpinAt.getTime() : 0,
    });
  } catch (error) {
    console.error("Error fetching public lucky draw:", error);
    return NextResponse.json(
      { message: "Failed to load lucky draw" },
      { status: 500 }
    );
  }
}
