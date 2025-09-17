FROM oven/bun:1.2.0-alpine AS runtime
WORKDIR /app

# Install curl for Docker HEALTHCHECK (tiny)
RUN apk add --no-cache curl

# Install prod deps first for better layer cache
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source after deps
COPY tsconfig.json ./tsconfig.json
COPY src ./src

# Type-check at build
RUN bun x tsc --noEmit

# Non-root
USER bun

# Expose a health port
ENV NODE_ENV=production PORT=4000
EXPOSE 4000

# Container-level healthcheck (30s cadence)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:8080/health || exit 1

# Start polling bot + health server (index.ts calls startHttpServer)
CMD ["bun", "run", "src/index.ts"]