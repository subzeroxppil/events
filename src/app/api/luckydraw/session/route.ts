import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const workId = (await cookieStore).get("luckyDrawSession")?.value || null;

  return NextResponse.json({ workId });
}
