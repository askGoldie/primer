# 05 — Spec for the Customer-Facing CLAUDE.md

Phase 4. The current `CLAUDE.md` at the project root assumes two deployment targets (DavidPM's demo site + the customer package). After Phases 1–3, only the customer package exists. This doc specifies what the **customer-facing** `CLAUDE.md` should contain — the one that ships in the zip and sits on the customer's disk forever.

> **Pre-read:** [`00-overview.md`](./00-overview.md). The customer CLAUDE.md is the AI-assistant-readable counterpart to `06-customer-quickstart.md` (which is for humans). Both ship in the zip; both must be in sync.

---

## Audience

Two readers, in this order:

1. **An AI coding assistant** (Claude Code, Cursor, ChatGPT) acting on behalf of a customer who wants to modify the codebase. The customer may or may not be a developer; the AI is the bridge.
2. **A human developer** at the customer org reading the file directly to orient themselves.

Both readers come in cold. They have not seen the source before. They do not know who DavidPM is. They have a goal — usually one of: "get this running", "change the branding", "add a language", "swap the auth provider", "connect to our SSO", "add a custom report", "find where X happens".

The CLAUDE.md must let either reader find the right answer in under two minutes.

---

## What CLAUDE.md is for, in one paragraph

> CLAUDE.md is the **invariant orientation document** for the codebase. It tells a fresh reader what this software is, what conventions it follows, where things live, and what _not_ to break. It does not duplicate the README (which is task-oriented: how to install). It does not duplicate the code (which is the source of truth for behavior). It is the bridge between "I just downloaded a zip" and "I can confidently change a file."

---

## Required sections

The customer CLAUDE.md should contain **exactly these sections**, in this order. Each section's content is specified below.

### 1. What Primer is

One paragraph. No marketing fluff. Tell a fresh reader (or AI) what kind of software this is: a self-hosted SvelteKit web application for organizational performance management, distributed as perpetual-licensed source code. Mention that the customer owns the code and is expected to modify it.

### 2. The two questions you'll be asked first

A short FAQ that pre-empts the most common AI-assistant-coming-in-cold queries:

- "How do I run it?" → point to `README.md`.
- "How do I change a string visible to users?" → it goes through the i18n system; never hardcode.
- "Where does data live?" → Postgres, schema in `migrations/`, seed in `seeds/`, accessed via `src/lib/server/db.ts`.
- "How does login work?" → `src/lib/server/auth/index.ts` (scrypt-based; no third-party auth).
- "Is there telemetry?" → No. Primer makes zero outbound network calls at runtime.

### 3. Project layout

A directory tree with a one-line description per folder. Limit to top-level + one level of `src/`. Don't enumerate every file. Example:

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
├── docs/                     ← Architecture, integration, changelog
├── static/                   ← Logos, favicon, fonts
└── src/
    ├── routes/
    │   ├── auth/             ← Login, register, password reset
    │   ├── app/              ← The product (goals, peers, hierarchy, etc.)
    │   └── api/              ← Internal API endpoints (health, exports)
    ├── lib/
    │   ├── components/       ← Reusable Svelte components
    │   ├── i18n/             ← Translation files (one .json per language)
    │   ├── server/           ← Server-only code (DB, auth, permissions)
    │   ├── stores/           ← Client state stores
    │   └── types/            ← TypeScript type definitions
    └── hooks.server.ts       ← Locale detection, session validation, route guards
```

### 4. Project configuration (the facts that don't change)

Re-use the relevant subset from today's CLAUDE.md, but trimmed to what a customer actually needs:

```
Language:        TypeScript
Framework:       Svelte 5 (with runes mode), SvelteKit 2
Adapter:         @sveltejs/adapter-node
Database:        PostgreSQL 15 or later
DB client:       postgres-js (no ORM)
Auth:            Application-layer scrypt (src/lib/server/auth/index.ts)
Styling:         Tailwind CSS 4
Package manager: npm
Tests:           svelte-check (type checks), eslint, prettier
```

**Removed compared to today's CLAUDE.md:** the "Add-ons" line that listed Supabase, MCP, etc. — those are irrelevant to customers.

### 5. The two deployment options

One paragraph each, then point at the README. Do not duplicate the README content here.

- **Option A — Direct Install:** Node 20 + Postgres 15. See `README.md` § "Option A".
- **Option B — Docker Compose:** Docker Engine + Compose. See `README.md` § "Option B".
- **Option C — Your Infrastructure:** Combine Option A with your existing managed Postgres / SSO / reverse proxy. See `docs/integration-guide.md`.

### 6. Internationalization (i18n) — non-negotiable rule

This is the most-violated rule when AI assistants modify Svelte/SvelteKit codebases. Make it impossible to miss:

- **Never hardcode user-facing strings in `.svelte`, `+page.svelte`, `+server.ts`, or any other file rendered to the user.** Always use `t('key.name')` from `$lib/i18n/index.ts`.
- **Locale files** live at `src/lib/i18n/{locale}.json`. Flat key-value pairs. Dot-namespaced keys.
- **When you add a new key:** add it to `en.json` first, then to every other locale file. Build validation enforces this.
- **Interpolation:** `t('demo.weight_total', { total: 95 })` for `"demo.weight_total": "Total: {total}%"`.
- **Supported languages:** English, Chinese (zh), Spanish (es), Arabic (ar), French (fr), German (de), Japanese (ja), Portuguese (pt), Korean (ko).
- **Arabic is RTL.** Components with directional layout must use Tailwind `rtl:` utility variants. The HTML `dir` attribute is set automatically by `hooks.server.ts` based on the user's locale cookie (`primer_lang`).
- **Common task: change the displayed application name.** Edit the `app.name` key in every locale file. Don't search-and-replace strings.

### 7. Database access — non-negotiable rule

- **All server-side database access** goes through `src/lib/server/db.ts`, which exports a `postgres-js` tagged-template `sql`.
- **Use parameterized queries.** `sql\`select * from users where id = ${userId}\`` — postgres-js handles parameterization. **Never** string-concatenate user input into SQL.
- **Schema changes go in `migrations/`.** Add a new file (`migrations/YYYYMMDDHHMMSS_description.sql`); never modify existing migration files. Customers' existing databases have already applied them.
- **Application-layer permissions live in `src/lib/server/permissions.ts`.** Do not add Postgres RLS policies — Primer does not use them and adding them complicates upgrades.

### 8. Auth — how it works in 30 seconds

- Login form posts to `/auth/login`. Server looks up user by email, calls `verifyPassword(input, user.password_hash)`, calls `createSession(user.id)`, sets `primer_session` httpOnly cookie. That's it.
- `hooks.server.ts` reads the cookie on every request, calls `validateSession()`, populates `event.locals.user`. Routes under `/app` redirect to `/auth/login` if `locals.user` is null.
- Passwords are scrypt-hashed via `src/lib/server/auth/index.ts`. Sessions are random 32-byte tokens stored in the `sessions` table.
- **To replace with SSO/OIDC/SAML:** swap the `validateSession()` implementation to call your provider; everything downstream still works because it only reads `locals.user`. See `docs/integration-guide.md`.

### 9. Common customizations and where to do them

A table that maps the most likely customer requests to specific files:

| Customer request                       | Touch                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Change the application name             | `app.name` key in every `src/lib/i18n/*.json`                                       |
| Replace the logo                       | `static/logo.svg`, `static/logo.png`, `static/logo.webp`, `static/favicon.svg`     |
| Change brand colors                    | `tailwind.config.js` (or wherever the theme tokens land); search for `brand-` classes |
| Add a language                         | New file `src/lib/i18n/<code>.json`; register in `src/lib/i18n/index.ts`           |
| Disable a product feature              | Delete the route folder under `src/routes/app/`; remove nav entries                 |
| Connect to existing Postgres           | Edit `DATABASE_URL` in `.env`                                                       |
| Replace email provider                 | `src/lib/server/postmark/*` → swap to your SDK; the helpers it exports are stable   |
| Add an SSO provider                    | Replace `src/lib/server/auth/*` with provider SDK; keep `validateSession()` shape   |
| Add a custom report or export          | New route under `src/routes/app/reports/`; new SQL query in the loader              |

### 10. Code quality expectations

Brief, concrete:

- TypeScript strict; `npm run check` must pass.
- All JSDoc comments are written for **the next person to read this code**, not for the original author. Document _why_ when the why isn't obvious from the code; don't restate _what_.
- Inline comments only when the logic surprises (a workaround, an invariant, a regulatory rule).
- New components: descriptive name, props documented with JSDoc, default values where reasonable.
- No emojis in code, comments, or commit messages.
- Don't add features that weren't requested. Don't refactor unrelated code while making a fix.

### 11. What NOT to do

A short list of things that will go wrong if violated:

- **Do not hardcode user-facing strings.** Use `t()`.
- **Do not add Postgres RLS or `auth.uid()` calls in migrations.** Application-layer permissions only.
- **Do not introduce ORM dependencies.** The codebase uses postgres-js with raw SQL by design — readability for customers > developer ergonomics.
- **Do not add telemetry, analytics, or "phone home" code.** Primer's contract with customers is zero outbound calls at runtime.
- **Do not add new dependencies casually.** Each dependency is a thing the customer must trust and keep updated. Prefer copying ~50 lines into the codebase over adding a 500-line library.
- **Do not modify migration files after they've been added.** Add a new migration that alters the schema; never edit an existing one.
- **Do not split this codebase into a multi-package monorepo.** Customers received a single zip; keep the layout flat.

### 12. AI-assistant-specific guidance (if Claude Code or similar)

If the customer is using Claude Code or a similar agent, include guidance that the agent will pick up:

- The full Svelte 5 + SvelteKit documentation is available via the Svelte MCP server (if configured). Use `list-sections` and `get-documentation` to look up patterns rather than guessing.
- Use `svelte-autofixer` after writing any Svelte code.
- Run `npm run check` and `npm run lint` after any non-trivial change.
- The repository is a single SvelteKit project — do not create a "monorepo restructure" plan, do not add workspace tooling.

(If Phase 4 decides not to assume the customer has the Svelte MCP server, drop these specific tool references and replace with prose: "consult the Svelte 5 documentation at svelte.dev/docs before writing component code".)

---

## What to remove from today's CLAUDE.md

Lines 1–88 of the current root `CLAUDE.md` were written for the dual-target world (demo + customer). The customer-facing version drops:

- The "Two distinct deployment targets — do not conflate them" framing entirely. There is only one target now: the customer.
- The "Demo Site (team-hosted)" section entirely.
- The reference to `/docs/multilingual-implementation-spec.md` (that file is gone; the i18n facts are inlined into the CLAUDE.md instead).
- The "Add-ons: …, supabase, mcp" line.

Lines 91–113 (Svelte MCP server tool docs) are reasonable to keep but framed as "if your AI assistant has access to a Svelte MCP server, here's how to use it" rather than a project-wide assumption.

---

## Length budget

Today's CLAUDE.md is ~113 lines. The customer-facing version should be **150–250 lines**. Long enough to be self-contained; short enough that a fresh reader will actually read it. If a section needs more detail, link to a doc in `docs/` rather than expanding the section.

---

## Validation before declaring this section of Phase 4 done

1. **Cold-read test.** Hand the file (and only the file) to someone who has never seen this project. Ask them: "What does this software do? How would you change the displayed app name? Where would you add a new database table? Where does login validation happen?" If they can't answer all four in under five minutes, the file isn't doing its job.
2. **AI-assistant test.** Open Claude Code in the project folder. Ask it to "change the application name from Primer to Acme." If it edits a hardcoded string anywhere instead of editing locale files, the i18n section needs to be more emphatic.
3. **Truth test.** Every file path mentioned must exist. Every `npm run` command must work. Every behavior described must match the code at HEAD.

---

## Relationship to the README and llms.txt

Same project, three doors:

- `README.md` (`06-customer-quickstart.md`) — task-oriented. "Do these steps and the app runs."
- `CLAUDE.md` (this doc) — orientation-oriented. "Here's how the codebase is organized and what rules to follow."
- `llms.txt` (Phase 4 follow-up) — machine-oriented. Structured table of contents pointing AI assistants at the right doc for the right question.

All three must agree. When something changes (new env var, new script, moved file), all three need an edit. The verification in Phase 4 includes a cross-check pass.
