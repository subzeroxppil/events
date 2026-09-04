import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSpinPayload } from "@/lib/luckydraw-live";

/**
 * Broadcast a spin to the view-only page.
 *
 * This only publishes; the winner is still recorded by
 * `POST /api/admin/luckydraw/[luckydrawId]`. Writing the payload to the draw
 * row is what lets viewers on a different server instance (Vercel invocation,
 * second Cloud Run container) see the spin — see `src/lib/live-hub.ts`.
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
      select: { viewOnlyEnabled: true },
    });

    if (!luckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    if (!luckyDraw.viewOnlyEnabled) {
      return NextResponse.json(
        { message: "View-only link is not enabled for this lucky draw" },
        { status: 409 }
      );
    }

    await prisma.events_portal_luckydraw.update({
      where: { id: luckydrawIdNum },
      data: {
        liveSpin: body as unknown as object,
        liveSpinAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Spin broadcast" }, { status: 200 });
  } catch (error) {
    console.error("Error broadcasting spin:", error);
    return NextResponse.json(
      { message: "Failed to broadcast spin" },
      { status: 500 }
    );
  }
}
