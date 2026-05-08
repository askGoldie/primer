# Internal Planning Index

The documents in `docs/_internal/` are **internal planning artifacts** for the team building the customer-deliverable source-code package. They do **not** ship to customers — `.gitattributes` excludes this entire directory from `git archive`, and `npm run package` validates the exclusion.

`Primer-Delivery.md` is the source of truth for what the final customer package must look like. The `delivery-plan/` subfolder holds the phase specs that drove the transformation.

---

## How to read this folder

1. **Start with `Primer-Delivery.md`** — every other document here is in service of that target.
2. **Then read `delivery-plan/00-overview.md`** — it stitches the rest of the plan together, defines phases, and states what "done" means for each.
3. **Read the numbered docs in `delivery-plan/` in order.** Each later doc assumes the earlier ones.

---

## Cutting a release

The customer-deliverable zip is produced by `npm run package`, which:

1. Runs `npm run check` (typecheck must pass).
2. Warns if the working tree has uncommitted changes — `git archive` ships HEAD only, so dirty work won't make it into the zip.
3. Reminds you to regenerate `docs/sbom.csv` (`npm run sbom`) and commit it if `package-lock.json` is newer.
4. Runs `git archive HEAD --worktree-attributes --format=zip --prefix=primer-source/`, honouring the `export-ignore` rules in [`.gitattributes`](../../.gitattributes).
5. Sanity-checks the resulting zip — confirms the customer-facing paths are present and that `docs/_internal/`, `skills/`, `node_modules/`, etc. are absent.

The output lands at `primer-source-vX.Y.Z.zip` in the repo root. Share that file with the customer.

If the script complains about leaks, the most likely cause is a new path that should be excluded — add it to `.gitattributes` under the `export-ignore` block.

---

## Files

| File                                                                       | Type           | Purpose                                                                                                               |
| -------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`Primer-Delivery.md`](./Primer-Delivery.md)                               | Source of truth | The delivery model, deployment options, and persona alignment. Do not modify without product approval.               |
| [`delivery-plan/00-overview.md`](./delivery-plan/00-overview.md)           | Plan           | Phase sequencing, exit criteria, dependency graph between the other docs.                                             |
| [`delivery-plan/01-strip-public-site.md`](./delivery-plan/01-strip-public-site.md) | Plan | Inventory of public marketing routes and assets to remove; what to keep.                                              |
| [`delivery-plan/02-remove-supabase.md`](./delivery-plan/02-remove-supabase.md)     | Plan | Migration plan from `@supabase/supabase-js` PostgREST + Supabase Auth to plain Postgres + scrypt application auth.    |
| [`delivery-plan/03-option-a-direct-install.md`](./delivery-plan/03-option-a-direct-install.md) | Spec | Build spec for Option A: `npm install && npm run migrate && npm run build`.                                       |
| [`delivery-plan/04-option-b-docker.md`](./delivery-plan/04-option-b-docker.md)     | Spec | Build spec for Option B: `docker compose up -d`.                                                                       |
| [`delivery-plan/05-customer-claude-md.md`](./delivery-plan/05-customer-claude-md.md) | Spec | Specification for the new `CLAUDE.md` that ships in the customer zip and supports AI-assisted customer modification. |
| [`delivery-plan/06-customer-quickstart.md`](./delivery-plan/06-customer-quickstart.md) | Draft | Step-by-step "what you purchased" walkthrough — drafts the customer-shipping `README.md`.                          |

---

## Documents this plan will eventually produce

When the work described here is done, the customer zip will contain (per `Primer-Delivery.md`):

- `README.md` — derived from `06-customer-quickstart.md`
- `CLAUDE.md` — derived from `05-customer-claude-md.md`
- `.env.example` — derived from `03-option-a-direct-install.md` and `04-option-b-docker.md`
- `docker-compose.yml`, `Dockerfile`, `caddy/` — derived from `04-option-b-docker.md`
- `migrations/` — derived from `02-remove-supabase.md` (lifted from `supabase/migrations/`)
- `seeds/` and `npm run seed` — derived from `02-remove-supabase.md`
- `llms.txt` — to be drafted as part of the final delivery polish (reuses content from the customer quickstart and CLAUDE.md)
- `docs/` (in the customer zip) — a slimmed subset focused on customer needs (technical integration guide, architecture overview, changelog). Not yet planned in detail; covered briefly in `00-overview.md`.

---

## What is NOT in this folder anymore

The following documents existed previously and have been removed because they belong to either (a) the public marketing site we are removing, or (b) internal product/sales artifacts that are not relevant to the customer-deliverable codebase:

- `admin-dashboard-spec.md`
- `Book/` (book draft)
- `company/` (internal company docs)
- `demo-scenario.md` (demo walkthrough script — relevant to demo site, not delivery)
- `evaluations/` (internal product evaluations)
- `hierarchy-system-reference.md` (internal architectural reference — content should migrate into the customer Architecture Overview during delivery polish)
- `leadership-pain-reference.md` (positioning / sales)
- `multilingual-implementation-spec.md` (internal — relevant content will be summarized into customer-facing i18n notes; until then, the code itself + locale files in `src/lib/i18n/` are sufficient documentation)
- `personas.md` (sales / persona library)
- `sales-kit/`
- `tier-style-guide.md` (internal style guide for "Tier" branding)

If any of the above content is needed during the refactor, it can be recovered from git history (`git log --diff-filter=D --name-only docs/`).
