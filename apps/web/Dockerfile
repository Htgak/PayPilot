# PayPilot Next.js Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package management files
COPY apps/web/package.json apps/web/pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY apps/web ./

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build the Next.js application
RUN pnpm build

# ----------------- Runner Stage -----------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built app and dependencies
COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "start"]
