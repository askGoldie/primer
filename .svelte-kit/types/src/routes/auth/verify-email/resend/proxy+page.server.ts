// @ts-nocheck
/**
 * Resend Verification Email
 *
 * Issues a fresh verification token for an unverified user.
 * Always returns success to avoid leaking whether an account exists.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne } from "$lib/server/db.js";
import { createVerificationToken } from "$lib/server/auth/index.js";
import { env as pubEnv } from "$env/dynamic/public";

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
  redirect(302, `/auth/login${url.search}`);
};

export const actions = {
  default: async ({ request }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const redirectTo = formData.get("redirect")?.toString() || "/app";

    if (!email) {
      return fail(400, { error: "validation.field_required", email });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, { error: "validation.email_invalid", email });
    }

    const user = await maybeOne<{
      id: string;
      email_verified: boolean | null;
    }>(sql`
			select id, email_verified from users where email = ${email} and deactivated_at is null
		`);

    if (user && user.email_verified !== true) {
      const token = await createVerificationToken(user.id);
      const verifyUrl = `${pubEnv.PUBLIC_APP_URL ?? ""}/auth/verify-email?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;
      // TODO Phase 4: actually send the email when configured.
      console.log(
        `[verify-email/resend] verification link for ${email}: ${verifyUrl}`,
      );
    }

    return { success: true, email, redirectTo };
  },
};
;null as any as Actions;