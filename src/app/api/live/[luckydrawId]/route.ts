import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readCorpIdMapping } from "@/lib/corpid-mapping";
import { readWinners } from "@/lib/live-hub";
import { buildIdleList } from "@/lib/luckydraw-idle";
import { isSpinPayload } from "@/lib/luckydraw-live";

/** Kept in step with the client's reel length. */
const IDLE_ITEM_COUNT = 200;

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
        liveSpin: true,
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
    const lastSpinId = luckyDraw.liveSpinAt ? luckyDraw.liveSpinAt.getTime() : 0;

    // The last spin, replayed only as an anchor: it tells a late joiner which
    // reel and which row the draw came to rest on, so its idle drift lines up
    // with the phones that watched the spin happen. It is never animated.
    const spin = luckyDraw.liveSpin;
    const lastSpin =
      lastSpinId && isSpinPayload(spin)
        ? {
            spinId: lastSpinId,
            spinnerItems: spin.spinnerItems,
            finalTarget: spin.finalTarget,
            duration: spin.duration,
            settings: spin.settings,
          }
        : null;

    return NextResponse.json({
      name: luckyDraw.name,
      participants,
      winners,
      corpIdMapping: readCorpIdMapping(luckyDraw.name),
      // Built here rather than on each phone: a locally shuffled reel would
      // give every viewer a different set of names.
      idleItems: buildIdleList(participants, luckydrawIdNum, IDLE_ITEM_COUNT),
      // Lets the page correct for a device clock that is off by a few seconds,
      // which would otherwise show as a few rows of drift.
      serverNow: Date.now(),
      // So the page can subscribe without being replayed a finished spin.
      lastSpinId,
      lastSpin,
    });
  } catch (error) {
    console.error("Error fetching public lucky draw:", error);
    return NextResponse.json(
      { message: "Failed to load lucky draw" },
      { status: 500 }
    );
  }
}
