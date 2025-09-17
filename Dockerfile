# Use Bun official image
FROM oven/bun:1.0.29

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install deps (faster with bun.lockb)
RUN bun install --frozen-lockfile

# Build or just check types if needed
RUN bun x tsc --noEmit

# Expose port (adjust if needed)
EXPOSE 3000

# Start app
CMD ["bun", "run", "src/index.ts"]
