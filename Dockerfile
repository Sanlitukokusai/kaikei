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
# ⚠️ 2026-07-31：这里是 ENV 直接硬编码，连 build-arg 覆盖的余地都没有 —— 是**唯一生效**的值。
#    NEXT_PUBLIC_* 在 Next.js 构建期内联，Zeabur 面板改 env 对本站无效。
#    已从 legacy anon JWT 换成新版 publishable key（公开值，非密钥），
#    以便共享库停用 legacy anon/service_role 后本站仍可用。
ENV NEXT_PUBLIC_SUPABASE_URL=https://wfstwbeehomzdudvikbt.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_P_RNgoORY0nqqbXUWkBuZw_M7jkhGe3
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
