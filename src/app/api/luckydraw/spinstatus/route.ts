// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const workId = searchParams.get("workId");

//     if (!workId) {
//       return NextResponse.json({ message: "Missing workId" }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { workId },
//       select: { prizeId: true },
//     });

//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({ hasSpun: !!user.prizeId }, { status: 200 });
//   } catch (error) {
//     console.error("Spin status error:", error);
//     return NextResponse.json(
//       { message: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/luckydraw/spin-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workId = searchParams.get("workId");

    if (!workId) {
      return NextResponse.json({ message: "Missing workId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { workId },
      select: {
        prize: {
          select: {
            name: true,
            imageUrl: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.prize) {
      return NextResponse.json({
        hasSpun: true,
        brand: user.prize.brand.name,
        name: user.prize.name,
        imageUrl: user.prize.imageUrl,
      });
    } else {
      return NextResponse.json({
        hasSpun: false,
        brand: null,
        name: null,
      });
    }
  } catch (error) {
    console.error("Spin status error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
