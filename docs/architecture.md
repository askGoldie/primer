# Architecture Overview

For the technical implementer doing first-look review or planning an Option C deployment. Tells you what Primer is made of, how a request flows through it, what the data looks like, and where the seams are if you need to swap something for your own infrastructure.

If you're installing for the first time, start with [`README.md`](../README.md). If you're an AI assistant working in this codebase, start with [`CLAUDE.md`](../CLAUDE.md). This doc is the bridge between those two — for the engineer integrating Primer into an existing environment.

---

## Stack

| Layer        | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Language     | TypeScript                                                   |
| Framework    | Svelte 5 (runes mode) + SvelteKit 2                          |
| Adapter      | `@sveltejs/adapter-node` — the build artefact is `node build` |
| Database     | PostgreSQL 15+                                               |
| DB client    | `postgres` (postgres-js) — raw SQL, no ORM                   |
| Auth         | Application-layer scrypt sessions (placeholder; see [Seams](#seams)) |
| Styling      | Tailwind CSS 4 (theme tokens in `src/routes/layout.css`)     |
| Quality gate | `svelte-check` (types) + `eslint` + `prettier`               |

There is no runtime dependency on any service Primer doesn't ship. No Redis, no message broker, no object store, no third-party identity provider. Postgres holds everything that persists.

---

## Top-level layout

```
primer-source/
├── src/                  # The application
│   ├── routes/           # SvelteKit routes (pages, server actions, API endpoints)
│   ├── lib/server/       # Server-only modules (DB, auth, permissions, hierarchy)
│   ├── lib/components/   # Reusable Svelte components
│   ├── lib/i18n/         # 9-language translations
│   └── hooks.server.ts   # Locale + session middleware
├── migrations/           # Plain SQL, applied in lexical order
├── seeds/                # Plain SQL, applied in lexical order
├── scripts/              # migrate.ts, seed.ts
├── docker-compose.yml    # Option B
├── Dockerfile            # Multi-stage; produces a small node:20-alpine image
└── caddy/                # Reverse proxy config (Option B)
```

---

## Request lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Browser                                                                  │
│   │                                                                      │
│   │  primer_session cookie  (httpOnly, 7d TTL)                           │
│   │  primer_lang    cookie  (1y, sets locale)                            │
│   ▼                                                                      │
│ SvelteKit server (Node, adapter-node)                                    │
│                                                                          │
│   hooks.server.ts:  handleLocale  →  handleAuth                          │
│        │                  │                │                             │
│        │                  │                └─ validateSession() →        │
│        │                  │                   locals.user, locals.isAdmin│
│        │                  └─ resolves locale, substitutes %lang% / %dir% │
│        │                                                                 │
│        ▼                                                                 │
│   Routes:                                                                │
│     /            ─ public landing                                        │
│     /auth/*      ─ login, register, password reset, email verify         │
│     /app/*       ─ product surface; +layout.server.ts redirects to       │
│                    /auth/login if locals.user is null                    │
│     /api/health  ─ public liveness probe                                 │
│                                                                          │
│        │                                                                 │
│        ▼                                                                 │
│   src/lib/server/db.ts  →  postgres-js  →  PostgreSQL                    │
└──────────────────────────────────────────────────────────────────────────┘
```

Every server-side database query goes through `src/lib/server/db.ts`. There is no second client, no read replica routing, no caching layer. If you want any of those, they slot in at the `db.ts` boundary.

Authentication is _application-layer only_ — there are no Postgres row-level security policies and no `auth.uid()` calls in any migration. Authorization decisions are made in TypeScript via `src/lib/server/permissions.ts`.

---

## Data model

The schema lives in `migrations/*.sql`. Files are applied once in lexical filename order; the `schema_migrations` table tracks which have run. **Do not modify a migration file after it has been added** — write a new migration that ALTERs the schema instead. The runner has no way to detect a retroactively-edited migration, so customers' databases would silently diverge from yours.

Tables grouped by domain:

### Identity & access

| Table                       | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `users`                     | Person rows. Login email, scrypt `password_hash`, locale, `deactivated_at`. |
| `sessions`                  | Active session tokens (32-byte random). `expires_at` enforces 7-day TTL. |
| `email_verification_tokens` | One-shot tokens issued by `/auth/register` and the resend endpoint.      |
| `password_reset_tokens`     | One-shot tokens issued by `/auth/forgot-password`.                       |
| `organizations`             | Tenant root. Cycle cadence, inquiry-system toggle.                       |
| `org_members`               | User × organization × role. Role is one of `owner`, `system_admin`, `hr_admin`, `editor`, `participant`, `viewer`. |
| `org_hierarchy_nodes`       | The org chart. Self-referencing tree via `parent_id`. Each node has `node_type` ∈ {`executive_leader`, `department`, `team`, `individual`} and may bind to a `user_id`. |
| `visibility_grants`         | Elevated cross-tree access — typically issued by the CEO node to grant ancestor-equivalent visibility into a subtree. |

### Performance domain

| Table                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `metrics`            | Per-node metric definitions (name, weight, measurement type, current tier, lock state). |
| `metric_thresholds`  | The five tier descriptions per metric (`alarm` → `optimized`).          |
| `metric_reviews`     | Submission / approval state for the two-party agreement workflow.       |
| `score_snapshots`    | Immutable tier-cycle captures. Locks the source metrics at capture time. |
| `performance_logs`   | Periodic measured values fed into the tier framework.                   |

### Goals

| Table                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `org_goals`          | Goals attached to a hierarchy node. `goal_origin` distinguishes self-created from cascaded. |
| `goal_dependencies`  | Cross-goal links (`blocks`, `informs`, `supports`).                     |
| `goal_adjustments`   | Per-field change history for goals, written by the update action.       |

### Inquiries

| Table              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `inquiries`        | Self-inquiries (recalibrate one's own thresholds) and peer inquiries (challenge a peer's metric). |
| `inquiry_comments` | Threaded discussion attached to an inquiry.                          |

### Operations & audit

| Table                 | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `audit_log`           | Append-only history of mutations on org/hierarchy entities.        |
| `placement_requests`  | New users requesting placement into the hierarchy by HR/admin.     |

### Vestigial (demo-site leftovers)

These tables exist in the schema but are not read or written by any code path in the customer build. They were created for the team-hosted demo's purchase-tracking and analytics features, which were stripped from the customer codebase. They are inert — a `npm run migrate` will create them, but nothing inserts into them and nothing queries them.

| Table              | Origin                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `licenses`         | Demo-site purchase tracking                                          |
| `purchase_events`  | Demo-site purchase / contact-form analytics                          |
| `account_events`, `demo_events`, `download_events`, `narrative_events` | Demo-site product analytics |

If you want a tighter schema, you can write a new migration that drops them. They have no foreign keys pointing at the rest of the schema, so a `DROP TABLE … CASCADE` is safe.

---

## Seams

Where to plug your own infrastructure in. Each seam is a single file; the contract is a function or environment variable; the swap is a normal code change.

### Database

| | |
|---|---|
| **File**     | `src/lib/server/db.ts`                                                |
| **Contract** | Exports `sql` (postgres-js tagged template) plus `one`, `maybeOne`, `many` helpers. |
| **Swap**     | Already swappable: set `DATABASE_URL`. Pool size via `DATABASE_POOL_MAX`. TLS via `DATABASE_SSL=require`. |
| **Notes**    | If you want a read replica, route reads through a second `sql` instance imported separately. The codebase does not assume a single connection, but every existing query uses the default export. |

### Authentication

| | |
|---|---|
| **File**     | `src/lib/server/auth/index.ts`, used from `src/hooks.server.ts:handleAuth` |
| **Contract** | `validateSession(sessionId: string): Promise<{ session, user } \| null>`. The hook reads the result and populates `event.locals.user` (shape declared in `src/app.d.ts`). Everything downstream reads `locals.user`. |
| **Swap**     | Replace the body of `validateSession` with a call to your IdP's session/JWT verifier. Construct a `user` object matching the `App.Locals['user']` shape and return it. The login/register/reset routes can be deleted if your IdP owns those flows. |
| **Notes**    | The bundled scrypt flow is intentionally a placeholder. Most Option C deployments swap the entire `auth/` module for OIDC, SAML, or LDAP. The session cookie name is `primer_session` and is set by `setSessionCookie(cookies, sessionId)` — adapt that helper to set whatever cookie or header your IdP uses, or remove it if your IdP manages cookies via its own middleware. |

### Email (transactional)

| | |
|---|---|
| **File**     | `src/routes/auth/{register,forgot-password,verify-email/resend}/+page.server.ts` |
| **Contract** | These routes generate a token and a URL, then `console.log` the URL. They do not send email. |
| **Swap**     | Replace each `console.log(...)` with a call to your transactional provider (Postmark, SendGrid, SES, SMTP). The URL is already constructed; you wrap it in your template and ship it. |
| **Notes**    | If you swap auth for an SSO provider that handles its own verification and reset flows, this seam disappears entirely along with the auth routes. |

### Reverse proxy / TLS termination

| | |
|---|---|
| **What you need to know** | The app is a Node server listening on `PORT` (default `3000`). It serves both pages and API. There are no special SSL requirements; any reverse proxy works (Nginx, Apache, HAProxy, F5, AWS ALB, GCP HTTPS LB, your existing fronting). |
| **What ships**            | Option B includes a Caddy config in [`caddy/Caddyfile`](../caddy/Caddyfile) that terminates HTTP at `:80` and proxies to `app:3000`. The config has a comment describing the one-edit path to a real hostname with automatic Let's Encrypt. |
| **Swap**                  | Use any reverse proxy that can forward to `http://<host>:3000`. Strip the proxy service from `docker-compose.yml` if you have your own. |

### Healthcheck and monitoring

| | |
|---|---|
| **Endpoint** | `GET /api/health` ([`src/routes/api/health/+server.ts`](../src/routes/api/health/+server.ts)) |
| **Behavior** | Runs `select 1` against the database. Returns `200 {"status":"ok","db":"ok"}` on success, `503 {"status":"degraded","db":"unreachable","error":"…"}` on failure. |
| **Swap**     | Register the URL with your prober (Pingdom, Datadog, internal Prometheus blackbox exporter, etc.). The endpoint is public — no auth required, since it's intended for infrastructure components without credentials. |
| **Notes**    | If you need additional probes (memory pressure, queue depth, etc.), add new routes under `src/routes/api/` and follow the same pattern. |

### Logs

| | |
|---|---|
| **Where they go** | `stdout` and `stderr`. The codebase uses unstructured `console.log` / `console.error` / `console.warn`. |
| **Swap**          | Pipe the process output to your log aggregator. Docker, systemd, and pm2 all expose stdout cleanly to whatever shipper you already run (Loki, Datadog, Splunk, CloudWatch, Logtail, etc.). |
| **Notes**         | If you want structured (JSON) logs, the lowest-touch path is to add a tiny wrapper that wraps `console.log` and serialises to JSON. The codebase does not depend on a logging library, and adding `pino` or `winston` is a customer-side decision. |

### Configuration

| | |
|---|---|
| **Files**    | `.env` is read at startup via `dotenv` (see `scripts/migrate.ts`, `scripts/seed.ts`) and via SvelteKit's `$env/dynamic/private` and `$env/dynamic/public` modules at request time. |
| **Reference**| [`.env.example`](../.env.example) lists every variable with a plain-language comment. |

---

## Software Bill of Materials (SBOM)

For procurement, security audit, or compliance review, generate an SBOM from the lockfile:

```sh
npm run sbom
```

This writes [`docs/sbom.csv`](./sbom.csv) with one row per installed package — name, version, license (typically SPDX), production/development classification, direct vs. transitive flag, integrity hash, and resolved tarball URL. The script reads `package-lock.json` directly and does not require `node_modules` to be installed, so it works even after `npm prune --production`.

A regenerated SBOM is checked into `docs/` so reviewers can read it without running the toolchain. Re-run the script and commit the result whenever dependencies change.

---

## What is _not_ a seam

Things implementers sometimes try to swap that you should not:

- **The migrations directory.** Schema changes go in a new migration file. Editing an existing migration breaks `schema_migrations` tracking and silently diverges customer databases from yours. Same for `seeds/`.
- **The permissions module.** `src/lib/server/permissions.ts` is the canonical authorization logic. Don't bypass it by adding RLS policies — the codebase explicitly does not use them, and adding them creates a second, conflicting source of truth.
- **The i18n layer.** Don't hardcode strings in components, even temporarily. The 9-language constraint is enforced at the build level and the project's customer base includes multilingual deployments by default.

---

## Where to go next

- For installation: [`README.md`](../README.md).
- For codebase orientation as you start editing: [`CLAUDE.md`](../CLAUDE.md).
- For machine-readable structure (paste into an AI assistant): [`llms.txt`](../llms.txt).
- For human help on integrations specific to your environment: contact DavidPM, LLC at the support email on your purchase invoice.
