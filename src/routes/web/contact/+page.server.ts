/**
 * Contact Page Server
 *
 * Handles general contact form submissions from the public marketing site.
 * Unlike the purchase inquiry form on /web/dashboard, this endpoint does not
 * require authentication — anyone can reach DavidPM here.
 *
 * On submit:
 *   1. Validate required fields (name, email, message); company is optional.
 *   2. Honeypot spam check: a hidden "website" field that real users never fill.
 *      If a bot fills it, the submission is silently discarded with a fake-success
 *      response so the bot does not retry.
 *   3. Send two emails via Postmark:
 *        - Internal notification → PURCHASE_NOTIFY_EMAIL
 *        - Confirmation → the submitter
 *   4. Track in purchase_events with event_type='contact_submitted'.
 *      account_id is null (public submission, no logged-in user).
 *
 * The two emails are sent in parallel; if either fails the action returns
 * a 500 with a localizable error key, and an 'inquiry_error'-style row is
 * written to purchase_events for the admin error dashboard.
 */

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { sendContactNotification, sendContactConfirmation } from '$lib/server/postmark/index.js';
import { db } from '$lib/server/db.js';

/**
 * Lightweight RFC-5322-ish email regex. SvelteKit input type="email" gives us
 * a first pass on the client; this is just a server-side sanity check.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const name = formData.get('name')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
		const company = formData.get('company')?.toString().trim() ?? '';
		const message = formData.get('message')?.toString().trim() ?? '';

		// Honeypot: real users leave this empty; bots fill every field they see.
		// We return a fake success so the bot believes the form accepted them
		// and does not retry. No email is sent and no row is written.
		const honeypot = formData.get('website')?.toString() ?? '';
		if (honeypot.length > 0) {
			return { success: true };
		}

		// Validation — preserve submitted values so the form can re-render them
		// alongside the error message.
		if (!name || !email || !message) {
			return fail(400, {
				error: 'validation.field_required',
				values: { name, email, company, message }
			});
		}

		if (!EMAIL_RE.test(email)) {
			return fail(400, {
				error: 'validation.field_required',
				values: { name, email, company, message }
			});
		}

		const contact = { name, email, company, message };

		try {
			// Send both emails in parallel — fail fast if either errors.
			await Promise.all([sendContactNotification(contact), sendContactConfirmation(contact)]);

			// Track in analytics. account_id is null because the contact form is
			// public; customer_email is the source of truth for follow-up.
			await db.from('purchase_events').insert({
				account_id: null,
				customer_email: email,
				event_type: 'contact_submitted',
				locale: locals.locale
			});

			return { success: true };
		} catch (err) {
			console.error('Contact form submission failed:', err);

			// Track the error so the admin error dashboard surfaces it.
			await db.from('purchase_events').insert({
				account_id: null,
				customer_email: email,
				event_type: 'contact_error',
				error_detail: err instanceof Error ? err.message : 'Unknown error',
				locale: locals.locale
			});

			return fail(500, {
				error: 'contact.error',
				values: { name, email, company, message }
			});
		}
	}
};
