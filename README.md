# Events Portal

https://pp-events-609469738206.asia-southeast1.run.app | https://pp-events.vercel.app

> **Cloud deployment:** This project is hosted on both GCP & vercel. Changes are deployed automatically whenever there is a commit to main branch. But for changes to be deployed to vercel, the commit has to be made by subzeroxppil github user

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
they differ only in which pixel skin a bare URL renders. Each pixel screen has
a **Classic UI** link back to the classic one.

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
