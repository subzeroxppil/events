import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readWinners } from "@/lib/live-hub";
import { winnerStanding } from "@/lib/luckydraw-eligibility";
import {
  MAX_SPIN_DURATION_MS,
  SPIN_LEAD_MS,
  isSpinPayload,
  type SpinPayload,
} from "@/lib/luckydraw-live";

/**
 * Claim and broadcast a spin.
 *
 * Two jobs, both of which have to happen here rather than on the client:
 *
 * 1. **Schedule it.** The reply carries `startAt`, a server-time instant far
 *    enough ahead that every screen has the spin in hand before the moment
 *    arrives. The bus is not instant and its delay differs per device, so a
 *    deadline is the only thing that makes the reels agree — see
 *    `SPIN_LEAD_MS`.
 * 2. **Arbitrate it.** Every admin can press Spin, and two who press within
 *    the same lead window have each already picked a *different* winner
 *    locally. Exactly one may win, or the draw records two winners for a spin
 *    the room only saw once. The loser gets a 409 and watches instead.
 *
 * This still only publishes; the winner is recorded by
 * `POST /api/admin/luckydraw/[luckydrawId]` when the animation ends, by
 * whichever admin won the claim here.
 */
export async function POST(
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

    const body = await req.json();

    if (!isSpinPayload(body)) {
      return NextResponse.json(
        { message: "Invalid spin payload" },
        { status: 400 }
      );
    }

    const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
      select: { viewOnlyEnabled: true, liveSpin: true, liveSpinAt: true },
    });

    if (!luckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    // A claim is only meaningful in synced mode: with the view-only link off
    // the draw is assumed to be one admin on their own, spinning instantly.
    if (!luckyDraw.viewOnlyEnabled) {
      return NextResponse.json(
        { message: "View-only link is not enabled for this lucky draw" },
        { status: 409 }
      );
    }

    const now = Date.now();
    const previousStamp = luckyDraw.liveSpinAt;

    // Is the spin already on the row still running? Judged by *its* schedule
    // and duration, not by the incoming one — the admin asking for the lock
    // has no say in how long the current holder gets to keep it.
    const stored = luckyDraw.liveSpin as unknown;
    if (previousStamp && isSpinPayload(stored)) {
      const storedSpin = stored as SpinPayload;
      const storedStart = storedSpin.startAt ?? previousStamp.getTime();
      // Capped independently of what the stored payload claims. Validation on
      // the way in should already guarantee this, but a row written by an
      // older build has not been through it, and the failure mode — a lock
      // nobody can clear — is bad enough to be worth defending twice.
      const heldFor = Math.min(
        Math.max(storedSpin.duration, 0) || 0,
        MAX_SPIN_DURATION_MS
      );
      // `storedStart` is already the scheduled start (the lead is baked into
      // it), so the spin is over at start + duration — no extra grace, or a
      // legitimate next spin would be refused after the reel had stopped.
      const endsAt = storedStart + heldFor;

      if (endsAt > now) {
        return NextResponse.json(
          {
            message: "A spin is already in flight",
            inFlightSpinId: previousStamp.getTime(),
          },
          { status: 409 }
        );
      }
    }

    // The proposing screen picked from its own copy of the winners list,
    // which can be behind the database. Refuse a past winner while anyone
    // else is still eligible, and hand back the real list so that screen can
    // quietly pick again before anything has moved.
    const standing = await winnerStanding(luckydrawIdNum, body.winner);
    if (standing.blocked) {
      return NextResponse.json(
        {
          message: "That participant has already won this lucky draw",
          inFlightSpinId: 0,
          reason: "already-won",
          winners: await readWinners(luckydrawIdNum),
        },
        { status: 409 }
      );
    }

    // Re-read the clock: the eligibility check above took time, and the lead
    // has to be measured from the moment of the claim, not before it.
    const claimedAt = Date.now();
    const stampedAt = new Date(claimedAt);
    const startAt = claimedAt + SPIN_LEAD_MS;
    const payload: Omit<SpinPayload, "spinId"> = { ...body, startAt };

    // Guarded on the stamp we just read: if another admin claimed in the gap
    // between the read above and this write, their stamp is on the row now,
    // no rows match, and we lose the race. This is the only thing standing
    // between two simultaneous presses and two recorded winners.
    const claimed = await prisma.events_portal_luckydraw.updateMany({
      where: { id: luckydrawIdNum, liveSpinAt: previousStamp },
      data: {
        liveSpin: payload as unknown as object,
        liveSpinAt: stampedAt,
      },
    });

    if (claimed.count === 0) {
      // Report whoever did win, so the loser can wait for that spin on the
      // stream rather than guessing at one.
      const current = await prisma.events_portal_luckydraw.findUnique({
        where: { id: luckydrawIdNum },
        select: { liveSpinAt: true },
      });
      return NextResponse.json(
        {
          message: "Another admin claimed this spin first",
          inFlightSpinId: current?.liveSpinAt?.getTime() ?? 0,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        spinId: stampedAt.getTime(),
        startAt,
        serverNow: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error broadcasting spin:", error);
    return NextResponse.json(
      { message: "Failed to broadcast spin" },
      { status: 500 }
    );
  }
}
