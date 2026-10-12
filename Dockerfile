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
# next.config.ts needs the `typescript` package to parse at every `next start`, not just
# at build time - pruning it away makes Next.js try to auto-install it at container
# startup, which then fails under readOnlyRootFilesystem and crash-loops the pod.
# `npm install typescript` alone is NOT enough to put it back: NODE_ENV=production makes
# npm default to omit=dev, and that omit still applies to a package explicitly named on
# the command line if package.json already classifies it as a devDependency - it silently
# no-ops ("up to date", exit 0) instead of installing. `--include=dev` does work but drags
# back the other ~230 pruned devDependencies too. Installing it with no package.json in
# scope (via --prefix into a scratch dir) sidesteps the classification entirely; typescript
# has no runtime dependencies of its own, so copying just that one directory in is enough.
RUN npm run build \
 && npm prune --omit=dev --no-audit --no-fund \
 && mkdir -p /tmp/tsdep \
 && npm install --prefix /tmp/tsdep --no-audit --no-fund --no-save typescript \
 && cp -r /tmp/tsdep/node_modules/typescript ./node_modules/typescript \
 && rm -rf /tmp/tsdep .next/cache node_modules/@next/swc-linux-*-musl

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
