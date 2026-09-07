# Install dependencies and build the app
FROM node:20-slim AS builder

WORKDIR /app

# Prisma's engines need OpenSSL at generate time.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Manifests first, so the dependency layer is cached across builds that only
# change source. `prisma generate` runs from postinstall and needs the schema,
# so that comes across before `npm ci` too.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# Then the source, which changes on every commit.
COPY . .

# Declare build-time arguments. The three NEXT_PUBLIC_* values are inlined into
# the client bundle by Next at build time, so they MUST be present here — a
# runtime environment variable is too late for them. The rest are here because
# `next build` can execute route code while prerendering.
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG JWT_SECRET
ARG NODE_ENV

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NODE_ENV=$NODE_ENV

RUN npm run build

# --- Serve the built app using Next.js built-in server ---
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy the built app (this includes prisma/schema.prisma, which the runtime
# Prisma client needs).
COPY --from=builder /app ./

# Production dependencies only; postinstall re-runs `prisma generate`.
RUN npm ci --omit=dev

# Cloud Run assigns the port via $PORT (8080 by default) and `next start`
# honours it, so no explicit port flag is needed here.
EXPOSE 8080
CMD ["npm", "start"]
