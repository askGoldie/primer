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
├── static/                   ← Logos, favicon, fonts
└── src/                      ← Application source code
```

---

## What you need to run it

You need a computer (laptop or server) and a database. That's it.

### One of these runtimes:

| If you choose...                            | You need...                       |
| ------------------------------------------- | --------------------------------- |
| **Option A** (direct install)               | Node.js 20 LTS                    |
| **Option B** (Docker, recommended for most) | Docker Engine + Docker Compose v2 |

### And a database (PostgreSQL 15 or later):

- **Option B users:** A Postgres database is included in the Docker setup. You don't need to install Postgres separately.
- **Option A users:** You need a Postgres database somewhere. Options:
    - On your own laptop: `brew install postgresql@15` (Mac), `apt install postgresql-15` (Ubuntu), or download the installer from [postgresql.org](https://www.postgresql.org/download/) (Windows).
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

Use Option A as the foundation, but point the app at your existing database, your existing identity provider, and your existing HTTPS termination. The auth layer at `src/lib/server/auth/` is intentionally a placeholder — most Option C deployments swap it for an OIDC/SAML integration. Contact DavidPM support for a tailored integration walkthrough.

---

## Option A instructions

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

If you ran `npm run seed`, log in with the seeded demo account. The seed script prints the credentials at the end of its run:

```
set demo password on 5 user(s) — login: demo@primer.company / demo2025
```

That's the shared password for all five Meridian Construction demo users (Hans, Marcus, Rachel, James, Nina). Their email addresses are listed in `seeds/02_users.sql`.

Stop the server with `Ctrl+C`. To run it again later: `node build`.

### Going to production with Option A

For a real deployment (not just evaluation):

- **Use a process manager** so the app restarts on crash and on reboot:
    - `systemd`: write a unit file with `ExecStart=/usr/bin/node build` and `Restart=always`.
    - `pm2`: `npm install -g pm2 && pm2 start build/index.js --name primer`.
- **Put it behind a reverse proxy** for HTTPS: nginx, Caddy, or Apache. Caddy auto-issues Let's Encrypt certs.
- **Don't seed production.** Skip `npm run seed`, or run it once on a staging environment and never against real customer data.
- **Back up the database** with `pg_dump`. See [Backups](#backups) below.

---

## Option B instructions

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

Same as Option A. The seeded credentials are printed in the app container's logs:

```bash
docker compose logs app | grep "login:"
```

You'll see `login: demo@primer.company / demo2025`.

### Common Option B commands

```bash
docker compose up -d                                  # start (or update) everything
docker compose down                                   # stop everything (keeps your data)
docker compose down -v                                # stop AND delete the database (destructive)
docker compose logs -f                                # tail logs from all services
docker compose ps                                     # show service status
docker compose pull && docker compose up -d --build   # update after pulling new code
```

### Going to production with Option B

For a real deployment:

- **Change `POSTGRES_PASSWORD`** in `.env`. The default is `changeme`. This is fine on your laptop; it is not fine on a server.
- **Set `PUBLIC_APP_URL`** in `.env` to your real URL (e.g. `https://primer.your-company.com`). This is used in email links.
- **Edit `caddy/Caddyfile`** to use your real hostname. Replace the `:80 { ... }` block with `primer.your-company.com { reverse_proxy app:3000 }` and remove the `auto_https off` block. Caddy issues HTTPS certificates automatically via Let's Encrypt.
- **Set up a backup schedule** for the `db-data` volume. See [Backups](#backups) below.

---

## Configuration reference

Every setting lives in `.env`. The full list with explanations is in [`.env.example`](./.env.example) — that file is annotated in plain language.

The most important ones:

| Setting             | Purpose                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Where the database lives. The most common thing customers change.                   |
| `PUBLIC_APP_URL`    | The URL users see. Used in email links. Default: `http://localhost:3000`.           |
| `POSTGRES_PASSWORD` | (Option B only) Password for the bundled Postgres container. Change for production. |

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

Tailwind 4 theme tokens live in `src/routes/layout.css` inside the `@theme { ... }` block — `--color-primary`, `--color-accent1`, `--color-tier-alarm`, etc. Edit the values, then rebuild.

### Add a language

1. Copy `src/lib/i18n/en.json` to `src/lib/i18n/<your-code>.json` (e.g. `it.json` for Italian).
2. Translate the values.
3. Register the locale in `src/lib/i18n/index.ts` — add it to the supported-locales list.
4. Rebuild.

### Connect to your existing single sign-on

The bundled email/password auth at `src/lib/server/auth/` is a placeholder. For OIDC, SAML, or LDAP, replace `validateSession()` with a call to your provider's SDK and update the registration/login routes accordingly. Contact DavidPM support for a walkthrough scoped to your identity provider.

### Anything else

The codebase is annotated for AI assistants. Open Claude Code (or the agent of your choice) in the project root, and use the recipes in [`docs/ai-runbook.md`](./docs/ai-runbook.md) — they cover swapping in your SSO, wiring transactional email, putting Primer behind your reverse proxy, customization tasks, and diagnostic prompts.

---

## Updating Primer

When DavidPM publishes a new release:

1. Download the new zip.
2. Read [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) in the new zip. Pay attention to any **Breaking changes** entries under the version you're moving to.
3. Replace your source folder with the new contents (preserving your `.env`).
4. Run `npm run migrate` (Option A) or `docker compose pull && docker compose up -d --build` (Option B).

You decide when to update. Older versions don't expire and don't phone home. There is no forced upgrade path.

---

## Air-gapped and offline deployments

Primer makes zero outbound network calls at runtime — the application functions identically without internet access. The only network requirement is during initial install, when dependencies and (for Option B) container images are downloaded.

### Option B (Docker) — air-gap workflow

On a connected machine:

```bash
docker compose pull
docker save primer-app primer-db caddy:2-alpine postgres:15-alpine -o primer-images.tar
```

Transfer `primer-images.tar` and the Primer source zip to the air-gapped network by whatever method your environment allows (USB, internal artifact registry, approved file transfer).

On the target machine:

```bash
docker load -i primer-images.tar
docker compose up -d
```

The first start applies migrations and (if `PRIMER_SEED_ON_BOOT=true`) seeds the demo data. Subsequent starts skip both.

### Option A (Direct Install) — air-gap notes

A direct-install air-gap is also possible: `npm install` runs on a connected machine, then the source folder _including its `node_modules/`_ is transferred to the air-gapped target. Run `npm run migrate && npm run build && node build` on the target. No further internet access is needed.

A pre-built `node_modules` tarball matching the version in `package-lock.json` is available from DavidPM on request for environments where running `npm install` even once is restricted.

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

A daily cron job (Option A) or a sidecar container with a scheduled `pg_dump` (Option B) is sufficient for most teams.

---

## Troubleshooting

### "I see a blank page" / "I see an error"

Check the logs.

- Option A: the terminal where you ran `node build`.
- Option B: `docker compose logs app`.

If the error mentions `DATABASE_URL`, your database connection is wrong. Double-check the connection string in `.env`.

### "Migrations fail with `relation already exists`"

You ran migrations twice against the same database. Migrations track which files have been applied, but if you started with an older Primer release and are now running a newer one, the migration log may be out of sync. Solutions:

1. **If the database is empty or expendable:** drop and recreate it, then re-run migrations.
2. **If the database has real data:** open a support conversation with DavidPM, or examine `migrations/` and the `schema_migrations` table to understand what's missing.

### "I forgot to run seed and I can't log in"

Run `npm run seed` (Option A) or `docker compose exec app npx tsx scripts/seed.ts` (Option B). The seed is idempotent — already-applied seed files are skipped, and the demo password is only set on users that don't have one yet, so re-running is safe.

### "Email isn't being sent"

Primer ships without a transactional email integration. The verification and password-reset routes log the link to stdout instead of sending an email — fine for evaluation, not for production. To wire your own email provider, edit the `console.log` lines in `src/routes/auth/register/+page.server.ts`, `src/routes/auth/forgot-password/+page.server.ts`, and `src/routes/auth/verify-email/resend/+page.server.ts`.

If you're swapping the auth flow for SSO (the more common path), this becomes moot — the SSO provider handles verification and recovery on its side.

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
- For prompts you can copy into Claude Code (or another AI agent) to execute deployment, customization, integration, or diagnostic tasks: read [`docs/ai-runbook.md`](./docs/ai-runbook.md).
- For architecture, data model, and integration seams: read [`docs/architecture.md`](./docs/architecture.md).
- For privacy / compliance review: read [`docs/data-flow.md`](./docs/data-flow.md).
- For dependency licensing review: see [`docs/sbom.csv`](./docs/sbom.csv) (regenerate with `npm run sbom`).
- For human help: contact DavidPM, LLC at the support email on your purchase invoice.

---

## License

Primer is sold as a perpetual source-code license. The license terms are delivered with your purchase. In summary: you own a copy you can run forever, modify, and rebrand. You may not redistribute the source code or sell it as a derivative product.
