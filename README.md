# Events Portal
> **Cloud deployment:** This project is hosted on both GCP & vercel. Changes are deployed automatically whenever there is a commit to main branch. But for changes to be deployed to vercel, it the commit has to be made by subzeroxppil github user

## Getting Started for local development

```bash
docker build -t paypal-events .
docker run -p 3000:3000 paypal-events
```

### Teardown

**To Stop and remove the running container**

```bash
docker ps              # Get the container ID
docker stop <id>       # Stop the container
docker rm <id>         # Remove the container
```

**To remove the image**

```bash
docker rmi paypal-events
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
