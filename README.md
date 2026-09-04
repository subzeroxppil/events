# Events Portal

https://pp-events-609469738206.asia-southeast1.run.app | https://pp-events.vercel.app

> **Cloud deployment:** This project is hosted on both GCP & vercel. Changes are deployed automatically whenever there is a commit to main branch. But for changes to be deployed to vercel, the commit has to be made by subzeroxppil github user.

## Lucky draw URLs

Replace `<id>` with the lucky draw's id — the number in the address bar on the
admin draw screen.

### View-only page (public, no login)

For the audience to watch on their own phones. Every skin runs the identical
draw — same reel, timing, sounds and live sync — so the choice is purely a
look. An unrecognised `?ui=` value falls back to Aurora.

| Skin | URL | Look |
| --- | --- | --- |
| Aurora *(default)* | `/live/<id>` | Light PayPal gradient, phone-first |
| Midnight | `/live/<id>?ui=midnight` | Dark stage, spotlight on the winning row — for a dim hall |
| Arcade | `/live/<id>?ui=arcade` | Reel inside a machine cabinet on saturated PayPal blue |
| Pixel — Arcade Night | `/live/<id>?ui=pixel` | 8-bit deep-space cabinet: starfield, CRT scanlines |
| Pixel — Handheld | `/live/<id>?ui=pixel-lcd` | 8-bit portable LCD: navy pixels on a pale screen |
| Pixel — Quest | `/live/<id>?ui=pixel-quest` | 8-bit quest log: tiled floor, double-ruled frames |

The page 404s until the draw is shared: open the admin draw screen, press
**Share**, and turn on the view-only link. Turning it back off drops every
open phone to a "not live" screen.

### Admin draw screen (login required)

The screen the draw is actually run from. Every URL here runs the same draw —
the same spins, winner recording and broadcast — so it is safe to present from
any of them.

| Skin | URL |
| --- | --- |
| Classic *(default)* | `/admin/luckydraw/<id>` |
| Pixel — Arcade Night | `/admin/luckydraw/<id>/pixel` |
| Pixel — Handheld | `/admin/luckydraw/<id>/pixel?ui=pixel-lcd` |
| Pixel — Quest | `/admin/luckydraw/<id>/pixel?ui=pixel-quest` |

The pixel screens carry a **Classic UI** link back to the original, which is
never modified by any of this.

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
