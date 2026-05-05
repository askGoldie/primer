/**
 * Visibility Page Server — Redirect
 *
 * Visibility controls (peer visibility and elevated access grants) have been
 * consolidated into the Settings page. This redirect ensures any bookmarks
 * or direct links continue to work.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	redirect(302, '/app/settings');
};
