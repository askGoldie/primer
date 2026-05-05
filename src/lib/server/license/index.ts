/**
 * License Management Module
 *
 * Handles license queries and manual granting for the perpetual license model.
 * Replaces the previous Stripe-based payment module. Licenses are now granted
 * manually after receiving payment and a signed license agreement.
 *
 * @example
 * ```ts
 * import { getUserLicense, hasActiveLicense, grantLicense } from '$lib/server/license/index.js';
 *
 * // Check if user has a license
 * const license = await getUserLicense(userId);
 *
 * // Grant a license (admin action)
 * await grantLicense(userId, 'customer@example.com');
 * ```
 */

import { db } from '$lib/server/db.js';

/**
 * License price in USD — the perpetual license price.
 * Used for display and revenue calculations.
 */
export const LICENSE_PRICE_USD = 5000;

/**
 * Get a user's license record if one exists.
 *
 * @param userId - The authenticated user's ID
 * @returns The license record, or null if the user has no license
 */
export async function getUserLicense(userId: string) {
	const { data: license } = await db.from('licenses').select('*').eq('user_id', userId).single();

	return license || null;
}

/**
 * Check whether a user has an active license.
 *
 * @param userId - The authenticated user's ID
 * @returns True if the user has a license with status 'active'
 */
export async function hasActiveLicense(userId: string): Promise<boolean> {
	const license = await getUserLicense(userId);
	return license?.status === 'active';
}

/**
 * Manually grant a license to a user.
 *
 * Called by an admin after payment has been received and the license
 * agreement has been signed. Idempotent — if the user already has a
 * license, the existing license ID is returned.
 *
 * @param userId - The user to grant the license to
 * @param customerEmail - The customer's email (for audit trail)
 * @returns The license ID
 */
export async function grantLicense(userId: string, customerEmail: string): Promise<string> {
	// Idempotency: return existing license if one exists
	const existing = await getUserLicense(userId);
	if (existing) {
		return existing.id;
	}

	const { data: license, error } = await db
		.from('licenses')
		.insert({
			user_id: userId,
			status: 'active'
		})
		.select()
		.single();

	if (error || !license) {
		throw new Error(`Failed to create license: ${error?.message}`);
	}

	// Track the grant event
	await db.from('purchase_events').insert({
		account_id: userId,
		event_type: 'license_granted',
		customer_email: customerEmail
	});

	return license.id;
}
