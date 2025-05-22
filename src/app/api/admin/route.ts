import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        workId: true,
        groupNumber: true,
        prize: {
          select: {
            name: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        groupNumber: "asc",
      },
    });

    // Format prize name as string or null
    const formattedUsers = users.map((user: any) => ({
      workId: user.workId,
      groupNumber: user.groupNumber,
      prizeName: user.prize?.name ?? null,
      brandName: user.prize?.brand?.name ?? null,
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
