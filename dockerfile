# Install dependencies and build the app
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy the rest of your app
COPY . .

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build the Next.js app
RUN npm run build

# --- Serve the built app using Next.js built-in server ---
FROM node:20-slim AS runner

WORKDIR /app

# Copy built app from builder stage (this includes prisma/schema.prisma)
COPY --from=builder /app ./

# Install only production dependencies and run postinstall (e.g. prisma generate)
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "start"]
