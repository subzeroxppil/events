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
npx prisma migrate dev --name <name of migration>
```

💡 Note: Insert the name of the migration eg: add_user_table

**Step 3: Execute the relevant migration files to the production database**

```bash
npx prisma migrate deploy
```

**OPTIONAL: Seed the database with dummy data according to `prisma/seed.js`**

```bash
npx prisma db seed
```
