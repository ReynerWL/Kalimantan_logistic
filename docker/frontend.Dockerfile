# --- Builder ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY apps/frontend/package*.json ./
RUN npm ci

COPY apps/frontend/. .
RUN npm run build

# --- Runner: Use Nginx for serving static files ---
FROM nginx:alpine

# LABEL maintainer="you@empatnusabangsa.com"

# Remove default config
RUN rm -rf /etc/nginx/conf.d

# Copy custom Nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy generated static files
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]