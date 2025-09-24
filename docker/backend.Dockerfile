# === Builder Stage ===
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY apps/backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY apps/backend/. .

# Build app
RUN npm run build


# === Runner Stage ===
FROM node:18-slim AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production deps
RUN npm ci --omit=dev

EXPOSE 5000

CMD ["node", "dist/main"]