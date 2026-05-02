# syntax=docker/dockerfile:1
# Custom Dockerfile to bypass Zeabur's broken `npm update -g npm` step.

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# Install ALL deps (including dev) — needed for `next build` and TypeScript.
# Skip Playwright browser download (only needed for E2E tests, not prod build).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --include=dev

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# NEXT_PUBLIC_* vars are inlined at build time — hardcoded here because the anon
# key is a public value by design and Zeabur only injects env vars at runtime.
ENV NEXT_PUBLIC_SUPABASE_URL=https://wfstwbeehomzdudvikbt.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmc3R3YmVlaG9temR1ZHZpa2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjE5MDAsImV4cCI6MjA4NTI5NzkwMH0.IZpw9YGjz09Yl-PDR8_SYRHBdTwqEDdQeJvQBVo7Xdw
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
