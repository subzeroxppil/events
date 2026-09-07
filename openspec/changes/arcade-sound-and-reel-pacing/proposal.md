## Why

Three corrections and one addition, all following from the same misreading.

"Make the spin slower" was implemented as a longer spin — 14.5s stretched to 18s. That is not the same thing. How fast the reel *looks* is distance over time; stretching the time made the same journey take longer without making any single moment of it slower, so the names still blurred past and the spin merely dragged. The duration has to go back to the original 13s and the motion has to be slowed a different way.

The site header was tinted blue to blend with the landing page's hero, but that colour followed the user into the admin portal, where there is no hero to blend with and the original white is correct. Its bottom border is also drawn at rest, when there is nothing yet to separate the bar from.

Separately, the draw's mp3 soundtrack is the only one on offer. A synthesised arcade alternative is worth having as an opt-in, without disturbing the default.

## What Changes

- The spin duration returns to 13000ms, matching the original screen's `spinningTime={13}`, and `easeExponent` returns to 4.
- The reel's journey shortens from 3–4 rotations to 1–2, which halves the rate names pass at while the spin still takes exactly as long as it always did.
- The header is white everywhere except the landing page, where the blue tint has a hero to blend with.
- The header's bottom border appears only once the page has scrolled.
- **New:** `?sound=arcade` on either draw screen swaps the mp3s for a synthesised retro arcade soundtrack — a reel that ticks in time with the animation, and a chiptune fanfare on a win. Default URLs are untouched.

## Capabilities

### New Capabilities

- `arcade-sound-mode`: the opt-in synthesised soundtrack and how a screen selects it.

### Modified Capabilities

- `luckydraw-audio`: the spin's pacing requirement changes, and the audio requirements gain an alternative source.

## Impact

- `src/lib/luckydraw-settings.ts` — duration, easeExponent, rotation count
- `src/components/SiteHeader.tsx` — colour by route, scroll-aware border
- New `src/lib/arcade-sound.ts`
- `use-admin-draw.ts`, `use-live-draw.ts`, `live/[luckydrawId]/page.tsx` — mode plumbing
- `README.md` — the variant URLs
- No schema, API or broadcast-payload changes.
