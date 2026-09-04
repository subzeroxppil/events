# Events Portal

https://pp-events-609469738206.asia-southeast1.run.app | https://pp-events.vercel.app

> **Cloud deployment:** This project is hosted on both GCP & vercel. Changes are deployed automatically whenever there is a commit to main branch. But for changes to be deployed to vercel, the commit has to be made by subzeroxppil github user.

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
