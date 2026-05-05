/**
 * Admin Accounts Page Server
 *
 * Lists all user accounts with their license status.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load: PageServerLoad = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 50;
	const offset = (page - 1) * limit;

	// Get users with their license info
	const { data: allUsers } = await db
		.from('users')
		.select('*, licenses(*)')
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// Get total count
	const { count: total } = await db.from('users').select('*', { count: 'exact', head: true });

	// Get verified count
	const { count: verified } = await db
		.from('users')
		.select('*', { count: 'exact', head: true })
		.eq('email_verified', true);

	// Get with license count
	const { count: licensed } = await db.from('licenses').select('*', { count: 'exact', head: true });

	return {
		accounts: (allUsers ?? []).map((row) => {
			// licenses comes back as an array from the join
			const license = Array.isArray(row.licenses) ? row.licenses[0] : row.licenses;
			return {
				id: row.id,
				name: row.name,
				email: row.email,
				emailVerified: row.email_verified,
				isAdmin: row.is_admin,
				locale: row.locale,
				createdAt: row.created_at,
				deactivatedAt: row.deactivated_at || null,
				license: license
					? {
							id: license.id,
							status: license.status,
							purchasedAt: license.purchased_at
						}
					: null
			};
		}),
		pagination: {
			page,
			totalPages: Math.ceil((total ?? 0) / limit),
			total: total ?? 0
		},
		stats: {
			total: total ?? 0,
			verified: verified ?? 0,
			licensed: licensed ?? 0
		}
	};
};
