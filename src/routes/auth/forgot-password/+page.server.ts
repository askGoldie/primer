/**
 * Forgot Password Page Server
 *
 * POST issues a password reset token (logged for now, emailed in Phase 4).
 * Always returns success to avoid leaking whether an account exists.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import { createPasswordResetToken } from "$lib/server/auth/index.js";
import { env as pubEnv } from "$env/dynamic/public";

export const load: PageServerLoad = async ({ url }) => {
  redirect(302, `/auth/login${url.search}`);
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim().toLowerCase();

    if (!email) {
      return fail(400, { error: "validation.field_required", email });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, { error: "validation.email_invalid", email });
    }

    const user = await maybeOne<{ id: string }>(sql`
			select id from users where email = ${email} and deactivated_at is null
		`);

    if (user) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${pubEnv.PUBLIC_APP_URL ?? ""}/auth/reset-password?token=${token}`;
      // TODO Phase 4: actually send the email when configured.
      console.log(`[forgot-password] reset link for ${email}: ${resetUrl}`);
    }

    // Always return success.
    return { success: true };
  },
};
