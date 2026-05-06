// @ts-nocheck
/**
 * Root Layout Server Load
 *
 * Runs on every request. Passes locale and user to all pages via PageData.
 */

import type { LayoutServerLoad } from './$types.js';

export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
	return {
		locale: locals.locale,
		user: locals.user
	};
};
