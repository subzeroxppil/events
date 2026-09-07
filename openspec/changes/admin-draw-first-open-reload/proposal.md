## Why

The live page already reloads itself once the first time a tab opens a given draw (`use-first-open-reload.ts`), because a cold arrival — a QR scan, a link from a chat app, a tab restored from the background — is the load whose layout and connection state are least predictable. The admin draw screen is opened the same way on the day of an event, from a bookmark or a pasted link on a presentation machine, and gets no such treatment. Giving it the same one-shot refresh makes the screen the draw is actually run from as reliable as the audience's.

## What Changes

- The admin draw screen reloads once, the first time a tab opens a given draw, using the same session-flag mechanism as the live page.
- The behaviour applies to every admin skin that shares `use-admin-draw.ts` — the default handheld screen, `/pixel` and `/classic`.
- `/old-design` is left alone; it does not use the shared hook.
- The existing reload hook is generalised so both pages use one implementation rather than two copies.

## Capabilities

### New Capabilities

- `draw-screen-first-open-reload`: the one-shot refresh a draw screen performs when a tab first opens it.

### Modified Capabilities

<!-- None: no existing specs yet. -->

## Impact

- `src/app/live/[luckydrawId]/use-first-open-reload.ts` — moved to a shared location and given a configurable storage prefix
- `src/app/admin/luckydraw/[luckydrawId]/use-admin-draw.ts` — calls the hook
- `src/app/live/[luckydrawId]/page.tsx` — import path
- No API, schema or payload changes.
