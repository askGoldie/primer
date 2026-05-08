# 06 — Customer Quickstart: "What You Purchased"

Phase 4. Step-by-step walkthrough of what the customer receives when they buy Primer and how they get from "downloaded a zip" to "Primer is running and people are using it." This document **drafts the customer-shipping `README.md`** at the project root.

> **Pre-read:** [`00-overview.md`](./00-overview.md) and the Phase 3 specs ([`03-option-a-direct-install.md`](./03-option-a-direct-install.md), [`04-option-b-docker.md`](./04-option-b-docker.md)). This doc assumes those phases are done — every command and file path mentioned here must exist when this becomes the README.

---

## How to use this doc

1. Treat the body of this document as the **draft of `README.md`**. When Phase 4 begins, copy the content from "BEGIN README CONTENT" to "END README CONTENT" into `README.md` at the project root, then revise based on real testing.
2. Where a section says `<!-- spec: ... -->`, that's a note to the writer about what the section needs to do. Strip those before shipping.
3. Length target: ~400 lines. Long enough to be a complete walkthrough. Short enough that a non-technical buyer will read it, or paste it into an AI assistant in one go.

---

## Audience reminder

The reader is one of these people, in roughly this distribution:

- **40%:** A non-technical buyer (HR director, ops VP, CEO of a small company). They will paste this README into an AI assistant.
- **30%:** An IT generalist (someone who knows what Docker is but isn't a Linux expert).
- **20%:** A developer who's been told to "get this running."
- **10%:** A security/compliance reviewer skimming for risks.

Optimize for the first two. The other two will skim past the hand-holding without confusion.

---

## BEGIN README CONTENT

# Primer

A self-hosted leadership performance management platform. You bought it. You own the source. This README walks you through running it.

If you have an AI assistant (Claude, ChatGPT, Copilot), you can paste this entire file into it and ask for help on any step.

---

## What you have

This zip contains the complete Primer source code. Every file is readable. There is no obfuscation, no license server, no telemetry, and no ongoing requirement to talk to DavidPM.

Inside the zip:

```
primer-source/
├── README.md                 ← You are here
├── CLAUDE.md                 ← Orientation document for AI assistants and developers
├── package.json              ← Dependency list and scripts
├── docker-compose.yml        ← Option B: one-command deploy
├── Dockerfile
├── .env.example              ← Configuration template (annotated)
├── caddy/                    ← Reverse-proxy config (used by Option B)
├── migrations/               ← Database schema
├── seeds/                    ← Demo data
├── scripts/                  ← Migrate and seed runners
├── docs/                     ← Architecture, integration guide, changelog
├── static/                   ← Logos, favicon, fonts
└── src/                      ← Application source code
```

---

## What you need to run it

You need a computer (laptop or server) and a database. That's it.

### One of these runtimes:

| If you choose...   | You need...                          |
| ------------------ | ------------------------------------ |
| **Option A** (direct install) | Node.js 20 LTS                |
| **Option B** (Docker, recommended for most) | Docker Engine + Docker Compose v2 |

### And a database (PostgreSQL 15 or later):

- **Option B users:** A Postgres database is included in the Docker setup. You don't need to install Postgres separately.
- **Option A users:** You need a Postgres database somewhere. Options:
  - On your own laptop: `brew install postgresql@15` (Mac), or `apt install postgresql-15` (Ubuntu), or download the installer from postgresql.org (Windows).
  - Hosted: Neon, Railway, AWS RDS, Google Cloud SQL, Azure, Supabase — any service that gives you a Postgres connection string.

### Nothing else.

No external API keys. No accounts to create. No SaaS subscriptions. No internet connection required at runtime (after the initial install).

---

## Three deployment options

These are not three steps. They are three **paths**. Pick the one that fits you.

### Option A — Direct Install

For: developers, technical evaluators, single-server deployments.

You'll install Node, install dependencies, point the app at a Postgres database, and run it. ~15 minutes.

[Jump to Option A instructions](#option-a-instructions)

### Option B — Docker Compose

For: most teams, IT departments, anyone who wants "one command and it works."

You'll edit one file (the password) and run `docker compose up -d`. The app, the database, and the reverse proxy all start in containers. ~5 minutes.

[Jump to Option B instructions](#option-b-instructions)

### Option C — Your Existing Infrastructure

For: enterprises with existing managed Postgres, SSO, and reverse proxies.

You'll use Option A as the foundation, but point the app at your existing database, your existing identity provider, and your existing HTTPS termination. See [`docs/integration-guide.md`](./docs/integration-guide.md).

---

## Option A instructions

<!-- spec: this is the literal step-by-step. Every command must work as-typed. -->

### 1. Install Node.js 20 LTS

Pick your operating system:

- **macOS:** `brew install node@20` (if you have Homebrew) or download from [nodejs.org](https://nodejs.org).
- **Linux:** Use your distribution's package manager, or download from [nodejs.org](https://nodejs.org).
- **Windows:** Download the installer from [nodejs.org](https://nodejs.org).

Verify the install: `node --version` should print `v20.x.x` or higher.

### 2. Have a Postgres database ready

If you don't already, create one:

```bash
# Mac with Homebrew Postgres
createdb primer

# Linux with apt
sudo -u postgres createdb primer

# Or use a hosted provider (Neon, Railway, RDS) and copy the connection string
```

You'll need a **connection string** that looks like:

```
postgres://username:password@hostname:5432/primer
```

### 3. Configure Primer

```bash
cp .env.example .env
```

Open `.env` in any text editor. Find the line that starts with `DATABASE_URL=` and set it to your connection string from step 2.

Save the file. Don't worry about the other settings — defaults work.

### 4. Install, migrate, seed, build, run

```bash
npm install              # downloads dependencies (~2 minutes)
npm run migrate          # creates database tables (~10 seconds)
npm run seed             # loads demo data (~10 seconds, optional)
npm run build            # compiles the app (~30 seconds)
node build               # starts the server
```

The last command stays running. Open a browser to **http://localhost:3000**.

### 5. Log in

If you ran `npm run seed`, log in with one of the seeded accounts. Their email addresses and passwords are printed in the seed script's output. Look for lines like:

```
[seed] created user: hans@primer.example  (password: demo2025)
```

Stop the server with `Ctrl+C`. To run it again later: `node build`.

### Going to production with Option A

For a real deployment (not just evaluation):

- **Use a process manager** so the app restarts on crash and on reboot:
  - `systemd`: write a unit file with `ExecStart=/usr/bin/node build` and `Restart=always`.
  - `pm2`: `npm install -g pm2 && pm2 start build/index.js --name primer`.
- **Put it behind a reverse proxy** for HTTPS: nginx, Caddy, or Apache. Caddy auto-issues Let's Encrypt certs; example configuration is in [`docs/integration-guide.md`](./docs/integration-guide.md).
- **Don't use the seed data in production.** Skip `npm run seed`, or run it once on a staging environment and never on real customer data.
- **Back up the database** with `pg_dump`. See [`docs/integration-guide.md`](./docs/integration-guide.md).

---

## Option B instructions

<!-- spec: must work with `docker compose up -d` from a clean clone with only .env.example copied to .env -->

### 1. Install Docker

If you don't already have it:

- **Mac/Windows:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop).
- **Linux:** Follow [Docker's install guide](https://docs.docker.com/engine/install/) for your distribution. Make sure `docker compose version` works (it should print `Docker Compose version v2.x.x` or higher).

### 2. Configure Primer

```bash
cp .env.example .env
```

Open `.env`. For local evaluation, defaults work — you don't need to change anything.

For anything other than evaluation, **change `POSTGRES_PASSWORD`** from its default of `changeme` to a real password.

### 3. Start everything

```bash
docker compose up -d
```

That's it. Three containers start: the application, a Postgres database, and a Caddy reverse proxy. The first start takes 1–2 minutes (Docker pulls images and builds the app).

Watch progress:

```bash
docker compose logs -f
```

When you see `[primer] starting server on port 3000…`, it's ready. Open a browser to **http://localhost**.

### 4. Log in

Same as Option A: use one of the seeded accounts. The credentials appear in the logs:

```bash
docker compose logs app | grep "created user"
```

### Common Option B commands

```bash
docker compose up -d           # start (or update) everything
docker compose down            # stop everything (keeps your data)
docker compose down -v         # stop everything AND delete the database (destructive)
docker compose logs -f         # tail logs from all services
docker compose ps              # show service status
docker compose pull && docker compose up -d --build   # update after pulling new code
```

### Going to production with Option B

For a real deployment:

- **Change `POSTGRES_PASSWORD`** in `.env`. The default is `changeme`. This is fine on your laptop; it is not fine on a server.
- **Set `PUBLIC_APP_URL`** in `.env` to your real URL (e.g. `https://primer.your-company.com`). This is used in email links.
- **Edit `caddy/Caddyfile`** to use your real hostname. Replace the `:80 { ... }` block with `primer.your-company.com { reverse_proxy app:3000 }`. Caddy issues HTTPS certificates automatically via Let's Encrypt.
- **Set up a backup schedule** for the `db-data` volume. See [`docs/integration-guide.md`](./docs/integration-guide.md).

---

## Configuration reference

Every setting lives in `.env`. The full list with explanations is in [`.env.example`](./.env.example) — that file is annotated in plain language.

The most important ones:

| Setting              | Purpose                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`       | Where the database lives. The most common thing customers change.                    |
| `PUBLIC_APP_URL`     | The URL users see. Used in email links. Default: `http://localhost:3000`.            |
| `POSTGRES_PASSWORD`  | (Option B only) Password for the bundled Postgres container. Change for production.  |
| `POSTMARK_API_TOKEN` | Optional. Enables transactional email (password reset, email verification).          |

---

## Customizing Primer

You own the source code. Modify it. The most common modifications:

### Change the application name

Edit `src/lib/i18n/en.json` (and the other language files). Find the `"app.name"` key. Change the value. Rebuild (`npm run build` for Option A, `docker compose up -d --build` for Option B).

### Replace the logo

Replace these files with your own:

- `static/logo.svg`
- `static/logo.png`
- `static/logo.webp`
- `static/favicon.svg`

### Change brand colors

Edit `tailwind.config.js`. The brand colors are defined as Tailwind theme tokens. After editing, rebuild.

### Add a language

1. Copy `src/lib/i18n/en.json` to `src/lib/i18n/<your-code>.json` (e.g., `it.json` for Italian).
2. Translate the values.
3. Register the locale in `src/lib/i18n/index.ts` — add it to the `SUPPORTED_LOCALES` array.
4. Rebuild.

### Connect to your existing single sign-on

The auth layer is in `src/lib/server/auth/index.ts`. The full integration guide for OIDC, SAML, and LDAP is in [`docs/integration-guide.md`](./docs/integration-guide.md).

### Anything else

The codebase is annotated for AI assistants. Open `CLAUDE.md` and feed it (and the file you want to change) to Claude, ChatGPT, or your tool of choice. Ask it to make the change.

---

## Updating Primer

When DavidPM publishes a new release:

1. Download the new zip.
2. Read the `CHANGELOG.md` in the new zip — note any breaking changes or migration notes.
3. Replace your source folder with the new contents (preserving your `.env`).
4. Run `npm run migrate` (Option A) or `docker compose pull && docker compose up -d --build` (Option B).

You decide when to update. Older versions don't expire and don't phone home. There is no forced upgrade path.

---

## Backups

Your Primer database holds everything: users, hierarchy, scores, inquiries. **Back it up.**

### Option A backups

```bash
pg_dump $DATABASE_URL > primer-backup-$(date +%Y%m%d).sql
```

Restore:

```bash
psql $DATABASE_URL < primer-backup-20260601.sql
```

### Option B backups

```bash
docker compose exec db pg_dump -U primer primer > primer-backup-$(date +%Y%m%d).sql
```

Restore:

```bash
docker compose exec -T db psql -U primer primer < primer-backup-20260601.sql
```

### Schedule it

A daily cron job (Option A) or a sidecar container with a scheduled `pg_dump` (Option B) is sufficient for most teams. See [`docs/integration-guide.md`](./docs/integration-guide.md) for example schedulers.

---

## Troubleshooting

### "I see a blank page" / "I see an error"

Check the logs.

- Option A: the terminal where you ran `node build`.
- Option B: `docker compose logs app`.

If the error mentions `DATABASE_URL`, your database connection is wrong. Double-check the connection string in `.env`.

### "Migrations fail with `relation already exists`"

You ran migrations twice against the same database. Migrations track which files have been applied — but if you started with an older version of Primer and are now running a newer version, the migration log may be out of sync. Solutions:

1. **If the database is empty or expendable:** drop and recreate it, then re-run migrations.
2. **If the database has real data:** open a support conversation with DavidPM, or examine `migrations/` and the `schema_migrations` table to understand what's missing.

### "Email isn't being sent"

Email is optional. If `POSTMARK_API_TOKEN` and `SMTP_URL` are both empty in `.env`, password reset and email verification flows show a message asking the user to contact an administrator. To enable email, set one of those variables and restart the server.

### "I forgot the seeded passwords"

The seed script prints them on every run. Run `npm run seed` again — the script is idempotent for users (it won't create duplicates, but it will re-print the credentials).

### "I want to start over"

- Option A: drop and recreate your database, then re-run migrate and seed.
- Option B: `docker compose down -v && docker compose up -d`.

### Anything else

Open `CLAUDE.md`, paste the relevant log message into your AI assistant, and ask for help. The codebase is structured to support this exact workflow.

---

## What's not here

Things you might expect from a SaaS product that this **does not have**:

- A license server. There isn't one. The software runs as long as your hardware does.
- Telemetry. Primer makes zero outbound network calls at runtime.
- Auto-updates. You decide when to update.
- A "Cloud" or "Enterprise" tier. The source you have is the full product.
- Per-user licensing. Your license is per legal entity; users are unlimited.

If any of those would be useful to your organization, you can add them. You own the code.

---

## Getting help

- For codebase orientation: read `CLAUDE.md`.
- For integration with your existing systems: read `docs/integration-guide.md`.
- For the full architecture: read `docs/architecture.md`.
- For the version history: read `docs/CHANGELOG.md`.
- For human help: contact DavidPM, LLC at the support email on your purchase invoice.

---

## License

Primer is sold as a perpetual source-code license. The license terms are in `LICENSE.txt` (or wherever Phase 4 puts the license file — TODO before ship). In summary: you own a copy you can run forever, modify, and rebrand. You may not redistribute the source code or sell it as a derivative product.

## END README CONTENT

---

## Notes for the writer (not part of the README)

### Things to verify before this becomes the real README

- [ ] Every `npm run` command in the doc actually exists in `package.json`
- [ ] Every file path mentioned exists in the repo at HEAD
- [ ] The seeded user credentials shown in examples match what `scripts/seed.ts` actually creates
- [ ] The healthcheck URL referenced (`http://localhost:3000/api/health` etc.) actually responds
- [ ] The "Going to production" subsections each correspond to documented steps in `docs/integration-guide.md`
- [ ] No reference to Supabase remains (cross-check with `grep -i supabase README.md` after the README is written)
- [ ] No reference to `/web/*` routes
- [ ] No reference to the `primer_perspective` cookie

### Things this doc deliberately does NOT cover

- **The product's UX.** The README is about getting Primer running, not about how to use Primer once it's running. In-product help and the customer's own onboarding handle that.
- **DavidPM's commercial pages.** No links to davidpm.com, no marketing language.
- **Per-feature documentation.** Each route's behavior should be obvious from the UI; if a feature needs prose to explain, that's a UX bug, not a docs gap.
- **Tutorial-style introductions to Node, Docker, or Postgres.** The README points readers to first-party docs for those, rather than re-teaching them.

### Cross-references

This doc draws on:

- `Primer-Delivery.md` — the delivery model and persona alignment
- `00-overview.md` — phase sequencing
- `03-option-a-direct-install.md` — Option A scripts and env
- `04-option-b-docker.md` — Option B compose file and Caddyfile
- `05-customer-claude-md.md` — companion CLAUDE.md (this README and that CLAUDE.md must agree)
