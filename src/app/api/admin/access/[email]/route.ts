import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ email: string }> }
): Promise<Response> {
  const { email } = await params;
  const emailToDelete = decodeURIComponent(email.trim().toLowerCase());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
