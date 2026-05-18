# Multi-stage Dockerfile for RAG Knowledge Base System
# Single builder stage (vite + esbuild run once — faster deploys on EasyPanel)

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# Production image (Tesseract, pg client, etc.)
FROM node:22-slim

WORKDIR /app

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

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --no-frozen-lockfile --prod && \
    npm install -g drizzle-kit@^0.31.4 && \
    pnpm store prune

COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/dist ./dist

COPY drizzle ./drizzle
COPY server/_core ./server/_core
COPY shared ./shared
COPY scripts/init-db.sh ./scripts/init-db.sh
COPY drizzle.config.ts ./drizzle.config.ts
COPY schema-postgresql.sql ./schema-postgresql.sql
COPY create-admin.js ./create-admin.js

RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs -m -d /home/nodejs nodejs && \
    mkdir -p /home/nodejs/.cache/node/corepack/v1 && \
    chmod +x /app/scripts/init-db.sh && \
    chown -R nodejs:nodejs /app /home/nodejs && \
    chmod -R 755 /home/nodejs/.cache && \
    chmod -R 777 /home/nodejs/.cache/node

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/app/scripts/init-db.sh"]
CMD ["node", "dist/index.js"]
