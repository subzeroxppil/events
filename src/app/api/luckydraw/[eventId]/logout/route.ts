import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  const cookieKey = `luckyDrawSession${eventId}`;

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
