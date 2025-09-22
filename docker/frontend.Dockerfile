# --- Builder ---
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files
COPY apps/frontend/package*.json ./

# Install all dependencies
RUN npm ci

# Copy source
COPY apps/frontend/. .

# Build app
RUN npm run build


# --- Runner ---
FROM node:18-slim AS runner

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npx", "next", "start"]