# docker/backend.Dockerfile

# === Builder Stage ===
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files (including lockfile)
COPY apps/backend/package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy source code
COPY apps/backend/. .

# Build app
RUN npm run build


# === Runner Stage ===
FROM node:18-slim AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/dist ./dist

# ✅ Copy both package.json AND package-lock.json
COPY --from=builder /app/package*.json ./

# ✅ Install only production dependencies
RUN npm ci --omit=dev

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "dist/main"]