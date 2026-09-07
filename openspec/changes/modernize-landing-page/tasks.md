## 1. Clear the dead code

- [x] 1.1 Remove the commented-out first implementation at the top of `src/app/page.tsx`.
- [x] 1.2 Remove the `loading` state and the inverted `{!loading ? ...}` guard, and the unreachable `errorMessage` branch, keeping `checkinsLoading` as the only load state.
- [x] 1.3 Remove unused state and constants: `events`, `query`, `chartData`, `chartConfig`, `totalVotes`, `router`, `PIE_COLORS`.
- [x] 1.4 Remove the imports left unreferenced by 1.2 and 1.3.

## 2. Restyle onto the PayPal palette

- [x] 2.1 Replace the green accents (`#548164`, `hsl(108,33%,90%)`, `green-100`/`green-300`/`green-500`) with the app's blues — `#0463ce` primary, `#173066` for headings, a tinted blue surface for the counter panel.
- [x] 2.2 Rebuild the top of the page as a hero: headline, supporting line, primary action, with the check-in figure presented as a stat beneath rather than above.
- [x] 2.3 Move the draggable cards below the hero.
- [x] 2.4 Constrain the page to a readable max width on desktop and keep the existing responsive padding.

## 3. Feature cards

- [x] 3.1 Give the cards in `src/components/Features.tsx` a visible surface and border consistent with the new palette, and even spacing.
- [x] 3.2 Tighten the card typography so titles and body read as a hierarchy.
- [x] 3.3 Remove the commented-out `featureList` block and heading.

## 4. Verify

- [x] 4.1 `npm run build` passes with no new type errors or unused-variable warnings from this file.
- [x] 4.2 Check the page at a phone width — no horizontal scroll, primary action reachable.
- [x] 4.3 Check the page at a desktop width — content held to a readable measure.
- [x] 4.4 Confirm the check-in skeleton shows before the figure arrives and the ticker animates on arrival.
