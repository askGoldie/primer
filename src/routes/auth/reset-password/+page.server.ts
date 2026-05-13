/**
 * Reset Password Page Server
 *
 * The user arrives here from the link in the password-reset email,
 * carrying a `token` query parameter. POST submits the new password and
 * the token; on success the user's password is updated and all existing
 * sessions are invalidated.
 *
 * Phase 4 will add a proper UI page; for now the GET load redirects to
 * /auth/login (the form would need to know the token).
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import {
  completePasswordReset,
  validatePassword,
  MIN_PASSWORD_LENGTH,
} from "$lib/server/auth/index.js";

export const load: PageServerLoad = async ({ url }) => {
  redirect(302, `/auth/login${url.search}`);
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const token =
      formData.get("token")?.toString() || url.searchParams.get("token");
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!token) {
      return fail(400, { error: "auth.verification_expired" });
    }

    if (!password) {
      return fail(400, { error: "validation.field_required" });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return fail(400, {
        error: "validation.password_min",
        minLength: MIN_PASSWORD_LENGTH,
      });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: "validation.password_match" });
    }

    const ok = await completePasswordReset(token, password);
    if (!ok) {
      return fail(400, { error: "auth.verification_expired" });
    }

    redirect(302, "/auth/login?reset=success");
  },
};
