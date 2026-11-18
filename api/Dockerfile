# WatchParty API: Express + Socket.IO on Node 22, one small image.
#
#   docker build -f api/Dockerfile -t watchparty-api .        (from the repo root)
#
# The build context is the repo root, because the lockfile lives there (npm workspaces).
# Node runs the .ts files directly, so there is no compile step: the image is the
# production dependencies plus api/src and api/drizzle. It listens on 8080 and expects
# a Postgres reachable through DATABASE_URL, so run it through api/deploy/docker-compose.yml.

# ---- 1. production dependencies ---------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /repo
# npm ci checks the lockfile against every workspace, so both manifests must be present.
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY ui/package.json ui/
RUN npm ci -w @watchparty/api --omit=dev --ignore-scripts

# ---- 2. the image that runs -------------------------------------------------------
FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production PORT=8080

COPY --from=deps /repo/node_modules ./node_modules
COPY api/package.json api/
COPY api/src api/src
COPY api/drizzle api/drizzle

WORKDIR /repo/api
# The alpine image ships an unprivileged "node" user; never run as root.
USER node
EXPOSE 8080

# Healthy when Postgres answers through the API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health/ready').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

# Same flags as `npm start`, minus the .env loader: the container gets its settings from compose.
CMD ["node", "--import", "./src/instrumentation.ts", "src/server.ts"]
