# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Folder Is

**This folder IS the customer-deliverable zip file.** When someone purchases a Primer perpetual license, they download exactly this folder. It is not a demo site, not a marketing site, not a SaaS product.

**The demo site lives at https://www.primer.company — a separate codebase, not in this repo.** This folder will never be posted online. It ships as a zip and runs locally on the customer's own hardware.

The two are operationally identical from the customer's point of view: when a customer boots this zip with `npm run ...` (or `docker compose up -d`), they must see the same `/app` product the demo site shows. That's the proof of life — "the thing I evaluated online really is mine to run."

Read `docs/Primer-Delivery.md` for the full delivery specification — it is the source of truth for what ships, who it ships to, and how it gets deployed.

---

## The Buyer → IT Handoff Flow

The customer journey through this zip is **two-stage**, and both stages must work:

**Stage 1 — Buyer self-evaluation (often non-technical).** A buyer (HR Director, VP Ops, CIO) downloads the zip, runs `npm run ...` or `docker compose up -d`, and lands on `/login`. They are usually NOT going to configure real auth themselves. So the login page exposes a prominent, debug-styled **"Override Auth to Access"** button that bypasses authentication entirely and drops the visitor into a seeded admin session. This is intentional, intentional-looking (loud, not subtle), and removable by the IT team in production.

**Stage 2 — IT handoff.** Once convinced, the buyer forwards the zip to their IT team. IT must experience the **complete `/app` product** exactly as the buyer saw it. This is what was paid for. **Make only minimal alterations under `/app/*`** — the routes, components, server loads, and form actions there are the deliverable.

Implication: the auth system has two modes — a built-in password path for IT, and a one-click override for the buyer. Both must coexist and both must land in the same downstream `locals.user` shape so every `/app` route works identically.

---

## Project Configuration

- **Language**: TypeScript
- **Framework**: Svelte 5 with runes (project-wide rune mode forced in `svelte.config.js`)
- **Package Manager**: npm
- **Database**: PostgreSQL 15+ (plain Postgres — no Supabase, no managed-service dependency)
- **Adapter**: Node (`@sveltejs/adapter-node`) so customers can run `node build` on their own server. The current adapter setting may still reference Vercel; replace with adapter-node when touched.

This folder is shipped as a SvelteKit **application**, not a library. If `package.json` currently has `svelte-package` / `dist/` / `peerDependencies` library wiring left over from earlier scaffolding, it should be flattened into a plain app config.

---

## Common Commands

```sh
npm run dev              # Vite dev server — local development
npm run build            # Production build
npm run preview          # Preview production build
npm run check            # svelte-check + tsc — run after Svelte/TS changes
npm run check:watch      # check in watch mode
npm run lint             # prettier --check . && eslint .
npm run format           # prettier --write .
npm run migrate          # Apply all SQL files in migrations/ via psql $DATABASE_URL
npm run seed             # Load demo data (Meridian Construction sample org)
node build               # Start the production server (after npm run build)
```

There is **no test runner configured**. Verify with `check`, `lint`, and manual exercise of the relevant route. Don't fabricate `npm test`.

If commands above don't exist yet under those exact names (e.g. you find `supabase:migrate` or `demo:seed`), rename them to the names above when you touch them — these are the names the README, `llms.txt`, and `docs/Primer-Delivery.md` promise the customer.

---

## Deployment Options

Per `docs/Primer-Delivery.md`, this folder supports **two** deployment options. Don't add a third.

### Option A — Direct Install
The customer runs Node.js directly against their own PostgreSQL.
```
cp .env.example .env       # set DATABASE_URL
npm install
npm run migrate
npm run seed               # optional
npm run build && node build
```

### Option B — Docker Compose
One command brings up the app, Postgres, and a Caddy reverse proxy.
```
cp .env.example .env       # defaults work for evaluation
docker compose up -d
```

### Option C is intentionally out of scope
"Your Infrastructure" deployment is satisfied by IT teams adapting Options A or B to whatever they already run. We **cannot know** the customer's infrastructure (their RDBMS, SSO, reverse proxy, backup tooling, network topology), so we don't guess. Don't add infrastructure-specific code, integrations, or assumptions to this folder.

---

## Licensing Model

Sold as a **perpetual source code license**. The customer owns the source — every line is readable, no obfuscation, no minification, no license server, no telemetry, no phone-home. Treat this as the operative constraint for every architectural choice: if it can't run fully offline on the customer's hardware, it doesn't belong here.

---

## High-Level Architecture

### Routes

- **`/app/*`** — the authenticated product (goals, leaders, peers, performance, reports, settings, team, visibility, admin, inquiries, onboarding, setup, stack). **This is the deliverable.** Minimal alterations.
- **`/login`** — auth entry point. Hosts the prominent debug **"Override Auth to Access"** button alongside the normal password form.
- **`/auth/*`** — supporting auth flows: `callback`, `forgot-password`, `logout`, `register`, `reset-password`, `verify-email`.
- **`/platform`** — single-page persona picker. After login, the visitor chooses which seeded employee of the sample org to "play as." This is what makes the demo data feel like a real company.
- **`/api/{download,export}`** — small server endpoints for data export.
- **Root** (`/+page.server.ts`) — bounces visitors to `/login` or `/app` depending on session state.

There is no `/web/*` marketing tree in this folder. Marketing pages live on the demo site (primer.company), not in the customer zip.

### Route gating

- `src/routes/app/+layout.server.ts` is the gate for `/app/*`: if `locals.user` is null, redirect to `/login`. (Not done in `hooks.server.ts`.)
- `src/hooks.server.ts` `handleGuards` gates `/platform` — it requires an authenticated session (real or override).
- `/login` and `/auth/*` are public.

### Authentication

The auth surface has **two modes** that both populate the same `locals.user`:

1. **Built-in password auth (scrypt-based).** This is what IT teams configure in production. The auth module is intentionally extensible — `docs/` includes guidance on swapping in OIDC, SAML, or LDAP by adapting the auth layer. Passwords are hashed with scrypt.
2. **Debug "Override Auth" button.** A loud, obviously-debug-styled button on `/login` that bypasses authentication and lands the visitor as a seeded admin. This is for buyers evaluating the product before IT takes over. The button must be visually unmistakable (debug-yellow / "DEBUG" ribbon / etc.) — it should look like something IT would remove, not something IT would miss.

Both paths land at the same downstream contract: `locals.user` populated, `locals.session` populated, `/app/+layout.server.ts` happy. This is the abstraction that keeps `/app` untouched regardless of auth mode.

If you find Supabase auth code in `src/hooks.server.ts` or elsewhere — it is leftover from the earlier dual-target setup and is being phased out. The Supabase client should not appear in the customer build. The DB client (`src/lib/server/db.ts`) should be plain `postgres` (the `postgres` npm package is already a dependency).

### Org hierarchy and permissions

The product models an organization as a tree of `org_hierarchy_nodes` (parent_id pointer chain). Authorization has two dimensions, both enforced in `src/lib/server/permissions.ts`:

1. **Role-based** (`org_role`): `owner`, `system_admin`, `hr_admin`, `editor`, `participant`, `viewer`. `system_admin` is the org-wide-management bypass for users who aren't ancestors in the tree.
2. **Hierarchy-based**: walk `parent_id` upward via `getAncestorIds()`. Management requires either `system_admin` or being an ancestor of the target node.

Use `verifyManagementAccess()` / `verifySnapshotAdjustAccess()` and the role-check helpers in `permissions.ts` for any new authorization decision — don't re-roll role checks inline.

### Form actions need their own context

SvelteKit's `parent()` is only available in `load`, not in actions. `src/lib/server/action-context.ts` exposes `loadActionContext(userId, cookies)` which mirrors what `/app/+layout.server.ts` produces. Use it instead of duplicating membership / node / `hasDirectReports` queries inside actions.

### Database access

- `src/lib/server/db.ts` exports `db` — the server-side query client. All server-side queries go through it. Types come from `$lib/types/database.ts`.
- Migrations live in `migrations/*.sql` (plain SQL) and are applied by `npm run migrate` (raw `psql` against `$DATABASE_URL`). No Supabase CLI, no managed-service migrations.
- Seeding is in `scripts/seed-demo.ts` — the Meridian Construction sample org with ~60+ users, hierarchy nodes, metrics, and scores. This is what makes the buyer's first run look like a real company.

The `db` client must remain provider-agnostic — no Supabase APIs, no RLS, no `auth.uid()`. Access control is enforced entirely at the application layer in `src/lib/server/permissions.ts`.

---

## Internationalization (i18n)

Every page operates in multiple languages. All user-facing strings are externalized — no hardcoded English strings in any `.svelte` file, `+page.svelte`, or `+server.ts` response.

### Supported Languages

| Code | Language               |
| ---- | ---------------------- |
| en   | English                |
| zh   | 中文 (Chinese)         |
| es   | Español (Spanish)      |
| ar   | العربية (Arabic)       |
| fr   | Français (French)      |
| de   | Deutsch (German)       |
| ja   | 日本語 (Japanese)      |
| pt   | Português (Portuguese) |
| ko   | 한국어 (Korean)        |

### Key Implementation Details

- **Locale files**: `/src/lib/i18n/{locale}.json` with flat key-value structure using dot-namespaced keys
- **Translation helper**: Use `t(locale, key, vars?)` from `src/lib/i18n/index.ts`. Pass `locals.locale` (server) or the locale store value (client).
- **Interpolation**: `{variable}` syntax for dynamic values
- **Fallback**: Missing keys in non-English locales fall back to English; missing keys in English log a warning and return the key
- **RTL support**: Arabic (`ar`) requires `dir="rtl"` and Tailwind `rtl:` utility variants. The `<html dir="...">` is set in `handleLocale` via `transformPageChunk`.
- **Language selection**: Cookie-based (`primer_lang`), not URL path-based. Falls back to `Accept-Language` header.

### Development Requirements

- **Never hardcode user-facing strings** — always use `t()` with a locale-file key
- **Add new keys to `en.json` first**, then all other locale files (`validateLocales()` enforces completeness)
- **RTL review required** for any component with directional styling

See `docs/multilingual-implementation-spec.md` for full details.

---

## Documentation & Code Quality Requirements

Customers will read, modify, and maintain this codebase. Their IT teams will audit it. Their AI assistants will navigate it. Treat the source as a published artifact:

- **Comprehensive JSDoc** on all public functions, types, and modules
- **Inline comments** explaining non-obvious logic, business rules, and the "why" behind a choice
- **Documented component props** with descriptions and usage notes
- **Clear file/folder structure**, with README files in key directories where it helps
- **Descriptive names** that convey intent without requiring a comment to translate them
- **Architectural decisions explained** in the relevant comments or docs

This is an explicit exception to general "minimal comments" defaults — this repo intentionally uses thorough JSDoc and inline rationale because customers own the source and AI assistants will read it.

`llms.txt` (at the repo root) provides structured context for AI assistants helping non-technical buyers deploy the zip. Keep it current with reality: file purposes, env vars, troubleshooting steps.

---

## Svelte MCP server

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation. Use it for any Svelte/SvelteKit question:

1. **`list-sections`** — call FIRST to discover available documentation sections
2. **`get-documentation`** — retrieve full content for the relevant sections (analyze `use_cases` to pick)
3. **`svelte-autofixer`** — run on any Svelte code before sending it to the user; iterate until clean
4. **`playground-link`** — generates a Svelte Playground link. Only after user confirmation, and never if the code was written to project files.
