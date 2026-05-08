# 01 — Strip the Public Site

Phase 1 of the delivery plan. Remove the public marketing site, the demo persona-picker entrypoint, and supporting assets that exist only to serve the demo. Leave the `/app/*` product surface working (still on Supabase — that's Phase 2).

> **Pre-read:** [`00-overview.md`](./00-overview.md) for phase sequencing and rules.

---

## What "the public site" means in this codebase

Two distinct things:

1. **The `/web/*` route tree** — every page a visitor sees before signing in. About, pricing, contact, demo, deployment, security, etc.
2. **The "platform persona-picker" demo flow** — `/login`, `/platform`, and the `primer_perspective` cookie that lets a visitor role-play as one of the seeded employees on the demo site. This is fundamentally a demo-site feature, even though it touches `/app` routes through `event.locals.user` resolution in `hooks.server.ts`.

Both go.

---

## File-by-file inventory

### Delete: route trees

```
src/routes/web/                        — 62 files, all marketing
src/routes/platform/                   — demo persona picker (gated on isSupabaseAuthenticated)
src/routes/login/                      — demo-only login (web/login is the canonical one)
src/routes/llms.txt/                   — public-site AI context endpoint
src/routes/llms-full.txt/              — same
src/routes/sitemap.xml/                — marketing SEO
src/routes/robots.txt/                 — marketing SEO
src/routes/api/download/               — license-gated source download (only relevant on demo site)
src/routes/api/export/                 — public marketing export
src/routes/+page.server.ts             — currently 308-redirects / → /web/home; replace with redirect to /app or to /auth/login
```

The public auth pages duplicate the canonical ones under `src/routes/auth/*`. Delete the public-site copies:

```
src/routes/web/login/
src/routes/web/register/
src/routes/web/forgot-password/
src/routes/web/reset-password/
src/routes/web/verify-email/
```

The corresponding `src/routes/auth/*` flows stay (they're the canonical product auth and will be rewired in Phase 2).

### Delete: components used only by `/web/*`

```
src/lib/components/seo/                — Seo.svelte, StructuredData.svelte (public marketing only)
src/lib/components/resources/          — MigrationGuideLayout.svelte (only used by /web/resources)
src/lib/components/onboarding/         — verify each component before deleting; some onboarding lives at /app/onboarding and stays
src/lib/components/tier/               — CompositeScore.svelte, TierIndicator.svelte (verify usage before deleting; if used by /app, keep)
```

Before deleting any component directory, run:

```bash
grep -rln "from '\$lib/components/<dirname>" src/
```

If results are exclusively under `src/routes/web/*`, the directory goes. If anything under `src/routes/app/*` imports it, keep the imports it uses and prune the rest.

### Delete: server-side modules used only by the demo

```
src/lib/seo/                           — config.ts, structured.ts (verify all consumers are under /web)
src/lib/server/license/                — license-gated download tracking; only the demo site issues licenses
src/lib/server/demo/                   — perspective resolution (constants.ts, seed.ts) — see "Perspective cookie removal" below
```

Note that `scripts/seed-demo.ts` depends on `src/lib/server/demo/constants.ts` for `DEMO_USER_ID` and `DEMO_ORG_ID`. The seed script will be rewritten in Phase 2 against postgres-js; in Phase 1, **inline those constants into the seed script** rather than deleting `demo/constants.ts` entirely, so seed continues to work.

### Delete: scripts

```
scripts/seed-supabase.ts               — Supabase-Auth-aware seeder; replaced by a postgres-js seeder in Phase 2
scripts/add-seo-translations.mjs       — generated SEO translations for marketing pages
scripts/images/                        — verify; if these are pitch-deck/marketing assets, delete
```

`scripts/seed-demo.ts` stays for now (Phase 2 rewrites it).

### Delete: static assets

```
static/pitch-deck/                     — sales asset
static/demo-logo.webp                  — demo branding
static/images/                         — verify; marketing imagery goes, product imagery stays
```

Keep `static/favicon.svg`, `static/logo.*`, `static/fonts/`.

### Delete: dependencies in package.json

```
@vercel/analytics                      — analytics for the demo site only
```

`Primer-Delivery.md` explicitly promises **no telemetry**. This dependency must be removed and any imports from `src/routes/+layout.svelte` cleaned up.

### Delete: docs

Already done in this same change — the previous `docs/*` contents (admin-dashboard-spec, Book, company, demo-scenario, evaluations, hierarchy-system-reference, leadership-pain-reference, multilingual-implementation-spec, personas, sales-kit, tier-style-guide) are gone. `docs/Primer-Delivery.md` and the `docs/delivery-plan/` planning docs are the only docs in the repo.

---

## Perspective cookie removal

The `primer_perspective` cookie lets a Supabase-authenticated demo visitor "play as" a seeded employee. It is implemented in:

- `src/hooks.server.ts` — `resolvePerspective()` and the `handleAuth` hook's path A+ / path B branches
- `src/lib/server/demo/constants.ts` — exports `PERSPECTIVE_COOKIE` and `PLATFORM_ORG_ID`
- `src/lib/server/action-context.ts` — uses the perspective for action context resolution
- `src/lib/components/layout/Header.svelte` — switcher UI (verify; if it shows a persona picker, the relevant section goes)
- Several routes under `src/routes/app/*` and `src/routes/auth/logout/+page.server.ts` — delete cookie on logout

Phase-1 changes to `hooks.server.ts`:

- Remove the `resolvePerspective()` helper
- In `handleAuth`, delete path A+ (perspective override on top of Supabase session) and path B (perspective-only). Keep path A (Supabase session → load profile).
- After the deletion, `event.locals.user` is populated only from a real Supabase login. This is correct: customers will only ever have real logins; the demo perspective concept doesn't survive into the customer build.

Phase-1 changes to `action-context.ts`: remove perspective fallback logic — `locals.user` is the only source.

Phase-1 changes to `auth/logout/+page.server.ts`: stop deleting the perspective cookie (it no longer exists).

---

## What stays (do not touch in Phase 1)

- `src/routes/app/*` — the entire product. Still works against Supabase at the end of Phase 1.
- `src/routes/auth/*` — login, register, forgot/reset password, verify-email. Still wired to Supabase Auth at the end of Phase 1; rewired in Phase 2.
- `src/lib/server/auth/index.ts` — already provider-agnostic (scrypt + DB queries).
- `src/lib/server/db.ts`, `src/lib/server/supabase.ts` — both stay; replaced in Phase 2.
- `src/lib/i18n/*` — all 9 locales stay. **Marketing-only locale keys can be removed**, but be careful: many keys are shared (nav, footer, common buttons). Conservative approach: leave locale files alone in Phase 1; do a key-sweep at the end of Phase 4 once all routes are settled.
- `src/lib/server/permissions.ts`, `hierarchy.ts`, `csv.ts`, `postmark/*` — product-side server modules. Stay.
- `supabase/migrations/*` — stay until Phase 2 moves them to `migrations/`.
- All TypeScript types under `src/lib/types/*`.

---

## Root-level routing changes

After deletions, the routing tree should look roughly like this:

```
src/routes/
├── +error.svelte
├── +layout.server.ts
├── +layout.svelte           # remove marketing chrome (header/footer that referenced /web/*)
├── +layout.ts
├── +page.server.ts          # redirect / → /auth/login (or /app if already authed)
├── api/                     # only product APIs remain (admin-nodes, goals-pdf, performance-logs, snapshots)
├── app/                     # product
└── auth/                    # auth flows
```

The root `+page.server.ts` should redirect to `/auth/login` if unauthenticated and `/app` if authenticated. The current 308 to `/web/home` will 404.

The root `+layout.svelte` currently renders marketing chrome (header with marketing links, footer). After Phase 1 it should render only the auth/app shell. If the layout currently branches on `event.url.pathname.startsWith('/web')` to switch chrome, that branch goes; the remaining branch becomes the only one.

---

## Verification before declaring Phase 1 done

```bash
# 1. No broken imports
npm run check

# 2. No surviving references to /web routes
grep -rn "/web/" src/ static/ --include="*.ts" --include="*.svelte" --include="*.json"
# should return zero hits

# 3. No surviving references to /platform
grep -rn "/platform" src/ --include="*.ts" --include="*.svelte"
# should return zero hits (other than this doc)

# 4. No surviving references to perspective
grep -rn "primer_perspective\|PERSPECTIVE_COOKIE\|resolvePerspective" src/
# should return zero hits

# 5. No analytics
grep -rn "@vercel/analytics" src/ package.json
# should return zero hits

# 6. App login still works against Supabase
npm run dev
# manually: visit /auth/login, log in with seeded user, land on /app
```

Phase 1 is **complete** when all six checks pass and a manual login round-trip succeeds.

---

## Estimated scope

- Routes/components/scripts deletion: ~1 hour mechanical
- Perspective cookie removal from hooks + action-context: ~30 minutes
- Verifying no orphaned imports / fixing them: ~1–2 hours
- `+layout.svelte` simplification: ~30 minutes

About half a day of focused work. The risk is missing an import that only fires at runtime — the `npm run check` plus a manual login is the safety net.

---

## What this enables

After Phase 1:

- The repo only contains the product and its auth flows
- The Supabase coupling is concentrated in fewer files (no marketing-only Supabase consumers)
- Phase 2 can replace the data layer without worrying about marketing-only code paths
