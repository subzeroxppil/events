import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The server's clock, and nothing else.
 *
 * Every screen schedules its spin against server time, so it needs to know how
 * far its own clock is out. That estimate is only as good as the round trip
 * used to take it — any work done here is indistinguishable from network
 * latency and widens the error — so this route deliberately touches no
 * database and reads no params.
 */
export async function GET(): Promise<Response> {
  return NextResponse.json(
    { serverNow: Date.now() },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
