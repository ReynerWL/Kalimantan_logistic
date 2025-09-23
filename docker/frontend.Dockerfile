# === BUILDER STAGE ===
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install dependencies (dev + prod)
RUN npm ci --only=production && npm install --legacy-peer-deps

# Copy source code
COPY apps/frontend/. .

# Build app (includes TypeScript, minification, optimization)
RUN npm run build

# === RUNNER STAGE ===
FROM node:18-slim AS runner

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs .

# Install ONLY production dependencies (reinstall to prune dev deps)
RUN npm ci --only=production --legacy-peer-deps

# Expose port
EXPOSE 3000

# Start server
CMD ["npx", "next", "start"]