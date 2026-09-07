## Context

The page is a client component that fetches one endpoint (`/api/stats/checkins`) and otherwise renders static content. It carries a second, abandoned implementation commented out at the top of the file, and state left from a search/analytics feature that no longer exists.

The palette split is the substantive question. The landing page uses sage green (`#548164`, `hsl(108,33%,90%)`, Tailwind `green-100`/`green-500`); every other screen — admin, check-in, all draw skins — uses PayPal blue, and `luckydraw-settings.ts` names the family explicitly:

```
#173066  navy      #509bff  bright blue
#0463ce  PayPal    #63cbfb  sky
```

## Goals / Non-Goals

**Goals:**
- One palette across the product.
- A hero that states what the product does before it invites play.
- Remove code that cannot execute.
- Verified at phone and desktop widths.

**Non-Goals:**
- Changing `/api/stats/checkins` or any other endpoint.
- Reworking the admin portal's own styling.
- Removing the draggable cards feature — it stays, demoted from hero to supporting element.
- Adding a design-system or component library beyond the shadcn primitives already present.

## Decisions

**Adopt the PayPal blue palette.** The green is the odd one out across the whole app, and the landing page carries `paypal_logo.png` while accenting in green. Unifying is the professional choice and costs nothing elsewhere. `#0463ce` becomes the primary accent with `#173066` for headings; the counter's mint panel becomes a tinted blue surface.

**Delete rather than repair the loading guard.** `loading` has no setter anywhere in the file, so the branch is not a bug to fix but a leftover from a fetch that was removed. `checkinsLoading` already covers the only genuinely async thing on the page. `errorMessage` likewise has no setter — the error branch is unreachable and goes with it. The spec's "request fails" scenario is then satisfied structurally: a failed fetch leaves the counter at 0 and the page otherwise intact, which is already what the `catch` in `fetchCheckins` does.

**Keep the draggable cards, demote them.** They are a real feature (past events) and the copy calls them out. Moving them below the hero means the first thing a visitor reads is what the product is, not an instruction to play with it.

**Keep the commented-out first implementation deleted.** It has been dead since the current page replaced it, and it is preserved in git history.

## Risks / Trade-offs

- **The green may have been deliberate** to distinguish the marketing page from the tool. Judged unlikely given the PayPal logo sits on the same page; reversible in one commit if it reads worse in situ.
- **Removing unused state is a wide diff for a restyle.** Kept in this change because the restyle touches the same lines anyway, and leaving unreachable branches inside freshly written markup invites confusion later.
