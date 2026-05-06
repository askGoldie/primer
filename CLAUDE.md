# CLAUDE.md

Orientation document for AI assistants (Claude Code, Cursor, ChatGPT) and human developers working in this repository.

If you are an AI assistant: read this file first. It tells you how this codebase is organized, what conventions to follow, and what not to break. Customers rely on this file to keep AI-driven changes safe.

---

## What Primer is

A self-hosted SvelteKit web application for organizational performance management. It is distributed as a perpetual source-code license — customers receive a zip, run it on their own infrastructure, modify it freely, and never talk to a license server. There is no SaaS, no telemetry, no phone-home. The customer owns the code and is expected to modify it.

---

## The two questions you'll be asked first

- **"How do I run it?"** → Read `README.md`. Two paths: direct install (`npm install && npm run migrate && npm run seed && npm run build && node build`) or Docker Compose (`docker compose up -d`).
- **"How do I change a string visible to users?"** → It goes through the i18n system. Never hardcode user-facing strings in `.svelte`, `+page.svelte`, or `+server.ts` files. See [Internationalization](#internationalization-non-negotiable) below.
- **"Where does data live?"** → PostgreSQL. Schema in `migrations/`, demo data in `seeds/`. Server-side access goes through `src/lib/server/db.ts` (postgres-js, no ORM).
- **"How does login work?"** → `src/lib/server/auth/index.ts`. Scrypt-based password hashing, sessions in a `primer_session` cookie. Most customers replace this with their own SSO — see [Auth](#auth-how-it-works-in-30-seconds) below.
- **"Is there telemetry?"** → No. Primer makes zero outbound network calls at runtime.

---

## Project layout

```
primer-source/
├── README.md                 ← Start here for installation
├── CLAUDE.md                 ← This file
├── package.json
├── docker-compose.yml        ← Option B: one-command deploy
├── Dockerfile                ← Used by docker-compose
├── caddy/                    ← Reverse proxy config (Option B)
├── migrations/               ← SQL schema migrations (run via `npm run migrate`)
├── seeds/                    ← Demo data (run via `npm run seed`)
├── scripts/                  ← migrate.ts, seed.ts
├── static/                   ← Logos, favicon, fonts
└── src/
    ├── routes/
    │   ├── auth/             ← Login, register, password reset (placeholder; replace for SSO)
    │   ├── app/              ← The product (goals, peers, hierarchy, settings, etc.)
    │   └── api/              ← Internal API endpoints (health, exports)
    ├── lib/
    │   ├── components/       ← Reusable Svelte components
    │   ├── i18n/             ← Translation files (one .json per language)
    │   ├── server/           ← Server-only code (DB, auth, permissions, hierarchy)
    │   └── types/            ← TypeScript type definitions
    ├── app.html              ← HTML shell with %lang%/%dir% placeholders
    └── hooks.server.ts       ← Locale detection, session validation, route guards
```

---

## Project configuration (the facts that don't change)

```
Language:        TypeScript
Framework:       Svelte 5 (with runes mode), SvelteKit 2
Adapter:         @sveltejs/adapter-node
Database:        PostgreSQL 15 or later
DB client:       postgres-js (no ORM)
Auth:            Application-layer scrypt (src/lib/server/auth/index.ts)
Styling:         Tailwind CSS 4 (theme tokens in src/routes/layout.css)
Package manager: npm
Tests:           svelte-check (type checks), eslint, prettier — no runtime test framework
```

Runes mode is forced everywhere except `node_modules` (see `svelte.config.js`).

---

## The three deployment options

One paragraph each. Full instructions in `README.md`.

- **Option A — Direct Install:** Node 20 + a Postgres 15+ database somewhere. See `README.md` § "Option A".
- **Option B — Docker Compose:** Docker Engine + Compose v2. App, Postgres, and Caddy reverse proxy in three containers. See `README.md` § "Option B".
- **Option C — Your Infrastructure:** Combine Option A with your existing managed Postgres, identity provider, and reverse proxy. The auth layer is intentionally a placeholder and is expected to be swapped — contact DavidPM support for an integration walkthrough.

---

## Internationalization (non-negotiable)

This is the most-violated rule when AI assistants modify SvelteKit codebases. Make it impossible to miss.

- **Never hardcode user-facing strings** in `.svelte`, `+page.svelte`, `+server.ts`, or any other file that renders to a user. Always use `t('key.name')` from `$lib/i18n/index.ts`.
- **Locale files** live at `src/lib/i18n/{locale}.json`. Flat key-value pairs. Dot-namespaced keys (e.g. `nav.home`, `settings.org.title`).
- **Adding a new key:** add it to `en.json` first, then mirror into every other locale file. `validateLocales()` enforces this at build time.
- **Interpolation:** `t('demo.weight_total', { total: 95 })` for `"demo.weight_total": "Total: {total}%"`.
- **Supported languages:** English (en), Chinese (zh), Spanish (es), Arabic (ar), French (fr), German (de), Japanese (ja), Portuguese (pt), Korean (ko).
- **Arabic is RTL.** Components with directional layout must use Tailwind `rtl:` utility variants. The HTML `dir` attribute is set automatically by `hooks.server.ts` based on the user's locale cookie (`primer_lang`).
- **Common task: change the displayed application name.** Edit the `app.name` key in every locale file. Do not search-and-replace strings in components.

---

## Database access (non-negotiable)

- **All server-side database access** goes through `src/lib/server/db.ts`, which exports a `postgres-js` tagged-template `sql` plus three helpers: `one`, `maybeOne`, `many`.
- **Use parameterized queries.** `sql\`select * from users where id = ${userId}\`` — postgres-js handles parameterization. **Never** string-concatenate user input into SQL.
- **Schema changes go in `migrations/`.** Add a new file (`migrations/YYYYMMDDHHMMSS_description.sql`); never modify existing migration files. Customers' existing databases have already applied them. The runner (`scripts/migrate.ts`) tracks applied filenames in a `schema_migrations` table.
- **Application-layer permissions live in `src/lib/server/permissions.ts`.** Do not add Postgres RLS policies — Primer does not use them and adding them complicates upgrades. The role × hierarchy authorization matrix is the canonical entry point for access decisions.
- **Demo data goes in `seeds/`.** Same idempotency model: `scripts/seed.ts` tracks applied filenames in `schema_seeds`.

---

## Auth: how it works in 30 seconds

- Login form posts to `/auth/login`. The server looks up the user by email, calls `verifyPassword(input, user.password_hash)`, calls `createSession(user.id)`, and sets the `primer_session` httpOnly cookie. That's it.
- `hooks.server.ts` reads the cookie on every request, calls `validateSession()`, and populates `event.locals.user`. Routes under `/app` redirect to `/auth/login` if `locals.user` is null.
- Passwords are scrypt-hashed via `src/lib/server/auth/index.ts`. Sessions are random 32-byte tokens stored in the `sessions` table.
- **The bundled flow is intentionally a placeholder.** Most Option C deployments swap the entire `src/lib/server/auth/` module for an OIDC/SAML/LDAP integration. The contract downstream code depends on is `event.locals.user` — replace `validateSession()` with a call to your provider; everything that reads `locals.user` keeps working.

---

## Common customizations and where to do them

| Customer request                | Touch                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Change the application name     | `app.name` key in every `src/lib/i18n/*.json`                                                          |
| Replace the logo                | `static/logo.svg`, `static/logo.png`, `static/logo.webp`, `static/favicon.svg`                         |
| Change brand colors             | `src/routes/layout.css` `@theme { ... }` block (Tailwind 4 theme tokens)                                |
| Add a language                  | New file `src/lib/i18n/<code>.json`; register in `src/lib/i18n/index.ts`                                |
| Disable a product feature       | Delete the route folder under `src/routes/app/`; remove nav entries; remove its i18n keys              |
| Connect to existing Postgres    | Edit `DATABASE_URL` in `.env`                                                                          |
| Wire a transactional email      | Replace the `console.log` lines in `src/routes/auth/{register,forgot-password,verify-email}/...` with your provider's SDK |
| Add an SSO provider             | Replace `src/lib/server/auth/` with provider SDK; preserve the `validateSession()` shape used by hooks |
| Add a custom report or export   | New route under `src/routes/app/reports/`; new SQL query in the loader                                  |

---

## Code quality expectations

- TypeScript strict; `npm run check` must pass.
- JSDoc on public functions, types, and modules. Document _why_ when the why isn't obvious from the code; don't restate _what_.
- Inline comments only when the logic surprises (a workaround, a hidden invariant, a regulatory rule).
- New components: descriptive name, props documented with JSDoc, default values where reasonable.
- No emojis in code, comments, or commit messages.
- Don't add features that weren't requested. Don't refactor unrelated code while making a fix.

---

## What NOT to do

- **Do not hardcode user-facing strings.** Use `t()`. (See [Internationalization](#internationalization-non-negotiable).)
- **Do not add Postgres RLS or `auth.uid()` calls in migrations.** Application-layer permissions only — they live in `src/lib/server/permissions.ts`.
- **Do not introduce ORM dependencies.** The codebase uses postgres-js with raw SQL by design — readability for customers > developer ergonomics.
- **Do not add telemetry, analytics, or "phone home" code.** Primer's contract with customers is zero outbound calls at runtime.
- **Do not add new dependencies casually.** Each dependency is a thing the customer must trust and keep updated. Prefer copying ~50 lines into the codebase over adding a 500-line library.
- **Do not modify migration files after they've been added.** Add a new migration that alters the schema; never edit an existing one. The same applies to seed files.
- **Do not split this codebase into a multi-package monorepo.** Customers received a single zip; keep the layout flat.
- **Do not introduce a runtime test framework casually.** `npm run check` (type checks) and `npm run lint` are the existing gates. If you genuinely need tests, ask before adding a runner.

---

## AI-assistant-specific guidance

If you are Claude Code or a similar agent:

- The repository is a single SvelteKit project. Do not propose a "monorepo restructure", do not add workspace tooling, do not split `src/lib` into separate packages.
- After any non-trivial change, run `npm run check` and `npm run lint`. Both must pass.
- If your tooling has a Svelte MCP server available, use `list-sections` and `get-documentation` to look up Svelte 5 / SvelteKit patterns rather than guessing. Run `svelte-autofixer` after writing any Svelte code. If no MCP server is available, consult [svelte.dev/docs](https://svelte.dev/docs) before writing component code.
- When you change a file path, env var, or script name, update this CLAUDE.md and `README.md` so they keep agreeing with the code.
