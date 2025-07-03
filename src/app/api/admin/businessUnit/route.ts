import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.events_portal_business_unit_mapping.findMany({
      select: { email: true, businessUnit: true },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch business units:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
