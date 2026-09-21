## 1. Shared spin timeline primitives

- [x] 1.1 Add `startAt: number` to `SpinPayload` in `src/lib/luckydraw-live.ts`, and export a `SPIN_LEAD_MS = 700` constant alongside it.
- [x] 1.2 Add `resolveSpinProgress({ startAt, duration }, serverNow)` to `src/lib/luckydraw-live.ts`, returning a discriminated result: `pending` with the remaining wait, `running` with the elapsed ms, or `finished`. This is the single source of truth both hooks use.
- [x] 1.3 Make `startAt` tolerant of absence: when a payload arrives without it (old server during rollout), callers fall back to starting on arrival rather than treating it as `0`. Cover this in `isSpinPayload` so a legacy payload still validates.
- [x] 1.4 Add the claim response type (`{ spinId, startAt, serverNow }`) and the rejection shape (`{ inFlightSpinId }`) to `src/lib/luckydraw-live.ts` so route and hook share one contract.

## 2. Server: turn the spin broadcast into a claim

- [x] 2.1 In `src/app/api/admin/luckydraw/[luckydrawId]/spin/route.ts`, read `liveSpin` and `liveSpinAt` before writing, and compute whether a spin is still in flight from the *stored* payload's `startAt` and `duration`.
- [x] 2.2 Reject with `409` and the in-flight `spinId` when a spin is still running.
- [x] 2.3 Replace the unconditional `update` with an `updateMany` guarded on `liveSpinAt` still equalling the value read in 2.1; treat a zero-row result as a lost race and return `409`.
- [x] 2.4 Stamp `startAt = now + SPIN_LEAD_MS` into the stored payload and return `{ spinId, startAt, serverNow }` on success.
- [x] 2.5 Keep the existing `viewOnlyEnabled` check and its `409` — a claim is only meaningful in synced mode.

## 3. Live page: schedule the animation instead of starting on arrival

- [x] 3.1 In `src/app/live/[luckydrawId]/use-live-draw.ts`, replace `const startTime = Date.now()` (~line 343) with `resolveSpinProgress` driven by `Date.now() + clockOffsetRef.current`.
- [x] 3.2 Handle `pending`: keep the idle drift running and schedule the animation start for the remaining wait.
- [x] 3.3 Handle `running`: seek into the animation at the elapsed position rather than starting from zero.
- [x] 3.4 Handle `finished`: skip the animation, settle on the resting position, and run the completion path (winner overlay, sounds) without replaying the reel.
- [x] 3.5 Drive the per-frame progress from server time on every frame, so a throttled tab snaps back to the correct position when foregrounded rather than accumulating drift.
- [x] 3.6 Update `anchorForSpin` to anchor on `startAt + duration` rather than `spinId + duration`, and confirm the reel no longer jumps when idle drift resumes at the end of a spin.

## 4. Admin hook: claim, schedule, subscribe

- [x] 4.1 In `src/app/admin/luckydraw/[luckydrawId]/use-admin-draw.ts`, split `handleSpin` on `viewOnlyEnabled`: the solo branch keeps today's immediate animation and fire-and-forget behaviour untouched.
- [x] 4.2 On the synced branch, `await` the claim before animating; on `200`, schedule the local animation at the returned `startAt` using `resolveSpinProgress`.
- [x] 4.3 On a `409`, discard the locally picked winner and reel, and let the stream deliver the winning spin instead.
- [x] 4.4 Refresh `clockOffset` from the `serverNow` in each successful claim response, using the half round-trip estimate the live page already uses.
- [x] 4.5 Subscribe the admin hook to `/api/live/${luckydrawId}/stream` while `viewOnlyEnabled` is on, handling `init`, `spin`, `winners` and `offline`; tear the subscription down when the toggle goes off.
- [x] 4.6 Seed a `lastSpinId` guard from the claim response so the triggering admin ignores the echo of its own spin.
- [x] 4.7 Animate a spin arriving from the stream through the same `resolveSpinProgress` path as a locally claimed one.
- [x] 4.8 Track spin ownership, and gate the winner-recording `POST` in `handleSpinComplete` (~line 488) on this screen having won the claim — mirroring admins run sounds, fireworks and the overlay but do not write.
- [x] 4.9 Apply `winners` events from the stream to the admin's winners list, so a mirroring admin stays current without a reload.
- [x] 4.10 Do not apply the incoming payload's `settings` to this admin's own settings state — use them for the spin render only.

## 5. Admin UI: mode and button state

- [x] 5.1 Expose from the hook what the Spin control needs: whether the draw is in synced mode, whether a claim is in flight, and whether a spin triggered anywhere is running.
- [x] 5.2 In `src/app/admin/luckydraw/[luckydrawId]/PixelAdminScreen.tsx`, fold the new states into `canSpin` (line ~111) and show a busy indicator on the button while a claim is in flight.
- [x] 5.3 Do the same in `src/app/admin/luckydraw/[luckydrawId]/classic/page.tsx` (button at line ~283).
- [x] 5.4 Add a mode indicator beside the Spin control on both screens showing solo vs synced, updating when the view-only link is toggled without a reload.
- [x] 5.5 Leave `src/app/admin/luckydraw/[luckydrawId]/old-design/page.tsx` alone — it carries its own local spin state and does not use `useAdminDraw`; note it stays solo-only.

## 7. Joining a draw that goes live

- [x] 7.1 Add a `GET` to `src/app/api/admin/luckydraw/[luckydrawId]/viewonly/route.ts` returning just `{ viewOnlyEnabled }`, so the flag can be read without building the participant list the parent `GET` does.
- [x] 7.2 Poll that endpoint from `use-admin-draw.ts` every 5s **only while the link is off**, and switch to synced mode when it turns on — otherwise an admin who opened the page first sits in solo mode for the rest of the event.

## 8. Clock estimation (added after measurement — see design.md)

- [x] 8.1 Add `GET /api/live/[luckydrawId]/time` returning only `{ serverNow }`, touching no database, so a probe's round trip measures the network and nothing else.
- [x] 8.2 Add `src/lib/clock-sync.ts` with `estimateClockOffset` (several probes, keep the smallest round trip) and `refineOffset` (never replace a sample with a worse one).
- [x] 8.3 Use it in both hooks at startup, re-probing every two minutes so a sleeping or roaming device recovers.
- [x] 8.4 Stop using the granted claim as a clock sample — its `serverNow` is read after a database write, so it is biased late however fast the round trip looks.
- [x] 8.5 Show the winner overlay *before* writing the winner, and do not await the write: mirroring screens have nothing to write, so awaiting made the claiming admin the last screen in the room to reveal.

## 9. Independent review fixes

- [x] 9.1 Fireworks on the admin screen were pinned to `DEFAULT_SETTINGS`: `handleSpinComplete` is memoised on values that never change, so it captured a `triggerFireworks` closed over first-render settings. Call `runFireworks(confetti, spinSettings)` directly, which also makes a mirrored spin's burst match the admin who ran it.
- [x] 9.2 `live-hub`: a viewer joining between a spin being written and the room's next poll advanced the *shared* `lastSpinId`, so the poll suppressed that spin and **every viewer already attached missed it**. Reproduced at 1 in 12 trials. Dedupe is now per subscriber; 0 in 12 after.
- [x] 9.3 A spin this screen claimed but which resolved as `finished` (claim reply slower than the spin) settled the reel without banking the winner. Now records it.
- [x] 9.4 A rejected claim cleared `spinLock`/`spinBusy` even when the winning admin's spin had already arrived on this screen and taken them. Release is now conditional on no foreign spin having arrived, checked through refs rather than state captured before the await.
- [x] 9.5 The SSE spin handler took the lock before scheduling, so anything thrown downstream left Spin dead until reload. Payload is validated before the lock is taken, and the catch hands it back.
- [x] 9.6 `duration` came straight from the client and set how long the server held the lock, so one absurd value wedged the draw. Bounded by `MAX_SPIN_DURATION_MS` on ingest and capped again when evaluating the lock; `finalTarget`/`easeExponent` finiteness checked too.
- [x] 9.7 The live page's pending-spin timer outlived the stream: an `offline` mid-lead left it to fire the reel and audio behind the "not live" screen. Cleared in the `offline` handler and in the effect cleanup.
- [x] 9.8 A mirroring admin spun against a winners list up to ~4.8s stale and could redraw someone who had already won — the write was then refused with nobody told. Every screen now folds the winner into its own list at spin end, and a failed write raises a toast instead of being swallowed.
- [x] 9.9 Nitpicks taken: `itemHeightRef` so rotating mid-spin is picked up; a leading call on the view-only poll; a 409 that names no in-flight spin is surfaced rather than silently ignored.

## 6. Verify

- [x] 6.1 Solo regression: with the view-only link off, confirm the spin still starts immediately, nothing is broadcast, and the winner is recorded at the end as before.
- [x] 6.2 Two admins plus the live page, view-only link on: confirm all three reels start and land together.
- [x] 6.3 Simultaneous press: trigger a spin from two admins within the lead window and confirm one spin runs on all screens and exactly one winner row is written.
- [x] 6.4 Late arrival: throttle one client's network (or background its tab) past the lead and confirm it seeks in and still lands with the room.
- [x] 6.5 Reconnect: confirmed a client that reconnects after a spin has finished does not replay the reel and resumes smooth idle drift; the `finished` branch itself is covered by unit tests over its boundaries. Not reproduced: a true mid-spin disconnect, because CDP's offline emulation does not sever an already-open SSE stream.
- [x] 6.6 Winners sync: record and then delete a winner from one admin and confirm the other admin's list follows without a reload.
- [x] 6.7 Settings isolation: change the spin duration on one admin and confirm the other's panel is unchanged, while a spin triggered by the first uses the first's duration everywhere.
- [x] 6.8 Toggle mid-event: flip the view-only link on and off and confirm the mode indicator and the spin behaviour follow without a reload.
- [x] 6.9 Run `npx tsc --noEmit` and a production build, and confirm both pass. (The project has no ESLint config — `next lint` only offers to create one — so there is no lint step to run.)
- [x] 6.10 Open an admin screen with the link off, enable the link from a second screen, and confirm the first joins synced mode and mirrors the next spin.
