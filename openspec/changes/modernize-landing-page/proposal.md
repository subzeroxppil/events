## Why

The landing page is the first thing anyone sees, and it currently reads as a prototype: a sage-green palette that belongs to no other screen in the app, a hero built from a draggable-card toy and a bare check-in counter, and copy that instructs the visitor to "try dragging the cards around". Behind it, the loading guard is inverted (`loading` starts `true` and is never set `false`, so `{!loading ? <LoadingSpinner/> : ...}` always takes the content branch and the spinner is unreachable) and roughly a dozen pieces of state and imports are unused.

## What Changes

- The page is restyled onto the PayPal-blue palette the rest of the app already uses, replacing the green accents.
- The hero is rebuilt as a proper hero: headline, supporting line, and a clear primary action, with the check-in counter presented as a stat rather than as the largest element on the page.
- The feature cards gain real visual structure — consistent card treatment, spacing, and typography — instead of borderless grey blocks.
- The dead loading guard is removed, along with the unused state (`events`, `query`, `chartData`, `chartConfig`, `totalVotes`, `router`, `PIE_COLORS`) and the imports that only those referenced.
- Layout is verified at phone and desktop widths.

## Capabilities

### New Capabilities

- `landing-page`: what the public landing page presents and how it behaves while its data loads.

### Modified Capabilities

<!-- None: no existing specs yet. -->

## Impact

- `src/app/page.tsx` — restyle, remove dead guard and unused state
- `src/components/Features.tsx` — card treatment
- No API, schema or auth changes; `/api/stats/checkins` is consumed exactly as before.
