# ---------- builder: installs dev deps and type-checks ----------
FROM oven/bun:1.2.0-alpine AS builder
WORKDIR /app

# Install ALL deps (incl. dev) for typechecking
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source after deps to leverage cache
COPY tsconfig.json ./tsconfig.json
COPY src ./src

# Type-check at build (fails fast on bad commits)
RUN bun x tsc --noEmit

# ---------- runtime: slim image with prod deps only ----------
FROM oven/bun:1.2.0-alpine AS runtime
WORKDIR /app

# For container HEALTHCHECK
RUN apk add --no-cache curl

# Install only production deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Bring in sources (already type-checked)
COPY tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Non-root user (provided by Bun image)
USER bun

# Health server in your app listens here
ENV NODE_ENV=production PORT=4000
EXPOSE 4000

# Container-level healthcheck hits Bun.serve() /health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1

CMD ["bun", "run", "src/index.ts"]