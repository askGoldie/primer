/**
 * Registration Page Server
 *
 * Creates a user row with a scrypt-hashed password and issues a
 * verification token. The user must verify their email before they can
 * log in (unless email is not configured — see notes below).
 *
 * The bundled email/password flow is intended as a placeholder. Most
 * customers will replace `src/lib/server/auth/*` (and these routes)
 * with their own SSO/OIDC integration during deployment, so the
 * verification email is logged to stdout rather than wired to a
 * transactional provider — drop in your own sender if you keep this
 * flow.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import {
  hashPassword,
  createSession,
  setSessionCookie,
  createVerificationToken,
  validatePassword,
  MIN_PASSWORD_LENGTH,
} from "$lib/server/auth/index.js";
import { env as pubEnv } from "$env/dynamic/public";

export const load: PageServerLoad = async ({ url }) => {
  redirect(302, `/auth/login${url.search}`);
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();
    const name = formData.get("name")?.toString().trim();
    const redirectTo =
      formData.get("redirect")?.toString() ||
      url.searchParams.get("redirect") ||
      "/app";

    if (!email || !password || !name) {
      return fail(400, { error: "validation.field_required", email, name });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, { error: "validation.email_invalid", email, name });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return fail(400, {
        error: "validation.password_min",
        email,
        name,
        minLength: MIN_PASSWORD_LENGTH,
      });
    }

    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/;
    if (!complexityRegex.test(password)) {
      return fail(400, {
        error: "validation.password_complexity",
        email,
        name,
      });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: "validation.password_match", email, name });
    }

    const existing = await maybeOne<{ id: string }>(sql`
			select id from users where email = ${email}
		`);

    if (existing) {
      // Don't leak whether an account exists. Pretend to succeed.
      redirect(
        302,
        `/auth/verify-email?pending=true&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`,
      );
    }

    const passwordHash = await hashPassword(password);

    const inserted = await maybeOne<{ id: string }>(sql`
			insert into users (email, password_hash, name, locale, email_verified, is_admin)
			values (${email}, ${passwordHash}, ${name}, 'en', false, false)
			returning id
		`);

    if (!inserted) {
      console.error("[register] insert into users returned no row");
      return fail(500, { error: "error.generic", email, name });
    }

    const verificationToken = await createVerificationToken(inserted.id);
    const verificationUrl = `${pubEnv.PUBLIC_APP_URL ?? ""}/auth/verify-email?token=${verificationToken}&redirect=${encodeURIComponent(redirectTo)}`;

    // The verification link is logged rather than emailed. Wire your
    // transactional email provider here if you keep the bundled
    // email/password auth flow.
    console.log(
      `[register] verification link for ${email}: ${verificationUrl}`,
    );

    // Auto-create a session so the new user is logged in. They still
    // need to verify their email; gating happens at /auth/login on the
    // next login attempt.
    const sessionId = await createSession(inserted.id);
    setSessionCookie(cookies, sessionId);

    redirect(
      302,
      `/auth/verify-email?pending=true&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`,
    );
  },
};
