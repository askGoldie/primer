# AI Runbook

Recipes for running Primer customizations, integrations, and diagnostics through an AI coding assistant — primarily Claude Code, but the prompts work equally with Cursor or any project-aware coding agent.

This doc is for the **human implementer** sitting in front of the AI. It is the prompts you copy, the placeholders you fill in, and the check you run afterwards. The companion doc the AI itself reads is [`../CLAUDE.md`](../CLAUDE.md), which is loaded automatically when Claude Code opens in the project root.

---

## Quick start

1. **Open Claude Code in the project root.** Claude Code auto-loads [`CLAUDE.md`](../CLAUDE.md) — that gives the assistant the project's conventions, the seam locations, and the non-negotiable rules.
2. **Sanity-check the load.** Ask: `what's the i18n rule in this codebase, and where is the auth seam?` If the answer mentions never-hardcode-strings and `src/lib/server/auth/`, you're set. If it doesn't, manually attach `CLAUDE.md` to the conversation.
3. **Make a baseline commit.** `git add -A && git commit -m "baseline before AI changes"`. Every recipe below assumes you can `git restore .` if the result isn't what you wanted.
4. **Pick a recipe.** Copy the fenced prompt, fill in the `<...>` placeholders, hit enter.
5. **Read the diff Claude proposes before accepting.** Always.
6. **Verify.** `npm run check && npm run lint`. Both must pass before you commit.
7. **Commit on success or roll back on failure.** Don't leave half-applied changes uncommitted.

---

## Workflow rules (apply to every recipe below)

These rules are the difference between AI-assisted productivity and AI-assisted regression. Claude Code, by default, follows them; the prompts below assume this baseline.

- **Commit before, commit after.** Every change goes in its own commit so you can bisect later.
- **Read the diff.** Trust but verify — Claude is good at typescripting; it is not infallible at understanding business rules.
- **Run `npm run check && npm run lint` after every change.** The codebase has no runtime test suite; types and lint are the only gate.
- **Don't accept "I disabled the type error."** If Claude proposes `// @ts-expect-error` or `// eslint-disable`, reject the change and ask why the underlying issue exists.
- **One change per commit.** If a recipe touches three files, commit them together; if Claude offers to refactor unrelated code while it's there, decline.

---

## Customization recipes

### Rebrand the application

Change the displayed name, swap the logo, and re-theme the brand colors in one pass.

**Before you start:** have the new logo as four files (logo.svg, logo.png, logo.webp, favicon.svg) and the new color palette ready (at minimum: primary, secondary, three accents).

```
Rebrand the application from "Primer" to "<NEW NAME>".

1. Update the `app.name` key to "<NEW NAME>" in every file under
   src/lib/i18n/. Do not search-and-replace strings anywhere else —
   user-facing strings go through the i18n system, and any hardcoded
   instance of "Primer" in components is a bug to fix at its source.
2. The four logo files in static/ have already been replaced by me;
   confirm they exist and that nothing in the codebase references a
   filename other than logo.svg, logo.png, logo.webp, favicon.svg.
3. Update the brand colors in src/routes/layout.css inside the @theme
   block. Set:
     --color-primary:   <HEX>
     --color-secondary: <HEX>
     --color-accent1:   <HEX>
     --color-accent2:   <HEX>
     --color-accent3:   <HEX>
   Adjust the corresponding -light variants to a lighter tint of each
   accent. Leave --color-tier-* unchanged unless I asked otherwise —
   those carry WCAG-validated contrast ratios.
4. Run npm run check to confirm nothing broke.
```

**Verify:** `npm run dev`, log in, look at the nav and the logo. The app name should appear correctly in every language you spot-check.

---

### Add a new language

Add support for a tenth (or eleventh, etc.) language.

**Before you start:** know the locale code (e.g. `it` for Italian, `nl` for Dutch). Have a translator ready, or be prepared to use machine translation as a starting draft.

```
Add a new locale "<LOCALE CODE>" (display name "<LANGUAGE>") to the i18n system.

1. Copy src/lib/i18n/en.json to src/lib/i18n/<LOCALE CODE>.json.
2. Translate every value in the new file from English to <LANGUAGE>.
   Do not change any keys. Do not omit any keys — validateLocales()
   enforces parity with en.json at build time.
3. Register the locale in src/lib/i18n/index.ts. Add the code to the
   supported-locales list, the language-name display map, and the
   Accept-Language parser if it has a hardcoded list.
4. If the language is right-to-left (Hebrew, Arabic dialects, Persian,
   Urdu): also confirm that hooks.server.ts adds the new code to its
   RTL set so the dir attribute is set correctly.
5. Run npm run check.
```

**Verify:** start dev server, visit any page, switch language via the language switcher, confirm the page renders in the new language with no missing-key fallbacks logged to the console.

---

### Disable a product feature

Remove a feature surface entirely (route, navigation entry, locale strings).

**Before you start:** identify the feature's route folder. Most product features live under `src/routes/app/<feature>/` and have a navigation entry in the app layout.

```
Disable the "<FEATURE NAME>" feature. The feature's route folder is
src/routes/app/<FOLDER>/.

1. Delete the route folder src/routes/app/<FOLDER>/ entirely.
2. Find the navigation entry that links to /<FOLDER> in the app
   layout (likely src/routes/app/+layout.svelte) and remove the entry.
   Do not leave a commented-out version.
3. Find any cross-links from other features (search the codebase for
   "/<FOLDER>") and remove them.
4. Find i18n keys scoped to this feature (search src/lib/i18n/en.json
   for keys starting with "<FEATURE NAME>." or similar) and remove
   them from every locale file. Keep keys that are shared with other
   features.
5. Confirm the +layout.server.ts navigation flags don't reference this
   feature anymore.
6. Run npm run check.

Do NOT remove database tables that the feature wrote to — leave the
schema intact so we can re-enable later or migrate the data out.
```

**Verify:** the navigation no longer shows the feature; visiting the URL directly returns 404; `npm run check` passes; no untranslated keys appear in logs.

---

### Add a custom report

Add a new server-rendered report under `/app/reports/` driven by a SQL query.

```
Add a new report to /app/reports/ called "<REPORT NAME>" that
shows <DESCRIBE THE REPORT IN ONE SENTENCE>.

1. Create src/routes/app/reports/<slug>/+page.server.ts and +page.svelte.
2. The loader (in +page.server.ts) should:
   - Read locals.user (redirect to login if absent — match the pattern
     used in src/routes/app/+layout.server.ts).
   - Query Postgres via the sql template from src/lib/server/db.ts.
   - Run authorization through src/lib/server/permissions.ts if the
     report shows data the caller shouldn't always see.
   - Return a typed payload that the .svelte file consumes.
3. The component should use t() for every label — no hardcoded English.
   Add the labels under "reports.<slug>." namespace in en.json and
   mirror to every other locale.
4. Add a navigation entry under the Reports tab (or wherever existing
   reports are linked) using the same i18n key style.
5. Run npm run check.
```

**Verify:** navigate to the new report, confirm rows render, switch locale and confirm labels translate, test with a non-admin user to confirm permissions hold.

---

## Integration recipes

These are the high-leverage seam swaps for Option C deployments. Read [`architecture.md`](./architecture.md#seams) first if you want to understand the boundary before asking Claude to swap it.

### Replace the bundled auth with OIDC

Swap the placeholder scrypt auth for an OIDC provider (Okta, Azure AD, Auth0, Keycloak, Google Workspace, etc.). The contract Claude must preserve is `event.locals.user` — every downstream route reads it.

**Before you start:** have your OIDC provider's discovery URL, client_id, client_secret, and redirect URI ready. Know which user attribute you want to map to `email` and `name` in `locals.user`.

```
Replace the bundled auth in src/lib/server/auth/ with an OIDC
integration against <PROVIDER NAME>. My configuration:

  Discovery URL: <https://...>
  Client ID:     <...>
  Redirect URI:  <https://primer.your-co.com/auth/callback>
  Email claim:   <email | preferred_username | ...>
  Name claim:    <name | ...>

Read docs/architecture.md § Authentication and § "What is not a seam"
before making changes.

Implementation requirements:
1. The hook src/hooks.server.ts:handleAuth must continue to populate
   event.locals.user with the shape declared in src/app.d.ts. Do not
   change the App.Locals['user'] type — downstream routes depend on it.
2. Add a callback route at src/routes/auth/callback/+server.ts that
   accepts the OIDC redirect, exchanges the code for tokens, and
   creates a session. Reuse the existing sessions table — it is the
   simplest way to keep route guards working unchanged.
3. The /auth/login page should redirect the user to the OIDC provider
   (the discovery-derived authorization endpoint), not show the
   bundled email/password form.
4. Delete src/routes/auth/{register,forgot-password,reset-password,
   verify-email}/ — the IdP owns those flows now.
5. Use a small, well-maintained OIDC client library (openid-client is
   the standard). Add it to package.json dependencies. Do not roll a
   JWT verifier from scratch.
6. Use environment variables for client_id / client_secret /
   discovery URL — do not hardcode them. Add the variables to
   .env.example with comments.
7. Run npm run check and npm run lint.

Do NOT modify src/lib/server/permissions.ts. Authorization is
downstream of authentication and must continue to work unchanged.
```

**Verify:** start the app, visit `/auth/login`, get redirected to the IdP, sign in, get redirected back, land on `/app`. Inspect the `primer_session` cookie — it should still be set. Verify a user without an org membership lands on the placement flow as before.

For SAML or LDAP, the prompt is structurally identical — substitute the protocol-specific parameters. SAML deployments typically use a library like `@boxyhq/saml-jackson` or `passport-saml`; LDAP typically uses `ldapjs`.

---

### Wire transactional email

Replace the `console.log`-stub email flow with a real transactional provider for verification and password-reset emails. **Skip this if you're swapping for SSO** — your IdP will own those flows.

**Before you start:** have the provider's API key (or SMTP credentials) ready. Decide on a `from` address that matches a verified sender on the provider.

```
Wire transactional email through <PROVIDER NAME>.

The auth routes currently log verification and reset URLs to stdout.
The locations are:
  - src/routes/auth/register/+page.server.ts
  - src/routes/auth/forgot-password/+page.server.ts
  - src/routes/auth/verify-email/resend/+page.server.ts

Replace each console.log with a call to the provider's send-email API.

1. Create src/lib/server/email/index.ts exporting two functions:
     sendVerificationEmail(to: string, verifyUrl: string)
     sendPasswordResetEmail(to: string, resetUrl: string)
   Each should compose the message, call the provider's API, and
   return successfully or throw. Configuration (API key, from address)
   reads from $env/dynamic/private.
2. Replace each console.log call site with the appropriate function
   from the new module. Keep the URL-construction logic where it is —
   only the dispatch changes.
3. If the provider's call fails, log the error and continue — do not
   surface a 500 to the user, since the verification flow will retry
   via the resend endpoint anyway.
4. Add the new env variables to .env.example with comments.
5. Run npm run check.

Do NOT introduce a templating library (handlebars, mjml, etc.).
A minimal HTML + plaintext string is sufficient for verification and
reset emails.
```

**Verify:** trigger a registration; check the provider's send log; click the link; confirm verification completes.

---

### Put it behind your existing reverse proxy

Configure Primer to sit behind your organization's existing Nginx, Apache, HAProxy, or load balancer instead of the bundled Caddy.

**Before you start:** know your reverse proxy's hostname and the port you want it to forward to. Decide whether the proxy or Primer terminates TLS.

```
Configure Primer to run behind my existing <Nginx | Apache | HAProxy>
reverse proxy at <PROXY HOSTNAME>. The proxy terminates TLS; Primer
listens on plain HTTP at port 3000.

1. The app is a Node server (adapter-node). It needs no proxy-specific
   configuration on its own side — just the right environment variables:
     - PORT=3000 (or whatever the proxy will forward to)
     - PUBLIC_APP_URL=<https://my-public-hostname> (used in email links)
2. Generate a sample <PROXY> server block for me that:
     - Listens on 443 with my TLS cert
     - Proxies all paths to http://<APP HOST>:3000
     - Sets X-Forwarded-Proto, X-Forwarded-For, X-Forwarded-Host
     - Includes a /api/health passthrough that doesn't get cached
     - Strips any client-supplied X-Forwarded-* headers before
       forwarding
3. Confirm whether docker-compose.yml needs adjustment if I'm running
   Option B without the bundled Caddy — specifically, the `proxy`
   service can be removed and the `app` service's port 3000 should be
   bound to a host port my reverse proxy can reach.

Do not change application code. The reverse proxy is configuration,
not implementation.
```

**Verify:** `curl -I https://<PROXY HOSTNAME>/api/health` returns 200 and includes Primer's response headers.

---

### Ship logs to your aggregator

Pipe the app's stdout/stderr to your existing log shipper (Datadog, Splunk, Loki, CloudWatch, etc.).

**Before you start:** know how your log shipper consumes container or process logs (Docker log driver, sidecar agent, file tailing, syslog, etc.).

```
Ship application logs from this Primer instance to <LOG AGGREGATOR>.

The application uses unstructured console.log / console.error /
console.warn — output goes to stdout/stderr.

1. Tell me how to configure <LOG AGGREGATOR> to ingest the output.
   Pick the simplest mechanism: Docker log driver, file tail of
   docker logs, sidecar agent, etc. — whatever requires the fewest
   moving parts.
2. If the aggregator requires structured (JSON) logs, propose the
   smallest possible wrapper for console methods that JSON-encodes
   timestamp / level / message. Do not introduce pino, winston, or
   any logging library — a 30-line wrapper is sufficient and matches
   the codebase's "prefer 50 lines over a 500-line library" rule.
3. Confirm that the verification / reset URL log lines are within
   scope of what the aggregator will receive — they contain user
   email addresses (PII). I may want to strip them before ingestion
   or replace those console.log calls with a sender. See
   docs/data-flow.md § Logs.
```

**Verify:** start the app, generate some traffic (login, view a page), watch logs flow into the aggregator. Verify the auth-route log lines are either redacted or replaced.

---

### Register the healthcheck with your monitor

Wire `/api/health` into your existing uptime / monitoring stack.

```
The endpoint is GET /api/health. It returns:
  - 200 {"status":"ok","db":"ok"} when Postgres is reachable
  - 503 {"status":"degraded","db":"unreachable","error":"..."} otherwise

Register this endpoint with my monitoring stack <MONITOR NAME> as a
liveness probe. The probe should:
  - Hit https://<HOST>/api/health every <INTERVAL>
  - Page when the response is non-200 for more than <THRESHOLD>
    consecutive checks
  - NOT alert on individual transient 503s — Postgres restarts will
    cause a brief unhealthy window

Tell me the configuration in <MONITOR>'s native format. Do not change
application code.
```

**Verify:** the monitor shows the endpoint as healthy. Stop the database briefly; confirm the monitor flips to degraded and pages (or would page, in test mode).

---

## Diagnostic recipes

### Migrations are failing

```
npm run migrate is failing with the following output:

<PASTE THE FULL OUTPUT INCLUDING THE STACK TRACE>

Diagnose without changing any migration files. Specifically:

1. Read the migration file the runner was applying when it failed
   (see the "apply ..." line just before the error).
2. Inspect schema_migrations against the migrations/ directory to
   find the divergence — query the database directly with psql if
   you have a connection. Tell me the SQL to run if you don't.
3. Tell me what the underlying state is (what's already applied,
   what isn't, whether a previous run partially applied a migration).
4. Recommend a remediation that does NOT involve editing any
   committed migration file. Acceptable remediations include:
   - manually finishing the failed migration's SQL via psql, then
     inserting the row in schema_migrations
   - dropping and recreating the database (only if it's empty or
     expendable)
   - writing a new corrective migration

Do NOT propose modifying an existing migration file. Customers'
databases have already applied them, and silent divergence is the
worst possible outcome.
```

---

### Login isn't working

```
Login is failing. Symptom: <DESCRIBE — wrong-password message,
infinite redirect, 500, blank screen, etc.>

1. Read src/routes/auth/login/+page.server.ts and src/lib/server/
   auth/index.ts to confirm the flow.
2. Walk through what would have to be true for the symptom to occur:
   - cookie is/isn't set
   - sessions row exists/expired
   - password_hash is/isn't set on the user row
   - user is deactivated
3. Tell me the SQL queries to run against my database to confirm
   each hypothesis.
4. Once we've identified which hypothesis is true, propose the fix.

Do not modify any code yet. Diagnose first.
```

---

### Build fails

```
npm run build is failing with:

<PASTE THE OUTPUT>

1. Identify the failing module and the line in the build output
   that names it.
2. Determine whether the failure is:
   - a TypeScript type error (fix the underlying type issue)
   - a missing import (find what was meant; do not add a stub)
   - a Vite/Svelte compile error (check the relevant @import or
     component shape)
   - a missing environment variable required at build time (less
     common; usually $env/static/private references)
3. Propose the smallest fix.

Do NOT add // @ts-expect-error, // eslint-disable, or any comment
that suppresses the error rather than fixes it. If the underlying
issue requires a deeper change, surface that and let me decide.
```

---

## Adding a new feature

For features beyond the recipes above, the meta-prompt:

```
I want to add <FEATURE DESCRIPTION>.

Before writing any code:
1. Read CLAUDE.md and docs/architecture.md to understand the
   project's conventions and the relevant seams.
2. Tell me which existing files this feature would touch (routes,
   server modules, components, locale files, migrations).
3. Tell me whether the feature requires a new database table or
   columns. If yes, the change goes in a new migration file
   (migrations/YYYYMMDDHHMMSS_<description>.sql) — do not edit
   existing migrations.
4. Sketch the data flow in 5–10 lines: where data comes in, how
   it's authorized, where it's stored, how it's read back.
5. Wait for my go-ahead before writing code.

When you do write the code:
- Every user-facing string goes through t() and into the i18n files.
- Every database query goes through the sql template from
  src/lib/server/db.ts. Use parameterized queries.
- Authorization decisions go through src/lib/server/permissions.ts
  or follow the same pattern.
- npm run check && npm run lint must pass before I commit.
```

---

## What NOT to ask Claude to do

These are real failure modes from real customer-zip workflows. Don't paste prompts that match these shapes:

- ❌ **"Just make `npm run check` pass."**
  Suppressing type errors hides real bugs. If the type system disagrees with the code, one of them is wrong; figure out which.

- ❌ **"Skip the failing migration."**
  The migration is failing for a reason. Editing the file or skipping it puts the customer's database in a state nobody can reproduce. Use the diagnostic recipe above instead.

- ❌ **"Hardcode this string for now; we'll i18n it later."**
  "Later" doesn't come. The codebase has 9 locale files for a reason; every untranslated string is a partial regression for non-English customers.

- ❌ **"Add an ORM so this is easier."**
  The codebase intentionally uses postgres-js with raw SQL. Customer readability beats developer ergonomics. If a query is awkward, the answer is to extract a helper, not to introduce Drizzle / Prisma / Knex.

- ❌ **"Add a feature flag system."**
  YAGNI. If a feature isn't ready, it isn't merged. If a feature needs to be conditionally disabled per customer, that customer deletes the route folder.

- ❌ **"Add some telemetry so we can debug this."**
  Primer's contract with customers is zero outbound calls at runtime. Use logs, dumps, and structured Postgres queries instead.

- ❌ **"Refactor while you're at it."**
  Scope discipline. A bug fix is a bug fix; a refactor is a refactor. Don't bundle.

- ❌ **"Add tests for this."**
  The codebase has no runtime test framework — `svelte-check` and `eslint` are the only gates. Adding Vitest / Playwright / Jest is a strategic decision, not a tactical one. Ask before opting in.

- ❌ **"Add Postgres row-level security so this is enforced at the DB layer."**
  Permissions are application-layer in this codebase by design. Adding RLS creates a second source of truth that conflicts with `src/lib/server/permissions.ts`.

---

## When Claude is wrong

Claude is good. Claude is not infallible. The patterns to watch for:

- **It invents an API.** If a function "exports" a method you don't recognize, grep the codebase for the actual definition before accepting the change.
- **It guesses at columns.** If Claude's SQL references a column name you don't see in `migrations/*.sql`, ask it to show you the migration that defines the column. If it can't, the column doesn't exist.
- **It accepts a one-shot fix that masks a deeper bug.** If a fix changes one line and the explanation is "this should resolve the issue," and you don't understand why, push back. Ask: "what's the underlying root cause, and is this fix at the right layer?"
- **It ignores the i18n rule under deadline pressure.** If your prompt was urgent, Claude may shortcut by hardcoding a string. Read the diff. The rule applies always.

When in doubt: roll back (`git restore .`), reduce the scope of your prompt, and try again.
