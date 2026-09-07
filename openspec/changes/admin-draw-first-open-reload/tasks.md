## 1. Generalise the hook

- [x] 1.1 Move `use-first-open-reload.ts` from `src/app/live/[luckydrawId]/` to `src/lib/`.
- [x] 1.2 Replace the hardcoded `STORAGE_PREFIX` with a required prefix argument, keeping the write-flag-before-reload ordering and the bail-out when storage throws.
- [x] 1.3 Update the doc comment so it describes both draw screens rather than only the live page.

## 2. Wire up both callers

- [x] 2.1 Update `src/app/live/[luckydrawId]/page.tsx` to import from the new location and pass the `live-reloaded:` prefix, so its behaviour is unchanged.
- [x] 2.2 Call the hook from `use-admin-draw.ts` with an `admin-reloaded:` prefix, keyed by the draw id, placed so it runs on mount before the participants fetch.

## 3. Verify

- [x] 3.1 `npm run build` passes with no new type errors.
- [ ] 3.2 Open `/admin/luckydraw/<id>` in a fresh tab and confirm exactly one reload, then none on subsequent navigations in that tab. *(Needs an admin login — not exercised here.)*
- [x] 3.3 Confirm `/live/<id>` still reloads exactly once and no more.
- [ ] 3.4 Confirm opening the admin screen and the live page for the same draw in the same browser each reload independently. *(Needs an admin login.)*
- [x] 3.5 Confirm `/old-design` is unaffected — it does not use the shared hook.
