# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Language**: TypeScript
- **Framework**: SvelteKit (Svelte 5 with runes — runes mode is forced everywhere except `node_modules` in `svelte.config.js`)
- **Adapter**: `@sveltejs/adapter-vercel`
- **Database client**: `postgres` (postgres-js) — see Phase 2 note below
- **Styling**: Tailwind v4 (Vite plugin) + `@tailwindcss/forms` + `@tailwindcss/typography`
- **Package Manager**: npm

## Commands

```sh
npm run dev          # vite dev server
npm run build        # vite build (also runs prepack: svelte-package + publint)
npm run preview      # preview production build
npm run check        # svelte-kit sync && svelte-check (typecheck)
npm run check:watch  # same, watch mode
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run migrate      # apply pending SQL migrations to DATABASE_URL (tsx scripts/migrate.ts)
npm run demo:seed    # seed Hans Ruber demo org (transitional — see scripts/seed-demo.ts)
```

There is no test runner configured. Don't invent one — `check` (svelte-check) and `lint` are the only verification gates.

## Two Deployment Targets — Do Not Conflate

### 1. Demo Site (team-hosted)

- Hosted by the DavidPM team as a live product demo
- Uses **Supabase Postgres** as the database
- `DATABASE_URL` in `.env` points to the Supabase project connection string

### 2. Customer Source Code Package

- Delivered as a zip on perpetual-license purchase; customer owns the source
- Uses **plain PostgreSQL** — no Supabase dependency
- No Supabase RLS or GoTrue auth — access control is enforced at the application layer
- `.env.example` ships with `postgres://user:password@host:port/db-name` for any provider (Neon, Railway, self-hosted)

**Key rule**: DB-related code must remain provider-agnostic. No Supabase-specific APIs, no RLS, no `auth.uid()`. The Supabase connection is purely infrastructure for the demo site.

The full delivery model — what ships, the three deployment options (Direct Install / Docker Compose / Customer Infrastructure), what does NOT ship — is in `docs/Primer-Delivery.md`. The phased refactor plan toward that target lives in `docs/delivery-plan/00-overview.md` and onward.

## Architecture

### Request lifecycle

`src/hooks.server.ts` runs two hooks via `sequence()`:

1. **`handleLocale`** — resolves locale from the `primer_lang` cookie or `Accept-Language` header into `event.locals.locale`, then substitutes `%lang%` and `%dir%` (`rtl`/`ltr`) in `src/app.html`.
2. **`handleAuth`** — reads the `primer_session` cookie, calls `validateSession()` from `$lib/server/auth/index.js`, populates `event.locals.user` and `event.locals.isAdmin`. Auth failures must never 500 — log and continue unauthenticated.

`event.locals` shape is declared in `src/app.d.ts` (`locale`, `user`, `isAdmin`).

### Routes

- `src/routes/+page.server.ts` — public landing
- `src/routes/auth/*` — `login`, `register`, `logout`, `forgot-password`, `reset-password`, `verify-email`. Cookie-based session auth, scrypt password hashing.
- `src/routes/app/*` — authenticated app. `+layout.server.ts` requires `locals.user`, redirects to `/auth/login` if missing, and to `/app/setup` if the user has no org membership. It also computes navigation flags (`hasDirectReports`, `isManagerOfManagers`, `hasPeers`, `isSystemAdmin`, `isHrAdmin`, `isParticipant`, `needsPlacement`, `showVisibilityTab`) consumed by `+layout.svelte`. Sub-routes: `goals`, `inquiries`, `leaders`, `peers`, `reports`, `team`, `settings`, `setup`, `admin`, `api`.

### Server modules (`src/lib/server/`)

- **`db.ts`** — exposes **two** clients during the in-flight Supabase → postgres-js migration (Phase 2):
  - `sql` (postgres-js tagged template) is the **target** client. Use this for all new code. Helpers `one`, `maybeOne`, `many` wrap the common shapes.
  - `db` (typed `@supabase/supabase-js` admin client) is **legacy**, kept only for un-migrated call sites. Will be removed at the end of Phase 2. Don't add new call sites against it.
- **`auth/index.ts`** — scrypt password hashing, sessions (`primer_session` cookie, 7-day TTL), email-verification and password-reset tokens. All auth queries go through `sql`. This file already implements the customer-package auth model — there is no other auth provider to switch to.
- **`permissions.ts`** — the role × hierarchy authorization matrix. Every authorization decision should flow through this module. Two dimensions: org_role (`owner`, `system_admin`, `hr_admin`, `editor`, `participant`, `viewer`) and tree position (ancestor/peer/self). `system_admin` bypasses hierarchy; `hr_admin` is org-wide member management without metric/snapshot powers; `verifyManagementAccess` and `verifySnapshotAdjustAccess` are the canonical entry points.
- **`hierarchy.ts`** — tree traversal helpers (`getSubtreeNodeIds`, `getDirectChildNodeIds`, `isAncestorOf`). Uses in-memory tree walks rather than recursive CTEs for portability across Postgres providers.
- **`action-context.ts`** — SvelteKit form actions don't get the `parent()` function (load-only). `loadActionContext(userId)` rebuilds the org/membership/userNode/`hasDirectReports` context that `/app/+layout.server.ts` produces, so actions can branch consistently. Returns `null` when the user has no membership — caller should `fail(403, …)`.
- **`csv.ts`**, **`postmark/`**, **`license/`**, **`demo/`** — CSV parsing, transactional email, license stub, demo-org seeding.

### Database schema

Two parallel migration directories exist during the transition:

- **`migrations/`** — the **canonical** customer-package SQL, applied by `npm run migrate` (`scripts/migrate.ts`). Tracked in a `schema_migrations` table; each filename runs exactly once in lexical order. Plain PostgreSQL, no Supabase features.
- **`supabase/migrations/`** — legacy migration set used by the demo site's Supabase deployment. Don't add new migrations here — add to `migrations/` instead.

`seeds/*.sql` is the canonical demo seed data; `supabase/seeds/` is its legacy mirror.

Domain tables you'll see referenced everywhere: `users`, `organizations`, `org_members`, `org_hierarchy_nodes` (self-referencing tree via `parent_id`), `org_goals`, `metrics`, `metric_thresholds`, `score_snapshots`, `performance_logs`, `inquiries`, `audit_log_entries`, `sessions`. Domain types in `src/lib/types/index.ts`.

### Domain model — Tier framework

Performance is assessed against a five-level tier scale (`alarm` → `concern` → `content` → `effective` → `optimized`, numeric 1–5) defined in `src/lib/types/index.ts`. Metrics have measurement types (`numeric`, `percentage`, `currency`, `binary`, `scale`, `milestone`, `checklist`, `range`, `qualitative`), per-tier thresholds, weights, and produce immutable `score_snapshots`. Hierarchy node types (`executive_leader`, `department`, `team`, `individual`) have containment rules (`CONTAINMENT_RULES`, `VALID_PARENTS`).

## Internationalization

Every page operates in nine languages. **No hardcoded user-facing strings** in `.svelte`, `+page.svelte`, or `+server.ts` responses.

| Code | Language               |
| ---- | ---------------------- |
| en   | English                |
| zh   | 中文 (Chinese)         |
| es   | Español (Spanish)      |
| ar   | العربية (Arabic, RTL)  |
| fr   | Français (French)      |
| de   | Deutsch (German)       |
| ja   | 日本語 (Japanese)      |
| pt   | Português (Portuguese) |
| ko   | 한국어 (Korean)        |

- **Locale files**: `src/lib/i18n/{locale}.json`, flat key-value, dot-namespaced keys (e.g. `nav.home`, `demo.weight_total`).
- **Helper**: `t(locale, key, vars?)` from `src/lib/i18n/index.ts`. Interpolation uses `{name}` syntax. Missing non-English keys fall back to English with a `console.warn`.
- **Adding strings**: add to `en.json` first, then mirror into all eight other locale files. `validateLocales()` enforces completeness.
- **Cookie**: `primer_lang` (one year, `SameSite=Lax`). Set by the language switcher; not URL-path-based.
- **RTL**: Arabic requires `dir="rtl"` (set in the locale hook) and Tailwind `rtl:` variants for any directional styling.

## Code Quality Bar (customer-readable codebase)

Customers will read, modify, and maintain this code without external support. That changes the bar:

- Write JSDoc on public functions, types, and modules — many existing modules (`db.ts`, `permissions.ts`, `auth/index.ts`, `i18n/index.ts`) already model this well.
- Inline comments for non-obvious business rules (e.g. why `system_admin` bypasses hierarchy, why hr_admin is excluded from snapshot adjustment).
- Prefer descriptive names over comments where naming alone suffices.

## Tooling notes

- ESLint config (`eslint.config.js`) allows `_`-prefixed unused vars and turns off `svelte/no-navigation-without-resolve` (no base path is configured).
- Prettier is the single source for formatting; ESLint defers to it.
- The `.svelte-kit/` directory is generated — it shows up modified in `git status` after running `dev`/`build`/`check`. Don't commit it (it's gitignored), and don't read its files for understanding the codebase.

## Svelte MCP server

You have access to a Svelte MCP server with comprehensive Svelte 5 / SvelteKit documentation:

- **`list-sections`** — call FIRST when working on Svelte/SvelteKit topics. Returns titles, use_cases, paths.
- **`get-documentation`** — fetch full content for the relevant sections (use the `use_cases` field to pick).
- **`svelte-autofixer`** — run on any Svelte code you write, repeatedly until it returns no issues.
- **`playground-link`** — only generate after user confirmation, and **never** when code was written to files in this project.
