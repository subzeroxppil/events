import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const formatted = brands.map((brand) => ({
      brand: brand.name,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
