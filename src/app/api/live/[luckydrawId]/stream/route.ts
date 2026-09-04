import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribe, readWinners } from "@/lib/live-hub";

export const runtime = "nodejs"; // Prisma
export const dynamic = "force-dynamic";
// Vercel caps a streaming response; EventSource reconnects on its own, and the
// `spinId` dedupe on the client makes that reconnect harmless.
export const maxDuration = 300;

const HEARTBEAT_MS = 15_000;

/**
 * Server-Sent Events feed for the view-only page.
 *
 * Emits:
 *   init     once, on connect  — draw name, winners, and the spin id already
 *                                in flight (so a late joiner isn't dropped
 *                                into a half-finished animation)
 *   spin     when the admin presses Spin
 *   winners  when the winners list changes
 *   offline  when the view-only toggle is switched off
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ luckydrawId: string }> }
): Promise<Response> {
  const { luckydrawId } = await params;
  const luckydrawIdNum = Number(luckydrawId);

  if (isNaN(luckydrawIdNum)) {
    return new Response("Not found", { status: 404 });
  }

  const luckyDraw = await prisma.events_portal_luckydraw.findUnique({
    where: { id: luckydrawIdNum },
    select: { name: true, viewOnlyEnabled: true, liveSpinAt: true },
  });

  if (!luckyDraw || !luckyDraw.viewOnlyEnabled) {
    return new Response("Not found", { status: 404 });
  }

  const winners = await readWinners(luckydrawIdNum);
  const lastSpinId = luckyDraw.liveSpinAt ? luckyDraw.liveSpinAt.getTime() : 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Client vanished between the abort event and this write.
          closed = true;
        }
      };

      const send = (event: string, data: unknown) => {
        write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      send("init", {
        name: luckyDraw.name,
        winners,
        lastSpinId,
      });

      const unsubscribe = subscribe(
        luckydrawIdNum,
        lastSpinId,
        winners,
        (event, data) => send(event, data)
      );

      // Comment frames keep proxies and mobile radios from dropping an idle
      // connection between spins.
      const heartbeat = setInterval(() => write(`: ping\n\n`), HEARTBEAT_MS);
      (heartbeat as unknown as { unref?: () => void }).unref?.();

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // `no-transform` and `X-Accel-Buffering` stop Cloud Run's and
      // nginx-style proxies from buffering the stream — without them nothing
      // reaches the phone until the connection closes.
      "Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
