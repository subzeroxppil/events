## 1. Spin audio covers the whole spin

- [x] 1.1 In `use-admin-draw.ts`, set `loop = true` on the spin sound when a spin starts, and clear it when the fade-out begins so the clip cannot restart under the fade.
- [x] 1.2 Make the same change in `use-live-draw.ts`'s `runSpin`, so viewers hear the identical bed.
- [x] 1.3 Confirm both `handleSpinComplete` paths still stop the spin sound, reset `currentTime`, restore `volume` to 1, and clear `loop` before the celebration sounds play.

## 2. Silent unlock and start chime on the live page

- [x] 2.1 Rewrite the `enter()` unlock in `use-live-draw.ts` to mute each clip before `play()`, then pause, reset `currentTime`, and unmute — and to prime the clips concurrently rather than sequentially.
- [x] 2.2 Add `src/lib/retro-chime.ts` exporting a `playStartChime()` that builds a short ascending square-wave arpeggio through the Web Audio API and resolves silently if `AudioContext` is unavailable.
- [x] 2.3 Call `playStartChime()` from `enter()` after unlocking, skipping it when the page is muted.

## 3. Slow the reel

- [x] 3.1 In `luckydraw-settings.ts`, change `DEFAULT_SETTINGS.duration` to 18000 and `easeExponent` to 3.2.
- [x] 3.2 Check the fade window still lands on the winner: with an 18s spin, `soundFadeStartPercent` 0.65 begins the fade at 11.7s and `soundFadeDuration` 0.35 runs it to the end.

## 4. Strip chrome from the draw screens

- [x] 4.1 Remove the "Classic UI" link from `PixelAdminScreen.tsx`.
- [x] 4.2 Remove the `DRAWN <n>` counter from the live `PixelStage` header, keeping `PLAYERS`.
- [x] 4.3 Remove the previous-winner footer from all four live stages (Pixel, Aurora, Midnight, Arcade), and drop the imports and locals it left unused.
- [x] 4.4 Move the bottom safe-area inset onto each stage's reel container, since the removed footer was what carried it — without this the reel runs under the iPhone home indicator.

## 5. Verify

- [x] 5.1 `npm run build` passes with no new type errors.
- [x] 5.2 Confirm in a real browser that the chime schedules and closes cleanly, and that the muted prime plays, stays muted, pauses and restores unmuted — the exact sequence the Enter bug came from.
- [x] 5.3 Confirm all four live skins render with no drawn-count and no previous-winner footer, on a phone viewport and with a clean console.
- [ ] 5.4 Run a spin on `/admin/luckydraw/<id>` and confirm sound is continuous from press to winner, then celebration plays. *(Needs an admin login and a real draw — not exercised here.)*
- [ ] 5.5 Confirm the admin and live reels stay visually in step across the slower spin. *(Same.)*
