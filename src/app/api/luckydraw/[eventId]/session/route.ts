import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  const cookieKey = `luckyDrawSession${eventId}`;
  const cookieStore = await cookies();
  const workId = (await cookieStore).get(cookieKey)?.value || null;

  return NextResponse.json({ workId });
}
