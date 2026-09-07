## Why

The lucky draw is presented on stage, so its sound is not a detail — it is most of the drama. Three defects currently undercut it:

1. **The spin goes silent before it lands.** `spin4.mp3` is 10.89s long and playback starts at `currentTime = 1`, leaving 9.89s of audio for a 14.5s reel. The last ~4.6 seconds of every spin — the most tense part — plays in silence.
2. **The live page's Enter button plays the winning sound.** The audio-unlock loop `await audio.play()` then pauses; because `play()` resolves only once playback has begun, each clip audibly bursts, including `celebrate.wav` and `applause1.mp3`. Every viewer hears a snippet of the win before the draw has even started.
3. **The reel is too fast** to read on both the admin screen and the audience's phones.

These are one change because they are coupled: slowing the reel widens the silent tail, so the audio fix and the pacing change cannot land separately without a worse intermediate state.

## What Changes

- The spin sound loops for as long as the reel is turning, so a spin of any duration is scored end to end.
- The live page's Enter unlock primes the audio silently, so no clip is audible during the unlock.
- Pressing Enter on the live page plays a short retro arcade "game start" chime, synthesised with the Web Audio API rather than shipped as an asset.
- The default spin slows from 14.5s to 18s and its easing softens, on both the admin screen and the live page (the live page inherits the admin's timing through the existing spin broadcast).
- Chrome the audience does not need is removed from the draw screens: the "Classic UI" link on the pixel admin screen, and — on all four live skins — the running "drawn" count and the previous-winner readout along the bottom. The winner is announced by the overlay when it happens; a standing list of who already won competes with the reel for attention on a phone.

## Capabilities

### New Capabilities

- `luckydraw-audio`: what the draw screens play, when, and how sound is unlocked on mobile.

### Modified Capabilities

<!-- None: no existing specs yet. -->

## Impact

- `src/app/admin/luckydraw/[luckydrawId]/use-admin-draw.ts` — spin loop, fade, timing
- `src/app/live/[luckydrawId]/use-live-draw.ts` — spin loop, Enter unlock, start chime
- `src/lib/luckydraw-settings.ts` — `duration`, `easeExponent` defaults
- New `src/lib/retro-chime.ts` — Web Audio start chime
- No schema, API or payload changes; `SpinPayload` already carries `duration` and `easeExponent`.
