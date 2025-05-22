import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { workId } = await req.json();

    if (!workId) {
      return NextResponse.json(
        { message: "Please fill in your Corp Pass ID" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { workId },
    });

    if (existingUser) {
      return NextResponse.json(
        { groupNumber: existingUser.groupNumber },
        { status: 200 }
      );
    }

    // Get group count from config (only one row expected)
    const config = await prisma.groupConfig.findUnique({ where: { id: 1 } });
    if (!config) {
      return NextResponse.json(
        { message: "Internal Server Error" }, // Group config not found
        { status: 500 }
      );
    }

    const groupCount = config.groupCount;

    // Count total registered users
    const totalUsers = await prisma.user.count();

    // Round-robin assignment: 1 to groupCount, then cycle back
    const assignedGroup = (totalUsers % groupCount) + 1;

    const newUser = await prisma.user.create({
      data: {
        workId,
        groupNumber: assignedGroup,
      },
    });

    return NextResponse.json(
      { groupNumber: newUser.groupNumber },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
