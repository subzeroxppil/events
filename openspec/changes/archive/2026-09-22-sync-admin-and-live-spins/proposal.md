## Why

When an admin presses Spin, only that one screen animates. A second admin with the lucky draw open sees nothing at all, and viewers on the public live page start their reel whenever the broadcast happens to reach them — anywhere from 50ms to 550ms later, and a different delay for each device. At an event with the draw on a projector and admins on their own laptops, the screens visibly disagree about when the spin starts and when the winner lands.

The same gap causes a latent visual bug: `anchorForSpin` already assumes the animation started at the server stamp, but the animation actually starts on arrival, so the reel snaps by exactly the delivery delay when it hands back to the idle drift at the end of every spin.

## What Changes

- A spin broadcast carries a **server-time start instant** (`startAt`) rather than being "start as soon as this reaches you". Every screen — admin and viewer alike — schedules its animation for that instant using the clock offset it already estimates.
- A client that receives a spin after `startAt` has passed **seeks into the animation** instead of starting from zero, so stragglers and EventSource reconnects still land on the winner at the same moment as everyone else.
- The triggering admin's Spin button goes **disabled with a spinner for the lead interval (~700ms)**, then every screen starts together.
- The admin page becomes an **SSE subscriber**, not just a publisher. It receives spins and winner updates live. Its settings panel deliberately does **not** sync.
- Any admin can press Spin. A **conditional DB claim** makes exactly one spin win when two admins press at once; the loser discards its locally picked winner and animates the winning spin as a viewer.
- All of the above applies **only when `viewOnlyEnabled` is on** ("synced" mode). With it off, the draw behaves exactly as it does today: instant spin, no broadcast, no lead, no claim. The admin UI shows which mode is active so the lead is expected rather than reading as lag.
- The winner is still recorded at the **end** of the animation, and only by the admin that won the claim. Mirroring admins never record.
- Fixes the idle-drift snap at the end of each spin, as a consequence of the animation finally starting when `anchorForSpin` says it does.

## Capabilities

### New Capabilities
- `synchronized-spin`: a spin is a scheduled event on a shared server-time timeline rather than a message acted on at arrival — covering the start instant, late-arrival catch-up, and the single-winner claim when several admins spin at once.
- `admin-live-sync`: the admin lucky draw page participates in the live stream — mirroring spins from other admins, keeping the winners list current, and surfacing whether the draw is in solo or synced mode.

### Modified Capabilities

(none — no specs exist yet)

## Impact

**Code**
- `src/lib/luckydraw-live.ts` — `SpinPayload` gains the scheduled start instant; shared helper for resolving animation progress from server time.
- `src/lib/live-hub.ts` — unchanged fan-out, but the claim means `liveSpinAt` now also acts as the in-flight marker.
- `src/app/api/admin/luckydraw/[luckydrawId]/spin/route.ts` — becomes a conditional claim that returns the granted `startAt`, or rejects when a spin is already in flight.
- `src/app/api/live/[luckydrawId]/stream/route.ts` — serves admin subscribers as well as public viewers.
- `src/app/admin/luckydraw/[luckydrawId]/use-admin-draw.ts` — subscribes to the stream, schedules its own animation against `startAt`, gates winner recording on having won the claim, keeps the solo path intact.
- `src/app/live/[luckydrawId]/use-live-draw.ts` — animation starts at `startAt` with catch-up; removes the anchor/animation mismatch.
- `src/lib/clock-sync.ts` and `src/app/api/live/[luckydrawId]/time/route.ts` — multi-sample, minimum-round-trip clock estimation. A single-sample estimate was measured putting one screen 441ms out for its whole session.
- Admin lucky draw screens (`PixelAdminScreen.tsx` and the classic/pixel/old-design pages) — mode badge and the disabled/spinner state on the Spin button.

**Data**
- No schema migration. `liveSpin` (JSON) carries the new field; `liveSpinAt` gains a second role as the in-flight marker for the claim.

**Known gaps, deliberately out of scope**
- `src/middleware.js` already guards `/admin/*` and `/api/admin/*` on the session cookie, so the claim endpoint is authenticated. The stream the admin subscribes to is the *public* one under `/api/live/*`, which is gated on `viewOnlyEnabled` — the same condition under which admin mirroring is wanted — so no new gating is introduced here.
- Recording the winner at spin end means a browser crash mid-animation still loses that winner. This matches today's behaviour and is not changed here.
