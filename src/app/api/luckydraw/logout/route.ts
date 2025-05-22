// app/api/luckydraw/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Logged out" },
    {
      status: 200,
      headers: {
        "Set-Cookie": `luckyDrawSession=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
      },
    }
  );
}
