# Changelog

Notable changes to Primer between releases. Customers reading this on update day: scan the **Breaking changes** sub-list (if present) under the version you're moving to, then run `npm run migrate` (Option A) or `docker compose pull && docker compose up -d --build` (Option B).

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`:

- **MAJOR** — breaking changes (database migrations that require manual intervention, removed features, env var renames).
- **MINOR** — new features, new env vars with defaults, additive schema changes.
- **PATCH** — bug fixes, doc updates, dependency bumps.

---

## Unreleased

_Entries land here under sub-headings (`### Added`, `### Changed`, `### Fixed`, `### Removed`, `### Breaking changes`) until the next version is cut, at which point they roll up under a dated version heading._

---

<!--
Template for the next release. When cutting a version, replace the
"## Unreleased" entries with this block, leaving an empty Unreleased
section above for the next cycle.

## [X.Y.Z] — YYYY-MM-DD

### Breaking changes
- (any change that requires the customer to do more than `npm run migrate`)

### Added
- (new features, new env vars, new commands)

### Changed
- (behavior changes that don't break existing usage)

### Fixed
- (bug fixes)

### Removed
- (deprecated APIs, removed features)

### Security
- (CVEs patched, dependency security updates)
-->
