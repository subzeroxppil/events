## Context

`use-first-open-reload.ts` sits under `src/app/live/[luckydrawId]/` and is written for that page: its `STORAGE_PREFIX` is the literal `"live-reloaded:"`. The mechanism itself is page-agnostic — set a `sessionStorage` flag keyed by URL, then reload; on the second load the flag is present and nothing happens. It sets the flag *before* reloading and bails out entirely if storage throws, which is what keeps it from looping.

All four admin skins that broadcast (`page.tsx`, `/pixel`, `/classic`) route through `use-admin-draw.ts`. `/old-design` has its own standalone implementation and is excluded.

## Goals / Non-Goals

**Goals:**
- The admin screen gets the same cold-start reliability as the live page.
- One implementation, not two copies that can drift.

**Non-Goals:**
- Changing when or how often the live page reloads.
- Touching `/old-design`.
- Adding a reload to any screen other than the draw screens.

## Decisions

**Move the hook to `src/lib/` and take the prefix as an argument.** The existing implementation is already correct and well-reasoned; the only thing tying it to the live page is a hardcoded string. Distinct prefixes (`live-reloaded:` and `admin-reloaded:`) keep the two screens' flags independent, so an admin who has the live page open in another tab of the same browser does not suppress the admin screen's reload. Keying by URL on top of the prefix means each draw is tracked separately, as it already is.

**Hook it into `use-admin-draw.ts`, not each skin.** All the broadcasting skins already delegate every behaviour to that hook precisely so they cannot drift; the reload belongs in the same place. `/old-design` is untouched, which is consistent with it already being documented as the outlier.

**Reload before the draw data is fetched, not after.** The hook runs its effect on mount and returns immediately if the flag is set, so on the load that matters — the second one — it costs nothing. Reloading first also means the discarded first load does not waste a participants query.

## Risks / Trade-offs

- **An admin who has not seen this before may read the flash as a bug.** It is one reload on the very first open of a tab, matching what the live page already does, and it happens well before anyone presses Spin.
- **A reload discards unsaved settings-sheet state.** The settings live in component state and are not persisted, but the reload fires on mount — before an admin has had the chance to adjust anything.
