import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "groupNumber";
    // Build dynamic orderBy clause
    let orderByClause: any;

    switch (sortBy) {
      case "registeredAt":
        orderByClause = { registeredAt: "desc" };
        break;
      case "workId":
        orderByClause = { workId: "asc" };
        break;
      case "groupNumber":
        orderByClause = { groupNumber: "asc" };
        break;
      case "prizeName":
        orderByClause = {
          prize: {
            name: "asc",
          },
        };
        break;
      default:
        orderByClause = { groupNumber: "asc" };
    }
    const users = await prisma.user.findMany({
      select: {
        workId: true,
        groupNumber: true,
        registeredAt: true,
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
      orderBy: orderByClause,
    });

    // Format prize name as string or null
    const formattedUsers = users.map((user: any) => ({
      registeredAt: user.registeredAt,
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
