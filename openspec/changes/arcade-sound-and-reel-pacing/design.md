## Context

The reel travels `floor(spins) * spinnerItemCount + winnerIndex` rows in `duration` ms, eased by `rouletteEasing`. Only `finalTarget`, `duration` and `easeExponent` are broadcast, so the admin's numbers reach every viewer without a protocol change.

Measured peak row rates, at 200 items per rotation:

```
ORIGINAL      13.0s, 3-5 spins, ease 4     119 rows/s
before this   14.5s, 3-4 spins, ease 4      93 rows/s
the 18s try   18.0s, 3-4 spins, ease 3.2    75 rows/s
this change   13.0s, 1-2 spins, ease 4      58 rows/s
```

## Goals / Non-Goals

**Goals:**
- The original 13s spin, and a reel that genuinely moves more slowly.
- A white header in the admin portal; a border only when it is doing something.
- An arcade soundtrack that changes nothing for anyone who does not ask for it.

**Non-Goals:**
- Changing the broadcast payload, the schema, or any API.
- Replacing the mp3s on the default screens.
- Touching `/old-design`.

## Decisions

**Slow the reel by shortening its journey, not by lengthening the spin.** Perceived speed is distance over time. Stretching `duration` to 18s lowered the *average* rate but left the spin feeling drawn out, because no individual moment got slower — the names still blurred past, just for longer. Cutting the rotations from 3–4 to 1–2 halves the rows travelled, so every moment is slower while the spin lasts exactly as long as it always did. The numbers above confirm it: 58 rows/s against the original 119, and lower even than the 18s attempt.

Rotations are the right lever rather than `spinnerItemCount`, because the item count is also how much of the participant pool is visible on the reel; reducing it would make names repeat more often.

**The mp3 loop is what makes reverting to 13s safe.** `spin4.mp3` gives 9.89s of usable audio, so a 13s spin would have gone silent for its last 3 seconds — the original bug — were the clip not now looping.

**The header's colour follows the route; its border follows the scroll.** The blue tint exists to blend with the landing page's hero, and there is no hero anywhere else, so the admin portal gets the original white. The border is what separates a sticky bar from content passing under it; at the top of the page there is nothing to separate from. It is toggled by colour rather than by adding and removing `border-b`, so the bar never changes height by a pixel.

**The arcade soundtrack is synthesised, and its reel decelerates.** Same reasoning as the start chime — nothing to download for a hall of phones on venue wifi — plus something no recording can do: the tick rate is driven by the same ease-out shape as the animation, falling from 24 clicks/sec to 2.5, so the clicks slow as the names do. Blips are scheduled ahead on the AudioContext clock rather than fired from `setInterval`, because timer jitter is audible as an unsteady reel.

**The mode is read per screen, never broadcast.** Which sound someone hears is a property of the URL they opened, so an admin can present with it without imposing it on the audience, and a viewer can choose it independently.

**The live page's pre-content states are painted in the selected skin's palette.** A spinner on a fixed deep blue meant arriving was two jarring changes — the colour goes, then the layout appears. A skeleton in the skin's own colours, shaped like the welcome screen, makes the load a continuation: when the data lands, the only thing that changes is that the blocks become words.

**The stage is mounted beneath the welcome from the start.** It is what the welcome dissolves to reveal, so it has to be there and already drifting. It sits at scale 1.04 and settles to 1 as the welcome lifts away, which reads as being let through rather than as a cut.

## Risks / Trade-offs

- **1–2 rotations is a short journey.** With a strong ease-out the final second is a crawl — but that was already true at 3–4 rotations, where the last 10% of the spin covered well under one row. No regression, and the admin settings sheet can raise the rotations live.
- **The synthesised sounds cannot be auditioned outside a browser.** Verified by rendering the exact synthesis through an `OfflineAudioContext` and measuring: the reel is audible and decelerates 24 → 6 → 2.5 Hz, the fanfare peaks at 0.53 with zero clipped samples.
- **`motion` is used where the rest of the app imports `framer-motion`.** `motion` is the declared dependency; `framer-motion` is only present transitively, so the older imports are the ones on shaky ground.
