// @ts-nocheck
/**
 * Performance route redirect.
 *
 * Performance tracking has been consolidated into the Goals page
 * under the "Performance" tab. This redirect preserves any bookmarks
 * or external links to the old standalone route.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load = async () => {
	redirect(301, '/app/goals');
};
;null as any as PageServerLoad;