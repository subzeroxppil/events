import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);

  const cookieKey = `luckyDrawSession${eventIdNum}`;
  const cookieStore = await cookies();
  const workId = (await cookieStore).get(cookieKey)?.value || null;

  return NextResponse.json({ workId });
}
