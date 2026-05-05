# Primer: Admin Dashboard Specification

## Context A (Internal)

### primer.company

---

## Purpose

The admin dashboard is an internal tool accessible only to DavidPM operators. It provides visibility into narrative site activity, demo environment usage, account lifecycle events, purchase transactions, download events, and errors at each step of the user flow. It does not expose customer operational data. It exposes DavidPM's own operational data: how the site is performing, where users are dropping off, and where the system is failing.

The dashboard is the DavidPM operator's quintile stack for their own product.

---

## Access and Authentication

The admin dashboard is served at a non-public route (`/admin`). Access requires an admin account. Admin accounts are not self-service. They are created directly in the database by a DavidPM operator.

Admin sessions are separate from customer sessions. An admin account cannot be used to access the customer post-purchase experience and vice versa.

Session security: admin sessions use the same session management infrastructure as customer sessions (hooks.server.ts) but are flagged with an `is_admin` boolean. All admin routes check for this flag server-side on every request. No client-side role check is authoritative.

---

## Data Model

The following tables support the admin dashboard. These are DavidPM's own operational tables in Context A (Supabase/PostgreSQL). They do not ship in Context B.

### `narrative_events`

Logs anonymous activity from the unauthenticated narrative site.

| Column      | Type        | Description                                                                                                                                |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| id          | uuid        | Primary key                                                                                                                                |
| session_id  | text        | Anonymous session identifier (generated client-side, not tied to any user)                                                                 |
| event_type  | text        | One of: `narrative_started`, `industry_selected`, `role_selected`, `walkthrough_part_viewed`, `walkthrough_completed`, `demo_link_clicked` |
| event_value | text        | Contextual value: industry name, role name, or part number (null for events where not applicable)                                          |
| locale      | text        | Active language at time of event                                                                                                           |
| created_at  | timestamptz | Event timestamp                                                                                                                            |

No IP addresses are stored. No browser fingerprints are stored. Session IDs are random strings generated at page load and cleared at session end. They cannot be traced to an individual.

### `account_events`

Logs account lifecycle activity. Covers both pre-purchase (demo access) and post-purchase accounts.

| Column       | Type        | Description                                                                                                                                                                                                                |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id           | uuid        | Primary key                                                                                                                                                                                                                |
| account_id   | uuid        | Foreign key to accounts table (null for pre-account events)                                                                                                                                                                |
| license_id   | text        | License identifier (null for accounts without a license)                                                                                                                                                                   |
| event_type   | text        | One of: `account_created`, `account_creation_error`, `email_verified`, `verification_token_expired`, `verification_token_reused`, `login_success`, `login_failure`, `password_reset_requested`, `password_reset_completed` |
| error_detail | text        | Error message if applicable                                                                                                                                                                                                |
| created_at   | timestamptz | Event timestamp                                                                                                                                                                                                            |

### `demo_events`

Logs authenticated activity within the demo environment.

| Column      | Type        | Description                                                                                                       |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| id          | uuid        | Primary key                                                                                                       |
| account_id  | uuid        | Foreign key to accounts table                                                                                     |
| event_type  | text        | One of: `demo_accessed`, `mock_data_viewed`, `tool_metric_added`, `tool_score_calculated`, `purchase_cta_clicked` |
| event_value | text        | Contextual value: stack identifier for `mock_data_viewed`, metric count for `tool_metric_added` (null otherwise)  |
| locale      | text        | Active language at time of event                                                                                  |
| created_at  | timestamptz | Event timestamp                                                                                                   |

### `purchase_events`

Logs purchase flow activity.

| Column                | Type        | Description                                                                                                                                                          |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                    | uuid        | Primary key                                                                                                                                                          |
| account_id            | uuid        | Foreign key to accounts table                                                                                                                                        |
| stripe_session_id     | text        | Stripe Checkout session ID                                                                                                                                           |
| stripe_customer_email | text        | Email from Stripe (stored after payment confirmation)                                                                                                                |
| event_type            | text        | One of: `purchase_initiated`, `payment_confirmed`, `webhook_received`, `webhook_error`, `account_match_error`, `confirmation_email_sent`, `confirmation_email_error` |
| locale                | text        | Language at time of purchase initiation                                                                                                                              |
| error_detail          | text        | Error message or code if event_type is an error variant (null otherwise)                                                                                             |
| created_at            | timestamptz | Event timestamp                                                                                                                                                      |

### `download_events`

Logs source code download activity.

| Column       | Type        | Description                                                          |
| ------------ | ----------- | -------------------------------------------------------------------- |
| id           | uuid        | Primary key                                                          |
| account_id   | uuid        | Foreign key to accounts table                                        |
| license_id   | text        | License identifier                                                   |
| version      | text        | Source code version downloaded                                       |
| event_type   | text        | One of: `download_initiated`, `download_completed`, `download_error` |
| error_detail | text        | Error detail if applicable                                           |
| created_at   | timestamptz | Event timestamp                                                      |

---

## Dashboard Sections

### 1. Overview (Default View)

A summary panel showing the current state of the funnel across all time or within a selectable date range.

**Metrics displayed:**

| Metric                     | Description                                       |
| -------------------------- | ------------------------------------------------- |
| Narrative sessions started | Count of `narrative_started` events               |
| Demo link clicked          | Count of `demo_link_clicked` events               |
| Accounts created           | Count of `account_created` events                 |
| Demo environment accessed  | Count of `demo_accessed` events                   |
| Purchase CTAs clicked      | Count of `purchase_cta_clicked` events            |
| Payments confirmed         | Count of `payment_confirmed` events               |
| Downloads completed        | Count of `download_completed` events              |
| Active errors (last 24h)   | Count of any `*_error` event in the last 24 hours |

**Funnel visualization:**

A step-by-step drop-off display showing conversion at each stage:

```
Narrative started
  -> Demo link clicked       [X% of narrative starts]
    -> Account created       [X% of demo link clicks]
      -> Demo accessed       [X% of accounts created]
        -> CTA clicked       [X% of demo accesses]
          -> Payment confirmed  [X% of CTAs clicked]
            -> Download      [X% of payments confirmed]
```

The drop-off at each step is the primary diagnostic. A large drop between narrative started and demo link clicked indicates the narrative is not earning interest. A large drop between demo link clicked and account created indicates the authentication gate is too much friction. A large drop between demo accessed and CTA clicked indicates the demo is not converting to purchase intent. A large drop between payment confirmed and download indicates a problem with the post-purchase experience.

**Date range selector:** Today / Last 7 days / Last 30 days / Last 90 days / All time / Custom range.

**Language breakdown:** A table showing the count of `narrative_started` events grouped by locale. This identifies which language markets are engaging with the site.

---

### 2. Narrative Activity

Detailed view of unauthenticated narrative site usage.

**Displays:**

- Total narrative sessions (by date range)
- Sessions that selected an industry (and breakdown by industry)
- Sessions that selected a role (and breakdown by role)
- Sessions that reached walkthrough completion (Part 6) and percentage of total
- Sessions that clicked a demo link (and percentage of total)
- Average walkthrough depth: average highest part number viewed per session

**Industry and role breakdown:** Two tables showing distribution of selections. Identifies which industries and roles are most represented in the visitor base.

**Trend chart:** Daily count of `narrative_started` and `demo_link_clicked` events over the selected date range.

**No individual session data is displayed.** All views are aggregate. The session ID is used only for deduplication and is not exposed in the dashboard.

---

### 3. Demo Activity

Detailed view of authenticated demo environment usage.

**Displays:**

- Total demo accesses (by date range)
- Unique accounts that accessed the demo (deduplicated)
- Mock data exploration: count and breakdown of `mock_data_viewed` events by stack (Hans, Marcus, Rachel, James, Nina)
- Quintile tool usage: accounts that added at least one metric, accounts that calculated a composite score
- Average metric count at time of score calculation
- Purchase CTA clicks from within the demo (count and percentage of demo accesses)

**Engagement table:** A breakdown showing which mock data stacks are most frequently viewed. This identifies whether visitors are exploring broadly or focusing on specific characters.

**Trend chart:** Daily count of `demo_accessed` and `purchase_cta_clicked` events over the selected date range.

---

### 4. Purchase Activity

Detailed view of the purchase funnel.

**Displays:**

- Total purchase initiations (user clicked the purchase button, was redirected to Stripe)
- Total payments confirmed (Stripe webhook received and validated)
- Conversion rate: payments confirmed / purchase initiations
- Failed webhooks (count; with drill-down to error detail)
- Account match errors (count; with drill-down to error detail)
- Failed confirmation emails (count; with drill-down to error detail)
- Purchases by locale (table)

**Transaction log:** A paginated table of `payment_confirmed` events showing:

| Column                 | Displayed                                                  |
| ---------------------- | ---------------------------------------------------------- |
| Date                   | Yes                                                        |
| License ID             | Yes                                                        |
| Account ID (truncated) | Yes                                                        |
| Locale                 | Yes                                                        |
| Stripe Session ID      | Yes (truncated, full value on hover)                       |
| Email                  | Masked (first two characters + domain: `jo***@domain.com`) |

Email masking is applied in the dashboard UI. The full email is stored in the database but is not displayed by default. An admin can reveal the full email for a specific row via an explicit action (logged as an admin event).

---

### 5. Accounts

View of all account records.

**Displays:**

- Total accounts created
- Accounts that have verified their email
- Accounts that have accessed the demo environment
- Accounts with an active license
- Accounts with at least one completed download
- Accounts with a license but no completed download (these are candidates for a follow-up if a contact mechanism is added in a future version)
- Accounts created but never verified (potential friction signal)
- Verification token issues (expired tokens, reused tokens)

**Account list:** A paginated table showing:

| Column                 | Displayed                 |
| ---------------------- | ------------------------- |
| Account ID (truncated) | Yes                       |
| License ID             | Yes (blank if no license) |
| Created date           | Yes                       |
| Verified               | Yes/No                    |
| Last login date        | Yes                       |
| Demo accesses          | Yes                       |
| Download count         | Yes                       |
| Locale                 | Yes                       |

Account email is masked by default, same pattern as the purchase section.

---

### 6. Downloads

View of source code download activity.

**Displays:**

- Total downloads initiated
- Total downloads completed
- Downloads with errors (and error detail)
- Downloads by version (when multiple versions exist; at launch, one version)
- Download count per account (identifies accounts that have downloaded multiple times, which is expected behavior but worth visibility)

**Download log:** A paginated table of `download_completed` events:

| Column           | Displayed |
| ---------------- | --------- |
| Date             | Yes       |
| License ID       | Yes       |
| Version          | Yes       |
| Account (masked) | Yes       |

---

### 7. Errors

Consolidated error view across all event tables. This is the operational health section.

**Error feed:** A reverse-chronological list of all error events across all tables, with the following columns:

| Column                                                                   | Displayed                |
| ------------------------------------------------------------------------ | ------------------------ |
| Timestamp                                                                | Yes                      |
| Error type                                                               | Yes                      |
| Error detail                                                             | Yes                      |
| Affected entity (license ID, account ID, or session ID where applicable) | Yes                      |
| Resolved                                                                 | Checkbox (admin-managed) |

**Error types tracked:**

| Error Type                   | Source Table    | Description                                                                      |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `webhook_error`              | purchase_events | Stripe webhook signature validation failed or processing error                   |
| `account_match_error`        | purchase_events | No matching account found for Stripe customer email after payment                |
| `confirmation_email_error`   | purchase_events | Purchase confirmation email delivery failure                                     |
| `account_creation_error`     | account_events  | Database error during account creation                                           |
| `verification_token_expired` | account_events  | User attempted to use an expired email verification link                         |
| `verification_token_reused`  | account_events  | User attempted to use an already-consumed verification link                      |
| `download_error`             | download_events | File transfer failure or signed URL generation failure                           |
| `login_failure`              | account_events  | Failed login attempt (logged for pattern detection, not individual surveillance) |
| `rate_limit_triggered`       | demo_events     | Authenticated user hit the demo environment rate limit                           |

**Error resolution:** Admins can mark errors as resolved. Resolved errors are hidden from the default view but remain in the database. A "show resolved" toggle displays them.

**Alert threshold:** If any error type accumulates more than 3 unresolved instances within a 1-hour window, the dashboard header displays a visible alert badge. No automated external alerting is implemented at launch; the badge is the signal.

---

### 8. Admin Activity Log

A log of actions taken by admin users within the dashboard. Provides an audit trail for the admin layer itself.

**Logged events:**

- Admin login
- Admin logout
- Email revealed (which record, which admin, when)
- Error marked as resolved (which error, which admin, when)
- Manual account actions (if any are added in future versions)

---

## Filtering and Export

**Filtering:** All list views support filtering by date range and by locale. The purchase and account views support filtering by license ID. The account view supports filtering by account state (verified/unverified, licensed/unlicensed).

**Export:** All list views include a CSV export for the current filter state. Exported files include masked emails. A separate export with unmasked emails requires explicit admin confirmation before download. All exports are logged in the admin activity log.

---

## Technical Implementation Notes

The admin dashboard is a set of protected SvelteKit routes under `/admin`. All data is fetched server-side via load functions that query Supabase directly. No admin data is exposed to the client as raw API responses. The admin dashboard does not use the same API surface as the customer-facing application.

Row-level security in Supabase is configured so that the admin service role can read all operational tables. Customer account passwords, session tokens, and raw verification tokens are never displayed in the dashboard under any circumstances. Tokens are stored as hashes. The dashboard has no mechanism to retrieve a plaintext token.

**Dashboard performance.** All aggregate queries (funnel counts, trend data) are materialized or cached with a 5-minute TTL. The dashboard does not run expensive aggregate queries on every page load. The error feed and transaction logs use cursor-based pagination with a default page size of 50 rows.

**No external analytics platform.** The admin dashboard is built on DavidPM's own event tables. No third-party analytics service (Mixpanel, Amplitude, PostHog, etc.) is integrated at launch. This is consistent with the product's data sovereignty philosophy: DavidPM does not send its own operational data to third parties any more than it asks customers to.
