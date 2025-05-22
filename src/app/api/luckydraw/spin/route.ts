import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { workId } = await req.json();

    const user = await prisma.user.findUnique({ where: { workId } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.prizeId) {
      return NextResponse.json(
        { message: "User has already spun" },
        { status: 400 }
      );
    }

    const availablePrizes = await prisma.prize.findMany({
      where: {
        quantity: { gt: 0 },
      },
      include: {
        brand: true,
      },
    });

    if (availablePrizes.length === 0) {
      return NextResponse.json({ message: "No prizes left" }, { status: 400 });
    }

    const selectedPrize =
      availablePrizes[Math.floor(Math.random() * availablePrizes.length)];

    // Atomically assign prize to user and decrement quantity
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { prizeId: selectedPrize.id },
      }),
      prisma.prize.update({
        where: { id: selectedPrize.id },
        data: { quantity: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      prize: {
        brand: selectedPrize.brand.name,
        name: selectedPrize.name,
        imageUrl: selectedPrize.imageUrl,
      },
    });
  } catch (error) {
    console.error("Spin API error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
