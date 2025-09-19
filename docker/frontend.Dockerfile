# --- BUILDER ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/frontend/package.json apps/frontend/package-lock.json ./ 

# Install only production dependencies
RUN npm ci --only=production && mkdir -p /deps && cp -R node_modules /deps/node_modules

# Copy source
COPY apps/frontend/. .

# Build app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- RUNNER ---
FROM node:18-alpine AS runner

WORKDIR /app

# Use production-only node_modules
COPY --from=builder /deps/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

# Reduce permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/_health || exit 1

CMD ["npx", "next", "start"]