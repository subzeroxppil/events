# Install dependencies and build the app
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

# Copy the rest of your app
COPY . .

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Declare build-time arguments
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG JWT_SECRET
ARG NODE_ENV

# Set environment variables (so they're available during RUN commands)
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NODE_ENV=$NODE_ENV

# Build the Next.js app
RUN npm run build

# --- Serve the built app using Next.js built-in server ---
FROM node:20-slim AS runner

WORKDIR /app

# Copy built app from builder stage (this includes prisma/schema.prisma)
COPY --from=builder /app ./

# Install only production dependencies and run postinstall (e.g. prisma generate)
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["npm", "start"]

