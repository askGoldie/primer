# The Auth Seam

For the engineer integrating Primer with your identity provider. Tells you exactly what Primer needs from your auth system, what files to touch, and what to leave alone.

Primer ships with email/password authentication as a placeholder. Most deployments replace it. Every customer's identity provider is different — attribute mapping, group claims, MFA policies, certificate rotation, session lifetimes — and a pre-baked integration would be wrong for someone else. Instead, the codebase exposes a small, well-defined contract that any auth system can plug into.

**You do the integration work. The codebase makes the integration *point* small enough that the work is bounded.**

---

## The contract

Every protected route in Primer reads one thing: `event.locals.user`. That is the entire contract.

Your integration's job is to populate `event.locals.user` and `event.locals.isAdmin` on every request, by whatever means makes sense for your IdP.

### `App.Locals['user']` shape

Declared in [`src/app.d.ts`](../src/app.d.ts). Resolves to the `User` interface in [`src/lib/types/index.ts`](../src/lib/types/index.ts):

```ts
interface User {
  id: string;            // stable per-user identifier — UUID is fine, IdP "sub" claim is fine
  email: string;
  name: string;
  locale: string;        // 'en', 'es', 'de', etc. Default to 'en' if your IdP doesn't carry it.
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Plus two scalars on `event.locals`:

- `user: User | null` — `null` when unauthenticated.
- `isAdmin: boolean` — your decision how to derive this (group claim, role claim, an `is_admin` column on a local users table, etc.).

Everything else in `src/lib/server/auth/` is implementation of the bundled email/password flow. It is deletable.

---

## The seam

A single hook in [`src/hooks.server.ts`](../src/hooks.server.ts) reads the request and populates `locals`. It is the only place the auth implementation is called from.

The bundled hook today, in shape:

```ts
const handleAuth: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.isAdmin = false;

  // Your job: figure out who, if anyone, is making this request.
  // Read whatever your IdP gives you — cookie, Authorization header, JWT, mTLS cert, etc.
  const result = await yourValidateRequest(event);

  if (result) {
    event.locals.user = result.user;       // must match the User interface above
    event.locals.isAdmin = result.isAdmin; // boolean
  }

  return resolve(event);
};
```

The bundled `validateSession(sessionId)` function is one shape this can take. You can keep that signature and adapt the body, or replace the function entirely. Nothing downstream cares.

---

## Swap checklist

### Edit

- `src/hooks.server.ts` — adapt `handleAuth` to read your session/token model.
- `src/lib/server/auth/index.ts` — replace with your IdP integration, or delete the file and import directly into the hook.

### Delete (if your IdP owns these flows)

- `src/routes/auth/login/`
- `src/routes/auth/register/`
- `src/routes/auth/forgot-password/`
- `src/routes/auth/reset-password/`
- `src/routes/auth/verify-email/`
- `src/routes/auth/logout/` — or replace with a handler that calls your IdP's logout endpoint.

### Leave alone

- Everything that reads `event.locals.user`. That covers the entire `/app/*` route tree, every server load function, and every form action. They depend on the contract above and nothing else.
- `src/lib/server/permissions.ts` — application-layer authorization. Operates on `locals.user` and the role × hierarchy matrix. No changes needed when you swap auth.

### Optional — depending on your model

- The `sessions` table ([`migrations/20260101000008_sessions.sql`](../migrations/20260101000008_sessions.sql)). Drop it if you're using stateless JWT verification. Keep it if you want a server-side session cache for revocation, MFA step-up, or audit purposes.
- The `users` table. Most IdP integrations keep it as a local mirror so authorization (admin flags, hierarchy bindings) doesn't require an IdP round-trip on every request. Provision rows lazily on first login, or push from your IdP via SCIM — your call.
- The `email_verification_tokens` and `password_reset_tokens` tables. Drop both if your IdP owns those flows.

---

## Coupling audit

As of this version, no file outside `src/hooks.server.ts` and the bundled `src/routes/auth/*` routes imports from `src/lib/server/auth/`. The seam is clean.

Verify yourself:

```sh
grep -rn "from.*server/auth" src/
```

Should return only the hook and the bundled auth routes. If you're adding new code to Primer, keep it that way: read `locals.user`, don't reach into the auth module.

---

## Common pitfalls

- **Forgetting `locale`.** If you don't set `user.locale` from your IdP, default to `'en'`. Otherwise i18n falls back unpredictably.
- **Setting `locals.user` to a partial object.** TypeScript will let you cast around the shape; don't. Downstream code reads every field. Provision dummy values (`new Date()` for timestamps, an empty string for fields you don't have) only as a deliberate, documented choice.
- **Forgetting `event.locals.user = null` at the top of the hook.** SvelteKit reuses request objects in some scenarios. Always reset before the auth check.
- **Throwing inside the hook on auth failure.** The bundled hook catches and continues unauthenticated. Match that behavior — a 500 from the auth layer makes the whole site unreachable instead of just signing the user out.
- **Reading `locals.user` from anywhere other than server-side code.** It is server-only by SvelteKit convention. Pass what you need into `PageData` from the route's load function.

---

## What this codebase does not do

- **No bundled IdP integrations.** No Entra branch, no Okta branch, no Cognito branch, no SAML branch. The seam above is the integration point.
- **No claim that "any OIDC library works."** Most do. Pick a maintained one (`openid-client` is a safe default). Read its docs. Audit it the same way you audit everything else you ship.
- **No managed session, MFA, or token-refresh service.** Session lifetime, refresh, revocation, and MFA enforcement are your IdP's responsibility once you swap the bundled flow.
- **No validation of your integration.** Your existing security review process applies to the auth code you write, the same way it applies to every other internal app you run.

---

## What is bounded

The integration work is:

1. Pick an OIDC/SAML/LDAP library you trust.
2. Write a request-validation function appropriate to your IdP.
3. Adapt one hook in `src/hooks.server.ts`.
4. Delete the bundled `/auth/*` routes if your IdP owns those flows.

There is no second auth surface in the codebase. A competent integrator can complete the swap in 1–3 days for OIDC against a mainstream provider; SAML and LDAP scale with the gnarliness of your specific configuration, not with anything in Primer.
