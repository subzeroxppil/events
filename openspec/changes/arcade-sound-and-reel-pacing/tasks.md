## 1. Restore the duration, slow the motion

- [x] 1.1 Set `duration` back to 13000 and `easeExponent` back to 4.
- [x] 1.2 Cut `minSpins`/`maxSpins` from 3/4 to 1/3 so the reel travels roughly half as far in the same time.
- [x] 1.3 Confirm numerically that the reel is slower than both the original and the 18s attempt.
- [x] 1.4 Confirm the looping spin sound still covers a 13s spin, and that the fade still lands on the winner.

## 2. Header

- [x] 2.1 Make the header white everywhere except the landing page.
- [x] 2.2 Show the bottom border only once the page has scrolled, toggling its colour rather than the border itself so the height never shifts.
- [x] 2.3 Handle a tab restored mid-scroll by reading `scrollY` on mount.

## 3. Arcade soundtrack

- [x] 3.1 Add `src/lib/arcade-sound.ts`: a lookahead-scheduled ticking reel whose rate decays with the spin, and a chiptune win fanfare.
- [x] 3.2 Read `?sound=arcade` on the admin screen and swap the spin and win sounds.
- [x] 3.3 Read `?sound=arcade` on the live page, per viewer rather than broadcast.
- [x] 3.4 Unlock the AudioContext from the same gesture that primes the mp3s, and route the mute button to the synth's master gain.
- [x] 3.5 Skip the mp3 fade-out in arcade mode, since the synth tapers itself.

## 4. Live page polish

- [x] 4.1 Give each skin a `chrome` palette for the states that exist before content does.
- [x] 4.2 Replace the deep-blue spinner with a skeleton shaped like the welcome screen, in the skin's own colours.
- [x] 4.3 Fade the welcome in, and lift-and-fade it out on Enter while the stage settles from 1.04 to 1.
- [x] 4.4 Paint the not-live and error states in the skin's palette too, instead of white text on a fixed blue.

## 5. Verify

- [x] 5.1 `npm run build` passes.
- [x] 5.2 Render the arcade reel and fanfare through an `OfflineAudioContext` and confirm both are audible, that the reel decelerates, and that the fanfare does not clip.
- [x] 5.3 Confirm the header is white with no border at rest, and grows a border once scrolled.
- [x] 5.4 Confirm the loading skeleton renders in the skin's palette with no deep blue.
- [x] 5.5 Sample the Enter transition and confirm the welcome fades and lifts while the stage settles, then unmounts.
- [x] 5.6 Confirm `?sound=arcade` loads with a clean console, and that a non-pixel skin still renders.
- [ ] 5.7 Listen to the arcade soundtrack through a real spin on the admin screen. *(Needs an admin login — not exercised here.)*
