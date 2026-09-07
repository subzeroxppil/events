# Events Portal

| Deployment | URL |
| --- | --- |
| **GCP Cloud Run** *(this repo's own pipeline)* | https://pp-events-alfc5lzdla-as.a.run.app |
| Cloud Run (older, separate project) | https://pp-events-609469738206.asia-southeast1.run.app |
| Vercel | https://pp-events.vercel.app |

> **Cloud deployment:** Pushing to `master` deploys to the Cloud Run service at
> the top of that table — see [Deployment](#deployment). The other two are
> older pipelines: the Vercel one only deploys when the commit author is the
> `subzeroxppil` GitHub user, and the second Cloud Run service lives in a
> project this repo does not control.

## Lucky draw URLs

Replace `<id>` with the lucky draw's id — the number in the address bar on the
admin draw screen.

Every skin below runs the **same draw**: the same reel, timing, sounds, winner
recording and live sync. The choice is purely a look, so it is safe to present
from any of them.

### Admin draw screen (login required)

The screen the draw is run from.

| Skin | URL |
| --- | --- |
| **Pixel — Handheld** *(default)* | `/admin/luckydraw/<id>` |
| Pixel — Arcade Night | `/admin/luckydraw/<id>/pixel` &nbsp;·&nbsp; `/admin/luckydraw/<id>?ui=pixel` |
| Pixel — Quest | `/admin/luckydraw/<id>?ui=pixel-quest` |
| Classic | `/admin/luckydraw/<id>/classic` |
| Old design | `/admin/luckydraw/<id>/old-design` |

`?ui=` works on both `/admin/luckydraw/<id>` and `/admin/luckydraw/<id>/pixel`;
they differ only in which pixel skin a bare URL renders.

> ⚠️ **`/old-design` does not drive the view-only pages.** It predates the
> feature and has no Share toggle and no spin broadcast, so pressing Spin there
> leaves every watching phone sitting on the idle reel. Use any of the other
> admin URLs if people are watching along.

### View-only page (public, no login)

For the audience to watch on their own phones.

| Skin | URL | Look |
| --- | --- | --- |
| **Pixel — Handheld** *(default)* | `/live/<id>` &nbsp;·&nbsp; `?ui=pixel-lcd` | 8-bit portable LCD: navy pixels on a pale screen |
| Pixel — Arcade Night | `/live/<id>?ui=pixel` | 8-bit deep-space cabinet: starfield, CRT scanlines |
| Pixel — Quest | `/live/<id>?ui=pixel-quest` | 8-bit quest log: tiled floor, double-ruled frames |
| Aurora | `/live/<id>?ui=aurora` | Light PayPal gradient, phone-first |
| Midnight | `/live/<id>?ui=midnight` | Dark stage, spotlight on the winning row — for a dim hall |
| Arcade | `/live/<id>?ui=arcade` | Reel inside a machine cabinet on saturated PayPal blue |

An unrecognised `?ui=` value falls back to the default.

The page 404s until the draw is shared: open the admin draw screen, press
**Share**, and turn on the view-only link. Turning it back off drops every open
phone to a "not live" screen.

Everyone watching sees the **same reel in the same position**, whenever they
joined and whatever size their screen is — the idle reel is built once on the
server and the scroll position is derived from server time rather than from
each phone's own clock.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BASE_URL
JWT_SECRET
```

## Getting Started for local development

```bash
npm install
npm run dev
```

## How to make changes to production database

**Step 1: make your changes to the schema at `prisma/schema.prisma`**

**Step 2: Create the new migration file at `prisma/migration`**

```bash
npx prisma migrate diff \
  --from-url "direct_url" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/custom_migrations/migration_name.sql
```

💡 Note: replace "migration_name" and "direct_url"

**Step 3: Remove the irrelevant sql in the new migration file**

**Step 4: Apply the sql file to supabase console**

## Deployment

Pushing to `master` builds and deploys to Cloud Run automatically, via
`.github/workflows/deploy.yml` and `cloudbuild.yaml`.

```
push to master
      │
      ▼
GitHub Actions ──OIDC token──▶ Workload Identity Federation
                                      │  (no stored credentials)
                                      ▼
                              Cloud Build (cloudbuild.yaml)
                                      │  reads every value from Secret Manager
                                      ▼
                              Artifact Registry ──▶ Cloud Run
```

**Project:** `iron-haiku-507914-i0` · **Region:** `asia-southeast1` ·
**Service:** `pp-events`

### Why it is set up this way

- **No repository secrets.** GitHub authenticates by Workload Identity
  Federation: it mints a short-lived OIDC token, and GCP is configured to trust
  tokens from `subzeroxppil/events` only. Nothing long-lived is stored on
  either side, and no admin rights on the repository were needed to set it up.
- **Every value lives in Secret Manager**, including the three `NEXT_PUBLIC_*`
  ones. Those are not secret — Next inlines them into the client bundle — but
  that inlining happens at *build* time, so they must be build arguments rather
  than Cloud Run environment variables. Keeping them next to the real secrets
  means there is one place to change any value.

### Changing a configuration value

```bash
printf '%s' 'new-value' | gcloud secrets versions add DATABASE_URL \
  --data-file=- --project=iron-haiku-507914-i0
```

Then re-run the workflow (or push) so the change is picked up. Changing a
`NEXT_PUBLIC_*` value requires a rebuild, not just a restart.

### Cost

The service scales to zero, so it costs essentially nothing between events:

| Setting | Value | Why |
| --- | --- | --- |
| `min-instances` | 0 | Nothing runs, nothing is billed, when idle |
| `max-instances` | 5 | Caps what a runaway loop or crawler can spend |
| `concurrency` | 250 | The live page holds one near-idle SSE connection per viewer, so one instance can serve a whole hall — and `live-hub` runs one DB poller per draw *per instance*, so fewer instances also means less database load |
| CPU throttling | on | CPU billed only while a request is in flight; an open SSE stream counts as in-flight |
| `timeout` | 3600s | The SSE stream is long-lived; the 5-minute default would cut viewers off mid-event |

### Deploying by hand

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --project=iron-haiku-507914-i0 --region=asia-southeast1 \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```
