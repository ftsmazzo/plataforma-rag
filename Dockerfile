# Multi-stage Dockerfile for RAG Knowledge Base System
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files and patches (needed for pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

# Copy package files and patches (needed for pnpm install)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build backend (esbuild)
RUN pnpm run build

# Stage 3: Production image
# Use Debian-based image for better library support (Tesseract, Canvas, etc.)
FROM node:22-slim

WORKDIR /app

# Install system dependencies for document processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-por \
    tesseract-ocr-eng \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies only (including drizzle-kit for migrations)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --no-frozen-lockfile --prod && \
    npm install -g drizzle-kit@^0.31.4 && \
    pnpm store prune

# Copy built assets from builders
COPY --from=frontend-builder /app/dist/public ./dist/public
COPY --from=backend-builder /app/dist ./dist

# Copy necessary files
COPY drizzle ./drizzle
COPY server/_core ./server/_core
COPY shared ./shared
COPY scripts/init-db.sh ./scripts/init-db.sh
COPY drizzle.config.ts ./drizzle.config.ts
COPY schema-postgresql.sql ./schema-postgresql.sql
COPY create-admin.js ./create-admin.js

# Create non-root user and make init script executable
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs -m -d /home/nodejs nodejs && \
    mkdir -p /home/nodejs/.cache/node/corepack/v1 && \
    chmod +x /app/scripts/init-db.sh && \
    chown -R nodejs:nodejs /app /home/nodejs && \
    chmod -R 755 /home/nodejs/.cache && \
    chmod -R 777 /home/nodejs/.cache/node

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use init script as entrypoint for database migration
ENTRYPOINT ["/app/scripts/init-db.sh"]
CMD ["node", "dist/index.js"]
