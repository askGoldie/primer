/**
 * Demo Part Page Server Load
 *
 * Legacy part URLs redirect to the new single-page walkthrough.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	redirect(301, '/web/demo');
};
