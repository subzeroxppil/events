import { getUserIdFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ email: string }> }
): Promise<Response> {
  const { email } = await params;
  const emailToDelete = decodeURIComponent(email.trim().toLowerCase());

  const sessionUser = await getUserIdFromCookie();

  if (!sessionUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = sessionUser;

  // Lookup user by ID to get email
  const user = await prisma.adminUser.findUnique({
    where: { id: parseInt(userId) }, // adjust if userId is string
    select: { email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const requesterEmail = user.email.trim().toLowerCase();

  const requester = await prisma.admin.findUnique({
    where: { email: requesterEmail },
  });

  if (!requester || requester.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.admin.delete({ where: { email: emailToDelete } });
    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Failed to delete admin:", error);
    return NextResponse.json(
      { message: "Failed to delete admin" },
      { status: 500 }
    );
  }
}
