# docker/frontend.Dockerfile
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend/. .

# Build app
RUN npm run build


# --- Runner ---
FROM node:18-slim AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .
COPY --from=builder /app/next.config.mjs .

# Install only production dependencies
RUN npm ci --only=production

# Expose port 3000
EXPOSE 3000

# Start Next.js server
CMD ["npx", "next", "start"]