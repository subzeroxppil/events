import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ authorized: false }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await prisma.events_portal_admin.findUnique({
      where: { email: normalizedEmail },
    });

    return NextResponse.json({ authorized: !!admin });
  } catch (error) {
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
