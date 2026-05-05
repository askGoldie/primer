// @ts-nocheck
/**
 * Onboarding Page — server loader
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TO REMOVE THE ONBOARDING TAB ENTIRELY:
 *   1. Delete this folder          src/routes/app/onboarding/
 *   2. Delete the components folder src/lib/components/onboarding/
 *   3. Remove the nav entry in src/routes/app/+layout.svelte marked
 *      `// ── ONBOARDING NAV (removable) ──`
 *   4. Delete the `onboarding.*` keys from every file in src/lib/i18n/
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Access control: only users with `isSystemAdmin` (owner or system_admin)
 * may view the onboarding tab. This matches the "CEO and system admins"
 * scope from the feature brief — on the demo site the owner role is the
 * CEO equivalent, and customer deployments can point this check at their
 * own role predicate without touching the client code.
 *
 * Anyone else who guesses the URL is bounced to the dashboard rather than
 * shown a 403, so removing the tab in the nav is also enough to hide it
 * from regular users.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
	const { isSystemAdmin } = await parent();

	if (!isSystemAdmin) {
		redirect(302, '/app');
	}

	// No additional data needed — path content is static and lives in i18n.
	return {};
};
