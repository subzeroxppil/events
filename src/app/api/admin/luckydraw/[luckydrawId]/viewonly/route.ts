import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
