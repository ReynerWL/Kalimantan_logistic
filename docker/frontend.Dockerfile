# === BUILDER STAGE ===
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files (both files needed for npm ci)
COPY apps/frontend/package*.json ./

# ✅ Install dependencies — generates lockfile if missing, but we already have it
RUN npm ci --omit=dev

# Copy source code
COPY apps/frontend/. .

# Build app
RUN npm run build


# === RUNNER STAGE ===
FROM node:18-slim AS runner

WORKDIR /app

# Copy built output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# ✅ Copy package files (including package-lock.json)
COPY --from=builder /app/package*.json ./

# ✅ Install ONLY production dependencies — this will now work!
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npx", "next", "start"]