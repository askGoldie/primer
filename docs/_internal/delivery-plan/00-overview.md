# 00 — Delivery Plan Overview

How this repository becomes the customer-deliverable zip described in [`../Primer-Delivery.md`](../Primer-Delivery.md). This document defines the phases, the dependencies between them, and the exit criteria for each.

> **Read this first.** All other docs in `delivery-plan/` are scoped to one phase. This doc tells you which one to read next and why.

---

## Starting state (today)

This repo currently serves **two purposes simultaneously**:

1. **The DavidPM team's demo site** — public marketing pages under `src/routes/web/*`, plus a "perspective cookie" demo mode that lets visitors role-play as seeded personas. Hosted on Vercel; uses Supabase as a managed Postgres + auth provider.
2. **The product itself** — the application under `src/routes/app/*` (goals, peers, hierarchy, performance, settings, etc.).

The customer deliverable should contain **only #2**, with all Supabase-specific glue replaced by provider-agnostic equivalents.

Concrete coupling to remove (measured 2026-05-05):

- ~25 files import `@supabase/*`
- ~24 files use `db.from(...)` / `.rpc(...)` (Supabase PostgREST query builder)
- `src/hooks.server.ts` runs a Supabase SSR client and `safeGetSession()` JWT validation on every request
- Auth flows under `src/routes/auth/*` and `src/routes/web/{login,register,forgot-password,reset-password,verify-email}/*` are wired to Supabase Auth
- `src/routes/platform/*` is the demo entrypoint (gated on `isSupabaseAuthenticated`)
- 62 files under `src/routes/web/*` make up the public site
- `supabase/` directory holds migrations, seed SQL, and CLI config

Already in our favour:

- `supabase/migrations/*.sql` is **plain SQL** — portable to any Postgres without modification (the `npm run supabase:migrate` script just calls `psql -f` in a loop)
- `src/lib/server/auth/index.ts` already implements scrypt password hashing, sessions, email verification tokens, and password reset tokens. It just queries the Supabase client; the auth logic itself is provider-agnostic.
- `postgres` (postgres-js) is already a devDependency (used by `scripts/seed-supabase.ts` for raw SQL)
- i18n (`src/lib/i18n/*`) is provider-agnostic and stays as-is

---

## Target state (when delivery work is done)

The repo at HEAD should be **the customer zip contents**. Anything that is _only_ for the demo site (public marketing routes, Supabase glue, perspective cookie, `/platform`) should be gone.

When zipped and shipped, the customer can:

```
unzip primer-source.zip
cd primer-source
cp .env.example .env
# (edit .env to point at their Postgres)

# Option A
npm install && npm run migrate && npm run seed && npm run build && node build

# Option B
docker compose up -d
```

…and have a working Primer instance reachable at `http://localhost:3000` (Option A) or `http://localhost` (Option B), with seeded demo data, a working scrypt-based login, and zero external service dependencies at runtime.

---

## Phases

The work splits into four phases. **They have a dependency order.** Doing them out of order produces broken intermediate states.

```
Phase 1 ─── Phase 2 ─── Phase 3 ─── Phase 4
(strip)    (data layer)  (deploy)    (docs)
```

### Phase 1 — Strip the public site

**Goal:** Remove the public marketing site and demo-only entrypoints. The `/app/*` product surface keeps working (still on Supabase at this point).

**Why first:** Reduces the surface area for Phase 2. No reason to migrate Supabase calls in routes we're about to delete.

**Spec:** [`01-strip-public-site.md`](./01-strip-public-site.md)

**Exit criteria:**

- `src/routes/web/*` removed
- `src/routes/platform/*` removed (demo persona picker)
- `src/routes/+page.server.ts` either removed (if it's the marketing landing) or replaced with a redirect to `/app`
- `static/llms.txt`, `static/llms-full.txt`, `static/robots.txt`, `static/sitemap.xml`, marketing-only SEO scaffolding (`src/lib/seo/*` if exclusively used by `/web`) removed
- The `primer_perspective` cookie mechanism removed from `src/hooks.server.ts` and `src/lib/server/action-context.ts`
- `npm run check` passes
- The app under `/app/*` still works against Supabase (manually verified by logging in)

### Phase 2 — Remove Supabase

**Goal:** Replace `@supabase/supabase-js` PostgREST queries with `postgres-js` against plain Postgres. Replace Supabase Auth with the existing scrypt-based session/cookie auth in `src/lib/server/auth/index.ts`. Move SQL migrations from `supabase/migrations/` to `migrations/` and add an `npm run migrate` script that doesn't depend on Supabase CLI.

**Why second:** This is the big rewrite. It only makes sense after Phase 1 has reduced the call-site count.

**Spec:** [`02-remove-supabase.md`](./02-remove-supabase.md)

**Exit criteria:**

- Zero imports of `@supabase/*` anywhere in `src/`
- `@supabase/ssr` and `@supabase/supabase-js` removed from `package.json` dependencies
- `src/lib/server/db.ts` exports a postgres-js client (or a thin query helper)
- `src/hooks.server.ts` uses only the local session cookie (no Supabase SSR, no `safeGetSession`, no `isSupabaseAuthenticated`)
- `src/routes/auth/*` flows (login, register, logout, forgot-password, reset-password, verify-email) wire to `src/lib/server/auth/index.ts` instead of Supabase Auth
- `migrations/` directory contains the schema migrations (lifted from `supabase/migrations/`); `supabase/` directory is removed
- `npm run migrate` runs the migrations against `DATABASE_URL` without requiring Supabase CLI
- `npm run seed` exists and seeds demo data via postgres-js
- `npm run build` succeeds with `DATABASE_URL=postgres://...` and **no** `PUBLIC_SUPABASE_*` vars set
- A fresh Postgres database can be initialized end-to-end: create DB → migrate → seed → log in

### Phase 3 — Deployment options A and B

**Goal:** Ship Option A (direct install) and Option B (Docker Compose) as defined in `Primer-Delivery.md`. Option C ("your infrastructure") falls out for free once A is solid — it's the same code with a different `DATABASE_URL`.

**Why third:** The Dockerfile and compose file are pointless until Phase 2 lets the app start without Supabase env vars.

**Specs:**

- [`03-option-a-direct-install.md`](./03-option-a-direct-install.md)
- [`04-option-b-docker.md`](./04-option-b-docker.md)

**Exit criteria for Option A:**

- `package.json` scripts: `migrate`, `seed`, `build`, `start` — all documented and working
- `.env.example` lists every required and optional variable with plain-language comments
- `svelte.config.js` uses `@sveltejs/adapter-node` (not `adapter-vercel`) so the build produces a runnable Node server
- A reviewer following `06-customer-quickstart.md` on a fresh laptop with Node 20 and a local Postgres can reach a working login screen in under 10 minutes

**Exit criteria for Option B:**

- `Dockerfile` builds the app with multi-stage caching and produces a small final image
- `docker-compose.yml` defines three services: `app`, `db` (postgres:15-alpine), `proxy` (Caddy)
- `caddy/Caddyfile` terminates HTTP at port 80 and proxies to the app
- A reviewer running `docker compose up -d` from a fresh clone reaches a working login at `http://localhost` in under 5 minutes
- All three containers have healthchecks; `app` waits for `db` to be healthy before starting
- A `volumes:` mount persists Postgres data across `docker compose down && up`
- `docker compose down -v && docker compose up -d` re-runs migrations and reseeds cleanly

### Phase 4 — Customer-facing documentation

**Goal:** Produce the documents that ship in the zip: `README.md` (customer quickstart), `CLAUDE.md` (AI-assisted modification guide), `llms.txt` (structured AI context), and the supplemental docs listed in `Primer-Delivery.md`.

**Why last:** The docs reference scripts, env vars, file paths, and behaviors that don't exist until Phases 1–3 are done.

**Specs:**

- [`05-customer-claude-md.md`](./05-customer-claude-md.md)
- [`06-customer-quickstart.md`](./06-customer-quickstart.md)

**Exit criteria:**

- Project root `README.md` follows `06-customer-quickstart.md` and contains the step-by-step walkthrough
- Project root `CLAUDE.md` follows `05-customer-claude-md.md` and replaces the current dual-purpose CLAUDE.md
- `llms.txt` exists at the project root and provides structured context for AI assistants
- `docs/` (in the customer zip) contains: Architecture Overview, Technical Integration Guide (Option C), Changelog, Data Flow Diagram. (These are not yet specced in detail in this folder — they belong to a Phase 4 follow-up.)

---

## Rules that apply across all phases

These rules come from `CLAUDE.md` and `Primer-Delivery.md` and **must not be violated** during the work:

1. **i18n is mandatory.** No hardcoded English strings introduced anywhere. Every user-facing string in any new template, route, or error message goes through `t(key)` with entries added to all 9 locale files in `src/lib/i18n/`.
2. **No Supabase-specific APIs in DB code.** Even before Phase 2 lands, do not introduce new `db.from(...)` calls — use raw SQL through postgres-js if you need to add anything during Phase 1, so Phase 2 has fewer call sites to migrate.
3. **The migrations stay portable.** Do not introduce `auth.uid()`, RLS policies, or any other Supabase-specific SQL into the migration files. Application-layer permission checks live in `src/lib/server/permissions.ts`.
4. **Docs must reflect the real state.** Do not describe scripts, env vars, or files that don't exist yet. If a doc commits to a script, the script must exist by the same PR that lands the doc.
5. **No telemetry, no phone-home.** `Primer-Delivery.md` promises customers there is no license server and no outbound calls. Do not add analytics, error reporters, or "checking for updates" beacons. (`@vercel/analytics` is currently a dependency for the demo site only — it must be removed in Phase 1 along with the public marketing routes that use it.)

---

## Cross-phase dependency notes

A few things touch multiple phases — call them out so they don't get dropped:

| Concern                            | Phase 1                                       | Phase 2                                                 | Phase 3                              | Phase 4                              |
| ---------------------------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------ | ------------------------------------ |
| **Auth at `/app/*`**               | Still Supabase                                | Switch to scrypt sessions; remove `isSupabaseAuthenticated` | Healthcheck endpoint must be public  | Documented in CLAUDE.md and quickstart |
| **`adapter-vercel` → `adapter-node`** | —                                          | Optional during                                          | **Required** for both A and B        | Quickstart assumes node adapter      |
| **`.env.example`**                 | Add note that public-site vars are removed   | Replace `PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY` with `DATABASE_URL` | Final form                            | Referenced from quickstart and CLAUDE.md |
| **Demo data**                      | Keep `scripts/seed-demo.ts` working           | Rewrite without Supabase client                         | Wire as `npm run seed`               | Quickstart references it             |
| **`@vercel/analytics`**            | Remove                                        | —                                                       | —                                    | —                                    |

---

## What "done" feels like

Run this from a fresh clone of the repo on a fresh laptop, with no Supabase account, no Vercel account, and a local Postgres 15 instance:

```bash
cp .env.example .env
# edit DATABASE_URL only

npm install
npm run migrate
npm run seed
npm run build
node build
```

Open `http://localhost:3000`. See a login screen. Log in as a seeded user. Land on the product. Nothing references Supabase. Nothing made an outbound network call.

That is the entire bar. Every doc in this folder exists to get the team to that bar.
