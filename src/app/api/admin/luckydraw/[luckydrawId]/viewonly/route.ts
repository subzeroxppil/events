import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Read just the view-only flag.
 *
 * Deliberately its own tiny endpoint rather than the parent GET, which builds
 * the whole participant list: an admin screen sitting in solo mode polls this
 * at a low rate so that when someone else turns the live link on, it joins the
 * synced draw instead of quietly staying on its own for the rest of the event.
 */
export async function GET(
  _req: NextRequest,
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

    const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
      select: { viewOnlyEnabled: true },
    });

    if (!luckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { viewOnlyEnabled: luckyDraw.viewOnlyEnabled },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reading view-only setting:", error);
    return NextResponse.json(
      { message: "Failed to read view-only setting" },
      { status: 500 }
    );
  }
}

/**
 * Turn the public view-only page on or off for a lucky draw.
 *
 * A separate sub-route because PATCH on the parent route already means
 * "delete a winner".
 */
export async function PUT(
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
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { message: "enabled (boolean) is required" },
        { status: 400 }
      );
    }

    const existingLuckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
      select: { id: true },
    });

    if (!existingLuckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.events_portal_luckydraw.update({
      where: { id: luckydrawIdNum },
      data: {
        viewOnlyEnabled: enabled,
        // Clear the bus on disable so re-enabling never replays a stale spin.
        ...(enabled ? {} : { liveSpin: Prisma.DbNull, liveSpinAt: null }),
      },
      select: { viewOnlyEnabled: true },
    });

    return NextResponse.json(
      { viewOnlyEnabled: updated.viewOnlyEnabled },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating view-only setting:", error);
    return NextResponse.json(
      { message: "Failed to update view-only setting" },
      { status: 500 }
    );
  }
}
