import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const prizes = await prisma.prize.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const formatted = prizes.map((prize) => ({
      prize: prize.name,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Error fetching prizes:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
