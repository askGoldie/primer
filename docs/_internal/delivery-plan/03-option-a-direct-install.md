# 03 — Option A: Direct Install

Phase 3a. Build spec for the **Direct Install** path described in [`../Primer-Delivery.md`](../Primer-Delivery.md): customers install Node, install dependencies, run migrations, run seed, build, and run the app.

> **Pre-read:** [`00-overview.md`](./00-overview.md) and [`02-remove-supabase.md`](./02-remove-supabase.md). Most of the foundation for Option A lands in Phase 2 (the adapter swap, the migrate/seed scripts, the env vars). This doc is about the **packaging and polish** layer that turns Phase 2's working dev loop into something a customer can run from a zip.

---

## What Option A is, in one paragraph

> The customer extracts the zip, installs Node 20, has a Postgres 15+ database somewhere (local laptop, internal server, or managed), copies `.env.example` to `.env` and edits `DATABASE_URL`, then runs four npm commands. Six minutes later they have Primer running on `http://localhost:3000` with a seeded login. No containers, no abstraction, every line of source readable.

---

## The customer command sequence

```bash
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string

npm install
npm run migrate         # create tables in DATABASE_URL
npm run seed            # optional: load demo organization
npm run build           # compile the SvelteKit app
node build              # start the server
```

Result: the app listens on `PORT` (default `3000`).

This sequence is the source of truth. Every part of this doc serves making it work end-to-end on a fresh laptop.

---

## What Phase 3a actually builds

Most of the substance ships in Phase 2. This phase polishes the rough edges so a customer can do the above without extra knowledge.

### `package.json` — final scripts block

```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "start": "node build",
  "migrate": "tsx scripts/migrate.ts",
  "seed": "tsx scripts/seed.ts",
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "lint": "prettier --check . && eslint .",
  "format": "prettier --write ."
}
```

Removed compared to today: `prepack`, `demo:seed`, `supabase:seed`, `supabase:migrate`. Added: `migrate`, `seed`, `start`. Customers should not need to know about `prepack` or `svelte-package` — those exist because the repo currently advertises itself as a publishable Svelte component package, which it is not. Strip the `files`, `svelte`, `types`, `exports`, `peerDependencies`, `sideEffects` package.json fields too.

### `package.json` — dependency hygiene

After Phase 2:

- **Dependencies:** `postgres`, `papaparse`, plus whatever email provider client (`postmark` if used)
- **devDependencies:** the SvelteKit / Tailwind / Prettier / ESLint / TypeScript / tsx toolchain
- **Removed:** `@supabase/ssr`, `@supabase/supabase-js`, `@vercel/analytics`, `@sveltejs/adapter-vercel`
- **Added:** `@sveltejs/adapter-node`

Run `npm dedupe` and ensure `package-lock.json` is committed clean. Customers will `npm install` against this lockfile; mismatches cause confusing first-run failures.

### `.env.example` — annotated for humans

The file ships **with comments** that explain each variable in plain language. Annotation matters — `Primer-Delivery.md` says non-technical buyers will paste this file into an AI assistant for help.

```bash
# ---------------------------------------------------------------------
# Primer — Configuration
# ---------------------------------------------------------------------
# Copy this file to ".env" and fill in the values below. The .env file
# is read at startup; restart the server after changing it.

# ---- Required ----

# DATABASE_URL — connection string for your PostgreSQL database.
# Format: postgres://USER:PASSWORD@HOST:PORT/DATABASE
# Examples:
#   Local Postgres on default port:        postgres://postgres:postgres@localhost:5432/primer
#   Managed Postgres (e.g. Neon, Railway): postgres://user:pass@ep-name.region.aws.neon.tech/primer
DATABASE_URL=postgres://user:password@localhost:5432/primer

# ---- Optional ----

# PORT — TCP port for the application server. Default: 3000.
# PORT=3000

# PUBLIC_APP_URL — the URL your users will use to reach Primer. Used
# inside email links (verification, password reset). Default: http://localhost:3000.
# PUBLIC_APP_URL=https://primer.your-company.com

# DATABASE_POOL_MAX — maximum number of concurrent DB connections. Default: 10.
# Tune up for high-traffic deployments.
# DATABASE_POOL_MAX=10

# DATABASE_SSL — set to "require" if your Postgres provider requires SSL
# (most managed providers do). Default: disable.
# DATABASE_SSL=require

# ---- Email (optional) ----
# Configure ONE of the two below to enable email-based password reset and
# email verification. If neither is set, those flows show an error message
# explaining that an administrator must reset passwords directly.

# Option 1: Postmark (recommended for transactional email)
# POSTMARK_API_TOKEN=your-postmark-server-token
# POSTMARK_FROM_EMAIL=primer@your-company.com

# Option 2: Generic SMTP (if you already have a mail relay)
# SMTP_URL=smtp://user:pass@smtp.your-company.com:587
# SMTP_FROM_EMAIL=primer@your-company.com
```

Required: every comment is plain English, no jargon, every example is concrete. If a customer doesn't know what an "SMTP relay" is, they ignore that section and the app still works (with email-disabled flows).

### `svelte.config.js` — node adapter

```js
import adapter from '@sveltejs/adapter-node';

export default {
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter()
  }
};
```

### `scripts/migrate.ts` and `scripts/seed.ts`

Both shipped from Phase 2. Phase 3a verifies they:

- Print clear progress (`apply 20260101000001_enums.sql`, `skip 20260101000002_users.sql (already applied)`)
- Print clear errors with actionable messages (`failed to connect to DATABASE_URL — is the database running?`)
- Exit non-zero on failure
- Are idempotent: `npm run migrate` twice in a row is safe; `npm run seed` twice in a row is safe (no duplicate-key crashes)

### Healthcheck endpoint

Add `src/routes/api/health/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db.js';

export async function GET() {
  try {
    await sql`select 1`;
    return json({ status: 'ok', db: 'ok' });
  } catch (err) {
    return json({ status: 'degraded', db: 'unreachable', error: String(err) }, { status: 503 });
  }
}
```

Why now: Option B's docker-compose health checks need it (Phase 3b), and Option C deployments need it for load balancers and oncall dashboards. Cheap to add; Phase 4 docs will reference it.

### Logging

Customer logs go to stdout/stderr. No file logging, no log rotation, no third-party log shipper. Keep it simple — the customer's existing infrastructure (systemd journal, Docker log driver, whatever) handles persistence.

If the codebase currently uses a structured logger, fine. If it uses bare `console.log`, that's also fine — keep what's there. Do not introduce a logging library in this phase.

---

## Sanity test: a fresh-laptop dry run

The exit criterion for Option A is: **a fresh, no-context developer follows the customer quickstart on a clean machine and reaches a working login in under 10 minutes.**

To run the dry run:

1. Spin up a fresh sandbox (Docker container, fresh user account, clean directory — anything that doesn't have your dev state)
2. Install Node 20 LTS and a local Postgres 15
3. Extract a `git archive` of the current repo
4. `cd` in, follow `06-customer-quickstart.md` to the letter
5. Stop and note any step where you had to know something the docs didn't tell you

Anything you discovered is a docs gap or a script gap. Fix it before declaring Phase 3a done.

---

## What customers will customize first

Most early customer modifications follow predictable patterns. Optimize for these:

| Customization                                | Where                                                                                | Done well?                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Branding (name, logo, colors)                | `src/lib/i18n/en.json` (app name string), `static/logo.*`, Tailwind theme            | The app name should be a single i18n key, not hardcoded anywhere |
| Email templates                              | `src/lib/server/postmark/*` (or wherever templates land in Phase 2)                  | Templates should be one file per email type                      |
| Adding a language                            | `src/lib/i18n/<code>.json`, register in `src/lib/i18n/index.ts`                      | The current i18n architecture already supports this              |
| Disabling a product feature                  | Delete the route folder; remove nav entries; remove i18n keys                        | No feature flag system needed                                    |
| Connecting to existing Postgres              | Edit `DATABASE_URL`                                                                  | Already works                                                    |
| Switching to OIDC/SAML                       | Replace `src/lib/server/auth/*` with their provider's SDK; update hooks              | Phase 4 Technical Integration Guide documents this               |

The CLAUDE.md spec ([`05-customer-claude-md.md`](./05-customer-claude-md.md)) tells the customer's AI assistant how to do each of these correctly.

---

## Verification before declaring Phase 3a done

```bash
# 1. Lockfile is clean
npm ci
# should succeed without errors

# 2. Migrate + seed + build + run, in order, on a fresh DB
createdb primer_demo
DATABASE_URL=postgres://localhost/primer_demo npm run migrate
DATABASE_URL=postgres://localhost/primer_demo npm run seed
npm run build
DATABASE_URL=postgres://localhost/primer_demo PORT=3000 node build &

# 3. Healthcheck
curl -fsS http://localhost:3000/api/health
# should return {"status":"ok","db":"ok"}

# 4. Login round-trip with a seeded user (manual)
# Visit http://localhost:3000 → /auth/login → log in → land on /app

# 5. Migrations are idempotent
DATABASE_URL=postgres://localhost/primer_demo npm run migrate
# should print "skip" for every migration, exit 0

# 6. The "no .env" failure mode is friendly
unset DATABASE_URL
npm run migrate
# should print a clear error mentioning DATABASE_URL — not a stack trace
```

Phase 3a is **complete** when all six checks pass and the dry-run from a fresh sandbox finishes in under 10 minutes by following only `06-customer-quickstart.md`.

---

## Estimated scope

- Adapter swap, package.json cleanup: 2 hours (most of it actually lands in Phase 2)
- `.env.example` annotation: 1 hour
- Healthcheck endpoint: 30 minutes
- Migrate/seed script error message polish: 2 hours
- Fresh-sandbox dry run + iterating on doc gaps: half a day

Roughly **1 full day** on top of Phase 2.
