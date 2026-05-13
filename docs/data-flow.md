# Data Flow

For privacy reviewers, works council members, security auditors, and legal teams. Tells you what data Primer collects, where it is stored, what — if anything — leaves the customer's server, and what mechanisms exist for deletion and audit.

This doc is descriptive of the software's behavior. It does not certify compliance with any regulatory framework (GDPR, HIPAA, CCPA, SOC 2, etc.); regulatory posture depends on the customer's deployment environment, processes, and data handling, which are outside the software's control.

---

## At a glance

```
┌──────────────────────────────────────────────────────────────────┐
│  User browser                                                    │
│  ───────────────                                                 │
│  Cookies set:  primer_session  (httpOnly, Lax, 7-day TTL)        │
│                primer_lang     (locale, 1-year TTL)              │
│                                                                  │
│         ▲                                                        │
│         │  HTTPS (terminated by customer's reverse proxy)        │
│         ▼                                                        │
│                                                                  │
│  Primer application server (Node)                                │
│  ─────────────────────────────────                               │
│  Reads:   the user's request, the two cookies above              │
│  Writes:  application logs to stdout/stderr only                 │
│  Calls:   the customer's PostgreSQL database — and nothing else  │
│                                                                  │
│         │                                                        │
│         ▼                                                        │
│                                                                  │
│  PostgreSQL                                                      │
│  ──────────                                                      │
│  Holds every byte of persistent state.                           │
│  No external services, queues, caches, or object stores.         │
└──────────────────────────────────────────────────────────────────┘
```

**Outbound network calls at runtime: none.** Primer makes no calls to any external service while serving requests. There is no telemetry, no license-server check-in, no CDN ping, no analytics collector.

---

## What is stored

All persistent data lives in the customer's PostgreSQL database. The schema is defined in `migrations/*.sql` and grouped by purpose below.

### Identity and access

| Table                       | Holds                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                     | Email, name, locale preference, scrypt-hashed password (never plaintext), `is_admin` flag, deactivation date.                          |
| `sessions`                  | Active session token (random), the `user_id` it belongs to, expiry timestamp. **No IP address, no user-agent, no device fingerprint.** |
| `email_verification_tokens` | One-shot tokens issued during registration. Hashed before storage.                                                                     |
| `password_reset_tokens`     | One-shot tokens issued by the password-reset flow. Hashed before storage.                                                              |
| `organizations`             | Organization record — name, cycle cadence, configuration toggles.                                                                      |
| `org_members`               | User × organization × role (owner / system_admin / hr_admin / editor / participant / viewer).                                          |
| `org_hierarchy_nodes`       | The org chart. Each node may bind to a `user_id`; nodes also carry `name`, `title`, `description`.                                     |
| `visibility_grants`         | Optional cross-tree access grants (e.g. CEO grants HR ancestor-equivalent access into a subtree).                                      |

### Performance and goals (the operational data)

| Table                                                | Holds                                                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `metrics`, `metric_thresholds`, `metric_reviews`     | Per-person performance metrics, the descriptions of each tier, and submission/approval state.                               |
| `score_snapshots`                                    | Immutable performance captures at a point in time.                                                                          |
| `performance_logs`                                   | Periodic measurements feeding the tier framework.                                                                           |
| `org_goals`, `goal_dependencies`, `goal_adjustments` | Goal definitions, cross-goal links, and per-field change history.                                                           |
| `inquiries`, `inquiry_comments`                      | Self-inquiries (recalibrate one's own thresholds) and peer inquiries (challenge a peer's metric), with threaded discussion. |

### Operations

| Table                | Holds                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_log`          | Append-only history of mutations on hierarchy and organization entities. Each row has `entity_id`, the user who made the change, JSON snapshots of before and after, and a timestamp. **No IP address.** |
| `placement_requests` | New users requesting placement into the hierarchy by HR/admin.                                                                                                                                           |

---

## What does not get stored

The codebase **does not capture** any of the following, in any table:

- IP addresses
- HTTP user-agent strings
- Device fingerprints, cookie IDs, or tracking pixels
- Geographic location (no IP geolocation, no browser geolocation requests)
- Click events, scroll events, dwell time, or any other behavioral telemetry
- Voice, video, or biometric data
- Any data from the user's browser other than what they type into a form

---

## Cookies

Primer sets two HTTP cookies. Both are first-party (same domain as the app) and contain no third-party identifiers.

| Cookie           | Purpose                                                                                        | Attributes                                                  | TTL    |
| ---------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| `primer_session` | Session identifier. Looked up against the `sessions` table on each request. Cleared on logout. | `HttpOnly`, `SameSite=Lax`, `Secure` when served over HTTPS | 7 days |
| `primer_lang`    | The user's preferred locale (e.g. `en`, `de`, `ja`).                                           | `SameSite=Lax`                                              | 1 year |

No other cookies are set by the application code. Reverse proxies and CDNs in front of the app may set their own (e.g. Caddy / CloudFlare); those are outside the app's control and outside the scope of this document.

---

## Logs

Application output is written to **stdout and stderr only**. There is no file-based logging, no log shipper bundled, no log retention configured. The customer's runtime environment (systemd, Docker, pm2, Kubernetes, etc.) decides where the logs go.

What the code logs:

| Log line                               | Contents                                   | Notes                                                                       |
| -------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Migration / seed progress              | Filenames                                  | Operational only.                                                           |
| Healthcheck failures (`/api/health`)   | Database error string                      | No user data.                                                               |
| Auth-hook errors                       | Error message                              | Errors during session validation; written but never returned to the client. |
| Audit-write warnings                   | Error message                              | When `audit_log` insert fails; the parent mutation continues.               |
| **Verification / password-reset URLs** | **User email address and a tokenised URL** | See note below.                                                             |

**Important for compliance reviewers:** the `/auth/register`, `/auth/forgot-password`, and `/auth/verify-email/resend` routes log the user's email and a one-shot tokenised URL to stdout (e.g. `[register] verification link for jane@example.com: https://primer.your-co.com/auth/verify-email?token=…`). This is intentional — Primer ships **without** a transactional email integration, so these log lines are how an operator can complete verification or password reset manually during evaluation. In production, this means:

1. Logs from the auth routes contain personal data (email + token URL) and should be treated as such by your retention and access policies.
2. **In a production deployment, replace these `console.log` statements with calls to your transactional email provider**, or remove them entirely if you are swapping the bundled auth for SSO. See `docs/architecture.md` § "Email (transactional)" for the seam.

---

## Sessions and tokens

- **Session lifetime:** 7 days from issue. The session cookie is bound to a row in `sessions`; deleting the row invalidates the session immediately, even before the cookie's TTL.
- **Verification tokens:** one-shot, hashed at rest, time-limited.
- **Password reset tokens:** one-shot, hashed at rest, time-limited. Consuming the token invalidates it.
- **No "remember me" indefinite tokens.** Every session expires.

Sessions can be administratively invalidated by deleting rows from the `sessions` table. There is no separate "kick all users" admin action; a `DELETE FROM sessions` against the database accomplishes this.

---

## Data subject rights (deletion, export, rectification)

The customer is responsible for any data-subject-rights workflow they need to satisfy. The substrate the codebase provides:

- **Deletion.** A user record can be deleted via SQL `DELETE FROM users WHERE id = $1`. Foreign-key cascades will follow (sessions, tokens, hierarchy bindings via `user_id`). For "right to be forgotten" requests in regulated jurisdictions, supplement with a check of `audit_log.changed_by` references (which point at the user) and decide whether to rewrite those rows or pseudonymise them per your policy.
- **Soft-deactivation.** Setting `users.deactivated_at` blocks login while preserving the row's existence (preserves audit references). The auth flow checks this column on every request.
- **Export.** All of a user's data is reachable via SQL joins from the `users` row. There is no built-in export endpoint; an operator can construct the query their privacy framework requires.
- **Rectification.** All editable fields are editable via the application UI by the user themselves or by an authorized admin.

Primer does not implement these as named admin features because the right shape varies by jurisdiction (GDPR, CCPA, LGPD, PIPEDA, etc.) and by your retention policy.

---

## Data residency

Primer runs entirely on the customer's hardware (or in cloud infrastructure of the customer's choice). Data residency is determined by **where the customer hosts the PostgreSQL database** and the application server. There is no DavidPM-operated component in the data path.

For deployments behind a corporate firewall or air-gapped network: Primer has zero outbound network dependencies at runtime, so the application functions identically without internet access.

---

## Audit trail

The `audit_log` table is appended to on hierarchy and organization mutations. Each row records:

| Column           | What it captures                                               |
| ---------------- | -------------------------------------------------------------- |
| `entity_type`    | The kind of object that changed (`node`, etc.).                |
| `entity_id`      | Which object.                                                  |
| `action`         | `created`, `updated`, `deleted`, `bound`, `unbound`.           |
| `changed_by`     | The acting user (FK to `users`).                               |
| `previous_value` | JSON snapshot of the row before the change (null on create).   |
| `new_value`      | JSON snapshot of the row after the change (null on delete).    |
| `context`        | Free-text reason: `dissolve`, `bulk_reparent`, `restore`, etc. |
| `created_at`     | Timestamp.                                                     |

**No IP address, no user-agent, no request ID.** The audit trail is _organisationally_ complete — it identifies who changed what and when — but does not record session metadata.

If your compliance posture requires IP / user-agent in the audit trail, the seam is `writeHierarchyAudit()` in `src/routes/app/settings/+page.server.ts`. Additional columns can be added via a new migration.

---

## Summary for a compliance reviewer

If you have ten minutes:

1. **No data leaves the customer's server while serving requests.** Every persisted byte lives in the customer's Postgres database. Application logs go to stdout/stderr.
2. **Two cookies.** `primer_session` (HttpOnly, 7-day, session) and `primer_lang` (locale preference, 1-year). No third-party cookies.
3. **One known PII-in-logs source.** The auth routes log email + token URLs to stdout when a verification or reset is requested. Treat those logs as containing personal data, or replace those `console.log` statements with calls to your email provider.
4. **No IP, user-agent, location, or behavioral telemetry** is collected anywhere in the codebase.
5. **The audit trail is action-level, not request-level.** It captures who changed what, not from where.
6. **Data subject rights** require operator scripts (SQL) — the codebase provides the schema, not a packaged "delete-my-data" UI. Foreign-key cascades make the SQL straightforward.
7. **Data residency is the customer's choice.** Primer runs anywhere PostgreSQL and Node 20 run, including air-gapped and on-premise.
