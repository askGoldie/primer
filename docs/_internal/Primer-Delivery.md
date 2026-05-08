# Primer Delivery Specification

How Primer reaches the customer, what's in the package, and the three deployment options that serve every buyer persona.

---

## Delivery Model

Primer is delivered as a zip file containing the complete source code, database schema, deployment configuration, and documentation. After purchase, the customer receives a download link. DavidPM, LLC has no ongoing access to the customer's installation — no telemetry, no license server, no phone-home.

---

## What Ships

```
primer-source/
├── src/                    # Complete application source (SvelteKit + TypeScript)
├── docs/                   # Setup guides, architecture notes, integration guide
├── migrations/             # PostgreSQL schema migrations (applied automatically or manually)
├── seeds/                  # Demo data — a working organization with users, metrics, and scores
├── docker-compose.yml      # One-command deployment: app + database + reverse proxy
├── .env.example            # Every configurable setting, annotated in plain language
├── package.json            # Dependencies and npm scripts
├── llms.txt                # Structured context for AI assistants (deployment, config, troubleshooting)
└── README.md               # Start-here walkthrough (written for humans and AI assistants)
```

### Supplemental Documents

These ship in the `docs/` folder and are also available as standalone PDFs on request:

| Document                              | Purpose                                                                                  | Primary audience                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Technical Integration Guide**       | External database, SSO/SAML, reverse proxy, backups, monitoring                          | Enterprise IT teams (Option C)             |
| **Architecture Overview**             | System diagram, data flow, component map, technology stack                               | Security reviewers, IT evaluators          |
| **SBOM (Software Bill of Materials)** | Complete dependency list with versions and licenses (generated from `package-lock.json`) | Procurement, compliance, security audit    |
| **Data Flow Diagram**                 | What data Primer stores, where it lives, what leaves the server (nothing)                | Compliance officers, works councils, legal |
| **Changelog**                         | Version history, breaking changes, migration notes                                       | IT teams applying updates                  |

### What does NOT ship

- No Supabase dependency (the demo site uses Supabase; the customer package does not)
- No external API keys or third-party service requirements
- No minified or obfuscated code — every line is readable
- No license validation or activation server

---

## System Requirements

**Database:** PostgreSQL 15 or later

**Runtime (pick one):**

| If you choose… | You need…                         |
| -------------- | --------------------------------- |
| Direct Install | Node.js 20 LTS                    |
| Docker Compose | Docker Engine + Docker Compose v2 |

No other external services, APIs, or runtime dependencies. Primer runs entirely on the customer's hardware and network.

---

## Three Deployment Options

These are parallel choices — not sequential steps. Each customer picks the one that matches their team and infrastructure.

### Option A: Direct Install

**What it is:** Run Primer as a standard Node.js application connected to a PostgreSQL database. No containers, no abstraction layers.

**Who it's for:**

- Technical evaluators who want to inspect the full stack
- Small teams running on a single server or laptop
- Developers extending or customizing the source code

**What happens:**

```
1. cp .env.example .env          # Create your configuration
2. edit .env                     # Set DATABASE_URL to your PostgreSQL connection string
3. npm install                   # Install dependencies
4. npm run migrate               # Create database tables
5. npm run seed                  # Load demo data (optional)
6. npm run build && node build   # Build and start
```

**Result:** Primer running at `http://localhost:3000` with a working login, seeded demo organization, and sample metrics.

**For non-technical buyers:** Copy the README into an AI assistant (Claude, ChatGPT, or similar) along with your computer's operating system. Ask it to walk you through each step. The README is written to support this exact workflow.

---

### Option B: Docker Compose

**What it is:** One command starts the application, a PostgreSQL database, and a Caddy reverse proxy — all running in isolated containers. Works identically on macOS, Windows, and Linux.

**Who it's for:**

- Most organizations deploying for a team
- IT departments that want a reproducible, self-contained deployment
- Air-gapped or restricted networks (after initial image pull)
- Consultants and operators deploying multiple independent instances

**What happens:**

```
1. cp .env.example .env          # Create your configuration (defaults work for evaluation)
2. docker compose up -d          # Start everything
```

**Result:** Primer running at `http://localhost` with PostgreSQL and a reverse proxy — all in containers, no host-level database to manage.

---

### Option C: Your Infrastructure

**What it is:** Connect Primer to the database servers, authentication systems, and network infrastructure your organization already operates.

**Who it's for:**

- Enterprise IT teams integrating into an existing environment
- Organizations with compliance requirements that dictate infrastructure choices
- Teams that need Primer behind their existing reverse proxy, SSO provider, or backup systems

**What the integration guide covers:**

- **External database** — Point `DATABASE_URL` at your managed PostgreSQL instance (Amazon RDS, Google Cloud SQL, Azure Database for PostgreSQL, Neon, or any PostgreSQL-compatible service). Run the included migrations.
- **Authentication** — Primer ships with built-in username/password authentication using scrypt-based password hashing. The auth module is designed for extension: the integration guide documents how to add OIDC, SAML, or LDAP by adapting the auth layer to your identity provider.
- **Reverse proxy** — Configuration examples for Nginx, Caddy, and Apache, including SSL/TLS termination.
- **Backups** — Database backup strategies and restore procedures using standard PostgreSQL tooling (pg_dump, continuous archiving).
- **Monitoring** — Health check endpoints and structured log output.

---

## Special Deployment Scenarios

### Air-Gap and Offline Deployment

Primer has zero runtime internet dependencies. For fully disconnected environments:

1. On a connected machine: `docker compose pull` to download container images
2. `docker save` to export images to a file
3. Transfer the image file and the Primer zip to the air-gapped network
4. `docker load` to import images on the target machine
5. `docker compose up -d`

No DNS resolution, no package downloads, no external calls at runtime. The application runs entirely on the local machine and local database.

For environments that restrict container runtimes, Option A (Direct Install) can also be deployed offline. A vendored dependencies bundle (`node_modules` tarball) is available on request for fully disconnected Node.js installations.

### Multi-Company Deployment

A Primer license covers one legal entity. PE firms deploying across portfolio companies, EOS Implementers deploying per client, and consultants deploying per engagement each purchase a license per company. Each company receives its own zip and its own invoice.

The deployment workflow per company is identical:

1. Copy the `primer-source/` folder
2. Edit the `.env` file (change `DATABASE_URL`, `PUBLIC_APP_URL`, and any branding)
3. `docker compose up -d`

Each instance is fully independent — no shared state, no shared volumes, no shared database.

### Rebranding

The source code is fully modifiable. Customers who resell or white-label Primer can change:

- Application name, logo, and color palette (Tailwind theme configuration)
- Email templates and notification copy
- All user-facing text (9 language files with flat key-value structure)
- Domain name and SSL certificates

No "Powered by" watermark. No attribution requirement. The perpetual license grants full modification rights.

---

## Persona–Option Alignment

| Persona      | Role                                    | Recommended Option      | Rationale                                      |
| ------------ | --------------------------------------- | ----------------------- | ---------------------------------------------- |
| Dana         | HR Director, 400-person manufacturer    | B (Docker Compose)      | IT installs it; Dana's team opens a browser    |
| Marcus       | CIO, credit union                       | C (Your Infrastructure) | Integrates into existing compliance envelope   |
| Sasha        | PE Operating Partner, 12 portcos        | B (per portco)          | Clone folder, change .env, deploy — repeat     |
| Jin          | CEO, 35-person SaaS                     | A (Direct Install)      | Technical founder, wants to see the code       |
| Priya        | Chief of Staff, 250-person health-tech  | B (Docker Compose)      | Hands zip to IT, focuses on rollout            |
| Big Ed       | Construction Project Director           | B (Docker Compose)      | IT sets it up; field teams use browsers        |
| Dr. Reyes    | VP Quality, 600-bed hospital            | B or C                  | PHI network, no internet dependency            |
| Claire       | Managing Partner, 80-person consultancy | B (Docker Compose)      | One person in ops deploys it                   |
| Terrence     | PMO Director, state transportation      | C (Your Infrastructure) | Procurement requires integration with state IT |
| Amélie       | Global People Ops, 9-country logistics  | C (Your Infrastructure) | Needs SSO, connects to corporate directory     |
| Rick         | EOS Implementer, 15 clients             | B (per client)          | Independent instances, rebrandable             |
| Omar         | IT Director, 180-person law firm        | B or C                  | Burned by vendor lock-in; wants simplicity     |
| Teresa       | Retail Regional VP, 55 stores           | B (Docker Compose)      | IT sets up one instance; stores use browsers   |
| Wade         | VP Ops, 300-unit QSR franchise          | B (Docker Compose)      | Single instance, unlimited users               |
| Heinrich     | Plant Manager, German auto-parts        | B (Docker Compose)      | Works council approves: data stays on-prem     |
| Nadia        | Head of People, 120-person fintech      | B (Docker Compose)      | Limited IT budget; one Docker command          |
| David        | Independent ops consultant              | B (per client)          | Clone-and-go, white-label ready                |
| Colonel Ward | IT Director, defense contractor         | B (Docker Compose)      | Air-gapped, offline, no external calls         |
| Ravi         | VP Engineering, 90-person SaaS          | A (Direct Install)      | Wants to read the code, run it his way         |
| Sister Grace | ED, mid-size nonprofit                  | B (Docker Compose)      | Grant-funded capex; minimal IT overhead        |

---

## Updates

Updates are optional and manual. DavidPM publishes versioned releases. Customers choose when — or whether — to apply them.

**Process:**

1. Download the new release zip
2. Review the changelog for breaking changes
3. Run any new migration files against the database
4. Rebuild and restart the application (or `docker compose pull && docker compose up -d`)

No automatic updates. No forced upgrade path. The customer's current version continues to work indefinitely.

---

## AI-Assisted Deployment

Many Primer customers are not software developers. The delivery package is structured so that a non-technical buyer can:

1. Open an AI assistant (Claude, ChatGPT, or similar)
2. Paste the contents of `README.md` or point the assistant to `llms.txt`
3. Describe their environment ("I have a Mac laptop" or "We have an Ubuntu server with Docker")
4. Follow the assistant's step-by-step guidance

Every configuration file is annotated in plain language. The `.env.example` file explains each setting. The README avoids jargon and defines every term it uses.

The `llms.txt` file ships in the zip and provides structured context for AI assistants: what Primer is, how it's deployed, what each file does, and common troubleshooting steps.

---

## What This Means for the Demo Site

The deployment page at `primer.company/web/deployment` should reflect this specification:

- **Three options, not three levels** — presented as parallel choices, not a sequential journey
- **PostgreSQL only** — no MySQL or SQLite promises (customers can add database adapters; that's the benefit of owning the source)
- **Honest about prerequisites** — don't assume Node.js or Docker are installed; state what's needed
- **AI-assisted path is first-class** — non-technical buyers get explicit guidance: "copy the README into an AI assistant"
- **The online demo is the pre-purchase proof of life** — the deployment page is about what happens after purchase
