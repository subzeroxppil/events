import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workId: string | undefined = body.workId?.trim();

    if (!workId) {
      return NextResponse.json({ message: "Missing work ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { workId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Corp Pass ID not registered at our event" },
        { status: 404 }
      );
    }

    // Set HTTP-only session cookie
    const response = NextResponse.json({ message: "Login successful" });
    response.headers.set(
      "Set-Cookie",
      `luckyDrawSession=${workId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
        60 * 15
      }`
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
