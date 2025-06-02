# Install dependencies and build the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of your app
COPY . .

# Build the Next.js app
RUN npm run build

# --- Serve the built app using Next.js built-in server ---
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built app from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js uses
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
