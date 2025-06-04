import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requesterEmail = user?.email?.trim().toLowerCase();

  const currentUser = await prisma.admin.findUnique({
    where: { email: requesterEmail },
  });

  const admins = await prisma.admin.findMany({
    select: { email: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({
    admins,
    currentUserRole: currentUser?.role ?? null,
  });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.admin.findUnique({
    where: { email: user.email.trim().toLowerCase() },
  });

  if (currentUser?.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const exists = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (exists) {
      return NextResponse.json(
        { message: "Admin already exists" },
        { status: 409 }
      );
    }

    await prisma.admin.create({
      data: {
        email: normalizedEmail,
        role: "EVENTADMIN",
      },
    });

    return NextResponse.json({ message: "Admin added successfully" });
  } catch (error) {
    console.error("Add admin error:", error);
    return NextResponse.json(
      { message: "Failed to add admin" },
      { status: 500 }
    );
  }
}
