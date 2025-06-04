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
