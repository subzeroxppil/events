import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    // Get total number of attendances across all events
    const totalCheckins = await prisma.events_portal_attendance.count();

    return NextResponse.json({
      totalCheckins,
    });
  } catch (error) {
    console.error("Error fetching total check-ins:", error);
    return NextResponse.json(
      { message: "Failed to fetch total check-ins" },
      { status: 500 }
    );
  }
}
