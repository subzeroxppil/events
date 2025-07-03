import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserIdFromCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const sessionUser = await getUserIdFromCookie();

  if (!sessionUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = sessionUser;

  // Lookup user by ID to get email
  const user = await prisma.events_portal_admin_user.findUnique({
    where: { id: parseInt(userId) }, // adjust if userId is string
    select: { email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const requesterEmail = user.email.trim().toLowerCase();

  const currentUser = await prisma.events_portal_admin.findUnique({
    where: { email: requesterEmail },
  });

  const admins = await prisma.events_portal_admin.findMany({
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

  const sessionUser = await getUserIdFromCookie();

  if (!sessionUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = sessionUser;

  // Lookup user by ID to get email
  const user = await prisma.events_portal_adminUser.findUnique({
    where: { id: parseInt(userId) }, // adjust if userId is string
    select: { email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const currentUser = await prisma.events_portal_admin.findUnique({
    where: { email: user.email.trim().toLowerCase() },
  });

  if (currentUser?.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const exists = await prisma.events_portal_admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (exists) {
      return NextResponse.json(
        { message: "Admin already exists" },
        { status: 409 }
      );
    }

    await prisma.events_portal_admin.create({
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
