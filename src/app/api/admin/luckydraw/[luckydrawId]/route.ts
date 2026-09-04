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
        viewOnlyEnabled: true,
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

    // Get winners for this lucky draw (commented out for now since table might not exist)
    const winners = await prisma.events_portal_luckydraw_winners.findMany({
      where: { luckydrawId: luckydrawIdNum },
      include: {
        events_portal_user: {
          select: {
            workId: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const winnerData = winners.map((winner) => ({
      workId: winner.events_portal_user.workId,
      wonAt: winner.createdAt,
    }));

    return NextResponse.json({
      luckyDraw: {
        id: luckyDraw.id,
        name: luckyDraw.name,
        eventIds: luckyDraw.eventIds,
        createdAt: luckyDraw.createdAt,
        createdBy: luckyDraw.createdBy,
        viewOnlyEnabled: luckyDraw.viewOnlyEnabled,
      },
      participants: uniqueWorkIds,
      participantCount: uniqueWorkIds.length,
      winners: winnerData, // winnerWorkIds when table is available
    });
  } catch (error) {
    console.error("Error fetching lucky draw participants:", error);
    return NextResponse.json(
      { message: "Failed to fetch lucky draw participants." },
      { status: 500 }
    );
  }
}

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
    const { workId } = body;

    if (!workId) {
      return NextResponse.json(
        { message: "workId is required" },
        { status: 400 }
      );
    }

    // Check if lucky draw exists
    const existingLuckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
    });

    if (!existingLuckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    // Find the user by workId
    const user = await prisma.events_portal_user.findUnique({
      where: { workId: workId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if user already won this lucky draw
    // Note: Commenting out winner check for now since the table might not exist yet
    const existingWinner =
      await prisma.events_portal_luckydraw_winners.findFirst({
        where: {
          luckydrawId: luckydrawIdNum,
          userId: user.id,
        },
      });

    if (existingWinner) {
      return NextResponse.json(
        { message: "User has already won this lucky draw" },
        { status: 400 }
      );
    }

    // Record the winner
    // Note: For now, just return success since the winner table might not exist
    const winner = await prisma.events_portal_luckydraw_winners.create({
      data: {
        luckydrawId: luckydrawIdNum,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Winner recorded successfully",
        winner: {
          workId: workId,
          wonAt: new Date(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording winner:", error);
    return NextResponse.json(
      { message: "Failed to record winner" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { workId } = body;

    if (!workId) {
      return NextResponse.json(
        { message: "workId is required" },
        { status: 400 }
      );
    }

    // Check if lucky draw exists
    const existingLuckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
    });

    if (!existingLuckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    // Find the user by workId
    const user = await prisma.events_portal_user.findUnique({
      where: { workId: workId },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete the winner record
    const deletedWinner =
      await prisma.events_portal_luckydraw_winners.deleteMany({
        where: {
          luckydrawId: luckydrawIdNum,
          userId: user.id,
        },
      });

    if (deletedWinner.count === 0) {
      return NextResponse.json(
        { message: "Winner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Winner deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting winner:", error);
    return NextResponse.json(
      { message: "Failed to delete winner" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if lucky draw exists
    const existingLuckyDraw = await prisma.events_portal_luckydraw.findUnique({
      where: { id: luckydrawIdNum },
    });

    if (!existingLuckyDraw) {
      return NextResponse.json(
        { message: "Lucky draw not found" },
        { status: 404 }
      );
    }

    // Delete any winners associated with this lucky draw (if table exists)
    await prisma.events_portal_luckydraw_winners.deleteMany({
      where: { luckydrawId: luckydrawIdNum },
    });

    // Delete the lucky draw
    await prisma.events_portal_luckydraw.delete({
      where: { id: luckydrawIdNum },
    });

    return NextResponse.json(
      { message: "Lucky draw deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting lucky draw:", error);
    return NextResponse.json(
      { message: "Failed to delete lucky draw" },
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
