import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  const { eventId } = await params;
  const eventIdNum = Number(eventId);
  const cookieKey = `luckyDrawSession${eventIdNum}`;

  return NextResponse.json(
    { message: "Logged out" },
    {
      status: 200,
      headers: {
        "Set-Cookie": `${cookieKey}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
      },
    }
  );
}
