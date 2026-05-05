/**
 * App Layout Server
 *
 * Loads organization context for all /app routes.
 *
 * Access is permitted in two ways (see hooks.server.ts for details):
 *
 * 1. **Platform demo mode** - visitor arrived via /platform/login which sets
 *    a `primer_perspective` cookie. The hook layer populates `locals.user` from
 *    the platform org's seeded user record for that node, so all downstream
 *    route logic works identically to authenticated mode.
 *
 * 2. **Authenticated mode** - a real Supabase session populates `locals.user`.
 *    Used on customer deployments and when team members log in directly.
 *
 * If neither condition is met, the visitor is redirected to login.
 */

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import {
	PLATFORM_ORG_ID,
	PLATFORM_CEO_USER_ID,
	PERSPECTIVE_COOKIE
} from '$lib/server/demo/constants.js';
import { seedDemoData } from '$lib/server/demo/seed.js';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	// Require user - populated by either real Supabase auth or the perspective
	// cookie handler in hooks.server.ts. If neither is present, send to /login
	// which either prompts for a persona (demo) or triggers customer auth.
	if (!locals.user) {
		redirect(302, '/login');
	}

	// Read the perspective cookie up front - needed below when isPlatform = true
	const perspectiveNodeId = cookies.get(PERSPECTIVE_COOKIE) ?? null;

	// Get user's organization membership
	const { data: memberships } = await db
		.from('org_members')
		.select('*, organizations(*)')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.limit(1);

	let membership = memberships?.[0] ?? null;

	// No membership - try to auto-enroll in the platform org (demo site only)
	if (!membership) {
		if (!locals.isSupabaseAuthenticated) {
			// Perspective-cookie users (customer deployments) must already have
			// a membership from their own auth provider. No membership = setup.
			redirect(302, '/app/setup');
		}

		// Supabase-authenticated user on the demo site.
		// Ensure the platform org and its seed data exist, then enroll them.
		const { data: platformOrg } = await db
			.from('organizations')
			.select('id')
			.eq('id', PLATFORM_ORG_ID)
			.single();

		const { data: ceoUser } = platformOrg
			? await db.from('users').select('id').eq('id', PLATFORM_CEO_USER_ID).single()
			: { data: null };

		if (!platformOrg || !ceoUser) {
			// Seed everything — org, 69 users, nodes, metrics, etc.
			await seedDemoData();
		}

		// ── DEMO SITE ONLY ──────────────────────────────────────────────────
		// Enroll Supabase-authenticated visitors as owners so they can fully
		// exercise every feature when demoing with a perspective persona.
		//
		// CUSTOMER DEPLOYMENT: Remove or change to 'viewer' (or your preferred
		// default role). Your auth provider should assign roles explicitly.
		// ─────────────────────────────────────────────────────────────────────
		await db.from('org_members').insert({
			organization_id: PLATFORM_ORG_ID,
			user_id: locals.user.id,
			role: 'owner',
			assigned_by: PLATFORM_CEO_USER_ID
		});

		// Re-query to get the full membership + org join
		const { data: reMemberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		membership = reMemberships?.[0] ?? null;
	}

	// Safety check — enrollment above should always produce a membership.
	// Supabase users who somehow still have no membership go back to /platform
	// to try picking a persona again, not to the org setup wizard.
	if (!membership || !membership.organizations) {
		if (locals.isSupabaseAuthenticated) {
			redirect(302, '/platform');
		}
		redirect(302, '/app/setup');
	}

	const org = membership.organizations;
	const isPlatform = org.id === PLATFORM_ORG_ID;

	// Determine which hierarchy node to show
	let userNode: {
		id: string;
		name: string;
		title: string | null;
		nodeType: string;
	} | null = null;

	if (isPlatform) {
		// Platform org: use the perspective cookie to determine the node.
		//
		// The cookie holds a perspective identifier that can be either:
		//   (a) an org_hierarchy_nodes.id — most picker personas live in the
		//       tree and are reached by node id; or
		//   (b) a users.id for personas that exist in seed data without a
		//       tree node (HR Director, Chief of Staff, etc.). These admin
		//       perspectives operate org-wide and don't need a hierarchy slot.
		//
		// Try the node lookup first, then fall back to "find a node owned by
		// this user." Either way, if no node is found we leave userNode null
		// and let the role checks below decide whether the persona can
		// operate without a placement.
		if (!perspectiveNodeId) {
			// No perspective selected - send them to pick a role
			redirect(302, '/platform');
		}

		const { data: nodeById } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('id', perspectiveNodeId)
			.eq('organization_id', PLATFORM_ORG_ID)
			.maybeSingle();

		let perspectiveNode = nodeById;

		if (!perspectiveNode) {
			// Fall back: treat the cookie value as a user id and look up any
			// hierarchy node linked to that user in the platform org.
			const { data: nodeByUser } = await db
				.from('org_hierarchy_nodes')
				.select('*')
				.eq('user_id', perspectiveNodeId)
				.eq('organization_id', PLATFORM_ORG_ID)
				.maybeSingle();
			perspectiveNode = nodeByUser;
		}

		if (perspectiveNode) {
			userNode = {
				id: perspectiveNode.id,
				name: perspectiveNode.name,
				title: perspectiveNode.title,
				nodeType: perspectiveNode.node_type
			};
		}
		// If still no node, userNode stays null. Admin-style personas
		// (system_admin / owner / hr_admin) are allowed through by the
		// role checks below; anyone else hits the needsPlacement screen.
	} else {
		// Customer deployment: show the user's own hierarchy node
		const { data: ownNode } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('organization_id', org.id)
			.eq('user_id', locals.user.id)
			.single();

		if (ownNode) {
			userNode = {
				id: ownNode.id,
				name: ownNode.name,
				title: ownNode.title,
				nodeType: ownNode.node_type
			};
		}
	}

	// ── Peers check ─────────────────────────────────────────────────────────
	// True when the user's node has siblings under the same parent.
	// The CEO (root node) has no parent, so hasPeers is always false for them.
	let hasPeers = false;

	if (userNode) {
		const { data: currentNodeRecord } = await db
			.from('org_hierarchy_nodes')
			.select('parent_id')
			.eq('id', userNode.id)
			.single();

		if (currentNodeRecord?.parent_id) {
			const { data: peerCheck } = await db
				.from('org_hierarchy_nodes')
				.select('id')
				.eq('parent_id', currentNodeRecord.parent_id)
				.neq('id', userNode.id)
				.eq('organization_id', org.id)
				.limit(1);

			hasPeers = (peerCheck?.length ?? 0) > 0;
		}
	}

	// ── Direct reports check ─────────────────────────────────────────────────
	// hasDirectReports gates "My Team" tab — ICs (leaf nodes) don't see it.
	// isManagerOfManagers gates "Visibility" tab — only two+ level managers.
	let hasDirectReports = false;
	let isManagerOfManagers = false;

	if (userNode) {
		const { data: directReports } = await db
			.from('org_hierarchy_nodes')
			.select('id')
			.eq('parent_id', userNode.id)
			.eq('organization_id', org.id)
			.limit(1);

		if (directReports?.length) {
			hasDirectReports = true;

			// Check if any direct report also has children
			const directReportIds = directReports.map((n) => n.id);
			const { data: grandReports } = await db
				.from('org_hierarchy_nodes')
				.select('id')
				.in('parent_id', directReportIds)
				.eq('organization_id', org.id)
				.limit(1);

			isManagerOfManagers = (grandReports?.length ?? 0) > 0;
		}
	}

	// ── Role checks ─────────────────────────────────────────────────────────
	// System admins and owners get org-wide management access and can operate
	// without a hierarchy node (e.g. HR Director administering the tool).
	const isSystemAdmin = membership.role === 'system_admin' || membership.role === 'owner';
	const isHrAdmin = membership.role === 'hr_admin';
	const isParticipant = membership.role === 'participant';

	// ── Unplaced user detection ─────────────────────────────────────────────
	// Users without a hierarchy node who are not system admins or HR admins
	// need to be placed in the org chart before they can use the app.
	const needsPlacement = !userNode && !isSystemAdmin && !isHrAdmin;

	// ── Visibility tab gating ───────────────────────────────────────────────
	// Show Visibility tab when user has direct reports (regardless of depth)
	// or is a system admin or HR admin. The isManagerOfManagers flag is still
	// computed for other contexts but no longer gates the Visibility nav item.
	const showVisibilityTab = hasDirectReports || isSystemAdmin || isHrAdmin;

	// System admins/HR admins without a node still get full nav
	if ((isSystemAdmin || isHrAdmin) && !userNode) {
		isManagerOfManagers = true;
	}

	return {
		user: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email
		},
		organization: {
			id: org.id,
			name: org.name,
			industry: org.industry,
			cycleCadence: org.cycle_cadence,
			inquiryEnabled: org.inquiry_enabled
		},
		membership: {
			role: membership.role
		},
		userNode,
		isPlatform,
		hasDirectReports,
		isManagerOfManagers,
		hasPeers,
		isSystemAdmin,
		isHrAdmin,
		isParticipant,
		needsPlacement,
		showVisibilityTab
	};
};
