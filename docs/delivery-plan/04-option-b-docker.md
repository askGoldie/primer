# 04 — Option B: Docker Compose

Phase 3b. Build spec for the **Docker Compose** path described in [`../Primer-Delivery.md`](../Primer-Delivery.md): customers run **one command** and get the app, a Postgres database, and a reverse proxy — all in containers, all isolated.

> **Pre-read:** [`00-overview.md`](./00-overview.md), [`02-remove-supabase.md`](./02-remove-supabase.md), and [`03-option-a-direct-install.md`](./03-option-a-direct-install.md). Option B builds on the Option A primitives — same scripts, same env vars, just orchestrated differently.

---

## What Option B is, in one paragraph

> The customer extracts the zip, has Docker Engine and Compose v2 installed, copies `.env.example` to `.env` (defaults work for evaluation), runs `docker compose up -d`, and reaches a working Primer instance at `http://localhost`. PostgreSQL runs in a sibling container with persistent storage; a Caddy reverse proxy terminates HTTP. The host machine sees only Docker — no Node, no psql, no host-level dependencies.

---

## The customer command sequence

```bash
cp .env.example .env
# (defaults work for local evaluation)

docker compose up -d
```

Result: Primer reachable at `http://localhost`. Caddy proxies to the app container. Postgres data persists in a named volume. Migrations run automatically before the app starts.

---

## Service topology

Three services, one docker-compose.yml.

```
┌──────────────────────────────────────────────────────────┐
│  docker-compose.yml                                      │
│                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│   │  proxy   │───▶│   app    │───▶│       db         │  │
│   │ (Caddy)  │    │ (Node)   │    │ (Postgres 15)    │  │
│   └──────────┘    └──────────┘    └──────────────────┘  │
│       :80              :3000               :5432         │
│                                                          │
│   Volume: db-data → /var/lib/postgresql/data             │
└──────────────────────────────────────────────────────────┘
```

The app container runs migrations + seed on first boot, then starts the SvelteKit Node server. The proxy container terminates HTTP at port 80 and proxies to the app.

---

## File deliverables

### `Dockerfile`

Multi-stage. Stage 1 builds dependencies; stage 2 produces a minimal runtime image.

```dockerfile
# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (caches well)
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build && npm prune --production

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what production needs
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/seeds ./seeds
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json

# Run as non-root
RUN addgroup -S primer && adduser -S primer -G primer
USER primer

EXPOSE 3000

# Entrypoint runs migrations, then the server
COPY --chown=primer:primer docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

### `docker/entrypoint.sh`

```sh
#!/bin/sh
set -e

echo "[primer] running migrations…"
npx tsx scripts/migrate.ts

# Seed only on first boot. The seed script itself is idempotent, but
# skipping the call entirely on subsequent boots avoids re-running the
# inserts and keeps logs clean.
if [ "$PRIMER_SEED_ON_BOOT" = "true" ] && [ ! -f /tmp/primer-seeded ]; then
  echo "[primer] running seed…"
  npx tsx scripts/seed.ts || echo "[primer] seed failed; continuing"
  touch /tmp/primer-seeded
fi

echo "[primer] starting server on port ${PORT:-3000}…"
exec node build
```

### `docker-compose.yml`

```yaml
name: primer

services:
  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://primer:${POSTGRES_PASSWORD:-changeme}@db:5432/primer
      DATABASE_SSL: disable
      PORT: 3000
      PUBLIC_APP_URL: ${PUBLIC_APP_URL:-http://localhost}
      PRIMER_SEED_ON_BOOT: ${PRIMER_SEED_ON_BOOT:-true}
      POSTMARK_API_TOKEN: ${POSTMARK_API_TOKEN:-}
      POSTMARK_FROM_EMAIL: ${POSTMARK_FROM_EMAIL:-}
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/api/health']
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 30s

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: primer
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: primer
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U primer -d primer']
      interval: 5s
      timeout: 3s
      retries: 10

  proxy:
    image: caddy:2-alpine
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config

volumes:
  db-data:
  caddy-data:
  caddy-config:
```

### `caddy/Caddyfile`

```
{
  # Disable automatic HTTPS for local-default operation.
  # Customers exposing Primer on a real hostname should remove this and
  # configure their hostname on the site block below — Caddy will issue
  # a Let's Encrypt cert automatically.
  auto_https off
}

:80 {
  reverse_proxy app:3000

  encode gzip
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    Referrer-Policy strict-origin-when-cross-origin
  }
}
```

For real-domain deployments, the customer edits the Caddyfile to:

```
primer.your-company.com {
  reverse_proxy app:3000
  encode gzip
}
```

…removes the `auto_https off` block, and Caddy handles certificates automatically.

### `.dockerignore`

```
node_modules
.svelte-kit
build
.env
.env.*
docs
.git
.github
*.md
```

Keeps build context small and prevents shipping the developer's `.env` into the image accidentally.

---

## Environment variables in compose

The compose file reads these from `.env` in the project root (Compose loads it automatically):

| Variable                | Default        | Purpose                                                               |
| ----------------------- | -------------- | --------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`     | `changeme`     | Postgres superuser password (also used in app's DATABASE_URL)         |
| `PUBLIC_APP_URL`        | `http://localhost` | URL used in email links                                           |
| `PRIMER_SEED_ON_BOOT`   | `true`         | Whether to run `npm run seed` on first container boot                 |
| `POSTMARK_API_TOKEN`    | (empty)        | Optional, for transactional email                                     |
| `POSTMARK_FROM_EMAIL`   | (empty)        | Optional, sender address                                              |

**Important:** `Primer-Delivery.md` says "defaults work for evaluation". That commitment requires `docker compose up -d` to succeed with an unmodified `.env.example`. The default `POSTGRES_PASSWORD=changeme` is fine for that purpose; the `.env.example` should warn customers to change it before exposing the deployment to a network.

`.env.example` should add a Docker section:

```bash
# ---- Docker Compose (Option B) ----
# These only apply if you're using docker-compose.yml.
# For Option A (direct install), DATABASE_URL above is what matters.

# POSTGRES_PASSWORD — password for the bundled Postgres container.
# CHANGE THIS before deploying anywhere other than your local machine.
POSTGRES_PASSWORD=changeme

# PRIMER_SEED_ON_BOOT — load demo data on first container start.
# Set to "false" to start with an empty database.
PRIMER_SEED_ON_BOOT=true
```

---

## Layered customizations

Customers will modify the Docker setup in predictable ways. Make these easy:

### "I have my own Postgres"

Comment out the `db` service, remove the `depends_on: db`, set `DATABASE_URL` in `.env` to point at the external database. Document this in the Technical Integration Guide (Phase 4).

### "I want SSL with my own domain"

Edit `caddy/Caddyfile` to use the real hostname. Caddy issues Let's Encrypt certs automatically. Document this in the customer quickstart's "going to production" section.

### "I want to run multiple Primer instances on one host"

Two approaches:

1. Multi-tenancy via separate compose projects: copy the folder, change `name: primer` to `name: primer-acme`, change the host port mapping.
2. Use `docker compose --project-name acme` from a single source folder.

This is the EOS Implementer / consultant case from `Primer-Delivery.md`. Make it work; don't add complexity to make it elegant.

### "I want to run air-gapped"

```
docker compose pull          # online machine
docker save primer-app primer-db caddy:2-alpine postgres:15-alpine -o primer-images.tar
# transfer images + zip to air-gapped machine
docker load -i primer-images.tar
docker compose up -d
```

The Dockerfile must `npm ci` from a committed `package-lock.json` and not `npm install` any packages that hit the network at build time. With multi-stage build above, the runtime image has no `npm install` step — it copies `node_modules` from the build stage. Good for air-gap.

---

## What can go wrong, and how the design handles it

| Failure mode                                  | What happens                                                                            | Customer experience                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Database not ready when app starts            | `depends_on: db: condition: service_healthy` blocks app start until pg_isready          | App waits, then starts cleanly                            |
| Migration fails on first boot                 | Entrypoint script exits non-zero; container restarts (per `restart: unless-stopped`)    | Customer sees crash loop in `docker compose logs app`     |
| Seed fails (e.g., already seeded with different schema) | `seed.ts \|\| echo "seed failed; continuing"` — non-fatal                       | App boots; logs note seed was skipped                     |
| Port 80 already in use on host                | Compose fails to start proxy with a clear error                                         | Customer sees the port conflict in compose output         |
| `.env` missing                                | Compose substitutes defaults (`changeme` etc.) — works                                  | Boots with insecure defaults; no startup failure          |

---

## Verification before declaring Phase 3b done

```bash
# 1. Cold start
docker compose down -v
docker compose up -d --build

# 2. Wait for healthy
docker compose ps
# all three services show "healthy" within 60 seconds

# 3. Healthcheck via proxy
curl -fsS http://localhost/api/health
# should return {"status":"ok","db":"ok"}

# 4. Login round-trip (manual)
# Visit http://localhost → /auth/login → log in as seeded user → land on /app

# 5. Persistence
docker compose down                # stops, keeps volumes
docker compose up -d
# logs show "skip" for already-applied migrations
# previous login still works (data persisted)

# 6. Clean reset
docker compose down -v             # removes volumes
docker compose up -d
# logs show all migrations applied, seed runs, fresh state

# 7. Image size
docker images primer-app:latest
# runtime image should be < 250 MB. If larger, the multi-stage build is leaking dev deps.
```

Phase 3b is **complete** when all seven checks pass.

---

## Estimated scope

- Dockerfile + entrypoint script: half a day
- docker-compose.yml + .env wiring + Caddyfile: half a day
- Cold-start / persistence / reset testing iterations: half a day
- `.env.example` Docker section: 1 hour
- Documentation hooks back into customer quickstart: 1 hour

About **1.5–2 days**.
