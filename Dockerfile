# syntax=docker/dockerfile:1.7
# Open Lovable (github.com/firecrawl/open-lovable) — verified against commit 806b807 (2026-10-09)
# Build from the repo root:  docker build -t open-lovable .

ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- deps: full install (dev deps needed for next build / tailwind / typescript) ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---------- build ----------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NOTE: needs outbound access to fonts.googleapis.com / fonts.gstatic.com (next/font/google in app/layout.tsx).
# No secrets are needed at build time; do NOT pass API keys as build args.
RUN npm run build \
 && npm prune --omit=dev --no-audit --no-fund \
 && rm -rf .next/cache node_modules/@next/swc-linux-*-musl

# ---------- runtime ----------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# PORT must stay 3000: API routes call back into the app via http://localhost:3000
# (NEXT_PUBLIC_APP_URL is inlined at build time and unset, so the fallback is used).
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/next.config.ts ./
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/node_modules ./node_modules
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node_modules/.bin/next", "start"]
