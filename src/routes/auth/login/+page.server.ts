/**
 * Login Page Server
 *
 * Email/password login backed by the local scrypt session helpers in
 * `$lib/server/auth/index.ts`. On success, sets the `primer_session`
 * cookie and redirects to the requested destination.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from "$lib/server/auth/index.js";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    const redirectTo = url.searchParams.get("redirect") || "/app";
    redirect(302, redirectTo);
  }

  return {
    redirectTo: url.searchParams.get("redirect") || "/app",
    resetSuccess: url.searchParams.get("reset") === "success",
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();
    const redirectTo =
      formData.get("redirect")?.toString() ||
      url.searchParams.get("redirect") ||
      "/app";

    if (!email || !password) {
      return fail(400, {
        error: "validation.field_required",
        email,
        needsVerification: false,
      });
    }

    const user = await maybeOne<{
      id: string;
      password_hash: string | null;
      email_verified: boolean | null;
      deactivated_at: string | null;
    }>(sql`
			select id, password_hash, email_verified, deactivated_at
			from users
			where email = ${email}
		`);

    // Always run a hash comparison even on missing user, to keep response
    // time consistent and avoid leaking whether an account exists.
    const valid = user?.password_hash
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!user || !valid || user.deactivated_at) {
      return fail(400, {
        error: "error.login_failed",
        email,
        needsVerification: false,
      });
    }

    if (user.email_verified === false) {
      return fail(400, {
        error: "error.account_not_verified",
        email,
        needsVerification: true,
      });
    }

    const sessionId = await createSession(user.id);
    setSessionCookie(cookies, sessionId);

    redirect(302, redirectTo);
  },
};
