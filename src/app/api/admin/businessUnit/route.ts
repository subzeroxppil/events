import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.businessUnitMapping.findMany({
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
