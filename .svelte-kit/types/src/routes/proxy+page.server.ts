// @ts-nocheck
/**
 * Root Route Redirect
 *
 * The marketing home page lives at /web/home. Visitors who land on /
 * are redirected server-side with a 308 (Permanent Redirect) so that:
 *   - there is a single HTTP round-trip (no meta-refresh flash, no client goto)
 *   - browsers and the Vercel edge can cache the redirect
 *   - SEO credit transfers cleanly to /web/home
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load = () => {
	redirect(308, '/web/home');
};
;null as any as PageServerLoad;