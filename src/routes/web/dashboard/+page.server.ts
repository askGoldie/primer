/**
 * Dashboard Page Server
 *
 * The authenticated hub for all signed-in users. Renders differently based
 * on license status:
 *
 * - Without license: purchase inquiry form + demo platform CTA
 * - With license: download section + getting started guide
 *
 * Also handles the purchase inquiry form submission (Postmark emails).
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { getUserLicense } from '$lib/server/license/index.js';
import { sendInquiryNotification, sendInquiryConfirmation } from '$lib/server/postmark/index.js';
import { db } from '$lib/server/db.js';

/**
 * Current release version.
 * In production, this would come from a releases table or config.
 */
const CURRENT_VERSION = '1.0.0';

export const load: PageServerLoad = async ({ locals }) => {
	// Require real Supabase authentication — not just a demo persona cookie.
	// locals.user may be a persona; isSupabaseAuthenticated is only true when
	// the Supabase JWT was validated.
	if (!locals.isSupabaseAuthenticated || !locals.session) {
		redirect(302, '/auth/login?redirect=/web/dashboard');
	}

	// Resolve the real Supabase account (not the persona override in locals.user)
	const { data: realUser } = await db
		.from('users')
		.select('id, name, email')
		.eq('id', locals.session.user.id)
		.single();

	if (!realUser) {
		redirect(302, '/auth/login?redirect=/web/dashboard');
	}

	// Check license status — determines which dashboard view to render
	const license = await getUserLicense(realUser.id);

	if (!license) {
		// Unlicensed: show inquiry form + demo CTA
		return {
			hasLicense: false as const,
			user: {
				name: realUser.name,
				email: realUser.email
			}
		};
	}

	// Licensed: show download section + getting started
	const { data: recentDownloads } = await db
		.from('download_events')
		.select('*')
		.eq('license_id', license.id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		hasLicense: true as const,
		license: {
			id: license.id,
			purchasedAt: license.purchased_at,
			status: license.status
		},
		currentVersion: CURRENT_VERSION,
		recentDownloads: (recentDownloads ?? []).map((d) => ({
			version: d.version,
			downloadedAt: d.created_at
		})),
		user: {
			name: realUser.name,
			email: realUser.email
		}
	};
};

export const actions: Actions = {
	/**
	 * Handle purchase inquiry form submission.
	 *
	 * Sends two emails via Postmark:
	 * 1. Internal notification to the Tier team
	 * 2. Confirmation to the prospect with next steps
	 *
	 * Tracks the event in purchase_events for analytics.
	 */
	inquiry: async ({ request, locals }) => {
		if (!locals.isSupabaseAuthenticated || !locals.session) {
			redirect(302, '/auth/login?redirect=/web/dashboard');
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const email = formData.get('email')?.toString().trim().toLowerCase();
		const organizationName = formData.get('organizationName')?.toString().trim();
		const message = formData.get('message')?.toString().trim() || '';
		const salesAgent = formData.get('salesAgent')?.toString().trim() || null;
		// Default to 'purchase' so missing/unknown values always fall through
		// to the direct-buy path rather than silently routing to the sales team.
		const rawType = formData.get('requestType')?.toString();
		const requestType: 'purchase' | 'meeting' = rawType === 'meeting' ? 'meeting' : 'purchase';

		if (!name || !email || !organizationName) {
			return fail(400, { error: 'validation.field_required' });
		}

		const inquiry = { name, email, organizationName, message, salesAgent, requestType };

		try {
			// Send emails (fire both in parallel). Both email templates branch
			// internally on requestType to show the right next-steps copy.
			await Promise.all([sendInquiryNotification(inquiry), sendInquiryConfirmation(inquiry)]);

			// Track in analytics. The `request_type` and `sales_agent` columns
			// are added by migration 20260101000012_addon_purchase_contact_fields.
			await db.from('purchase_events').insert({
				account_id: locals.session.user.id,
				customer_email: email,
				event_type: requestType === 'meeting' ? 'meeting_requested' : 'inquiry_submitted',
				request_type: requestType,
				sales_agent: salesAgent,
				locale: locals.locale
			});

			return { success: true };
		} catch (err) {
			console.error('Purchase inquiry failed:', err);

			// Track error
			await db.from('purchase_events').insert({
				account_id: locals.session.user.id,
				event_type: 'inquiry_error',
				request_type: requestType,
				sales_agent: salesAgent,
				error_detail: err instanceof Error ? err.message : 'Unknown error',
				locale: locals.locale
			});

			return fail(500, { error: 'purchase.inquiry_error' });
		}
	}
};
