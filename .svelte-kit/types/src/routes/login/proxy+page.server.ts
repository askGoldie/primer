// @ts-nocheck
/**
 * Login - Customer Auth Integration Point
 *
 * GET  /login?as={nodeId} - shows the login form for the selected persona
 * POST /login              - sets the primer_perspective cookie and redirects to /app
 *
 * This is where customers wire in their own authentication provider.
 * On the demo site it acts as a stub: the visitor sees the persona's
 * name, email, and a password field. On submit, no real auth happens -
 * the selected nodeId is stored in a cookie so the app knows which
 * hierarchy node to display.
 *
 * The cookie mechanism is the handoff contract: your auth provider
 * authenticates the user and then sets `primer_perspective` to the
 * user's hierarchy node ID before redirecting to /app.
 */

import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import {
	PLATFORM_ROSTER,
	PLATFORM_PASSWORD,
	PERSPECTIVE_COOKIE
} from '$lib/server/demo/constants.js';

/**
 * Extra demo personas that exist in the DB seed but are NOT part of the
 * platform hierarchy tree in constants.ts (PLATFORM_ROSTER).
 *
 * Two kinds live here:
 *
 *   1. Tree-placed users whose node was added in a SQL seed step after the
 *      TypeScript tree was frozen (e.g. Derek Solís, node b100-214 added in
 *      seeds/07_structure.sql under Cameron's team).
 *
 *   2. Users intentionally seeded WITHOUT a hierarchy node so the demo can
 *      showcase unplaced-user flows (Aisha Torres — new hire awaiting
 *      placement) or cross-cutting admin roles that don't sit in the tree
 *      (Linda Reyes — HR Director; Carlos Mendez — Chief of Staff).
 *
 * The `loginId` key is whatever /platform passes as `?as=` — either a node
 * UUID (kind 1) or a user UUID (kind 2). The perspective cookie stores
 * exactly that value; hooks.server.ts resolves it as node-then-user.
 */
const EXTRA_PERSONAS: Record<
	string,
	{
		name: string;
		email: string;
		title: string;
		orgRole: 'owner' | 'editor' | 'viewer';
		nodeType: 'individual' | 'team' | 'department' | 'executive';
	}
> = {
	// Tree-placed (kind 1): Derek Solís — IC under Cameron's Platform team
	'00000000-0000-4000-b100-000000000214': {
		name: 'Derek Solís',
		email: 'derek.solis@tier.internal',
		title: 'Software Engineer',
		orgRole: 'editor',
		nodeType: 'individual'
	},
	// Unplaced (kind 2): Aisha Torres — new hire awaiting placement
	'00000000-0000-4000-b000-000000000090': {
		name: 'Aisha Torres',
		email: 'aisha.torres@tier.internal',
		title: 'Associate Product Manager',
		orgRole: 'viewer',
		nodeType: 'individual'
	},
	// Unplaced (kind 2): Linda Reyes — HR Director, cross-cutting role
	'00000000-0000-4000-b000-000000000070': {
		name: 'Linda Reyes',
		email: 'linda.reyes@tier.internal',
		title: 'HR Director',
		orgRole: 'editor',
		nodeType: 'individual'
	},
	// Unplaced (kind 2): Carlos Mendez — Chief of Staff, owner-level admin
	'00000000-0000-4000-b000-000000000080': {
		name: 'Carlos Mendez',
		email: 'carlos.mendez@tier.internal',
		title: 'Chief of Staff',
		orgRole: 'owner',
		nodeType: 'individual'
	}
};

export const load = async ({ url, parent }: Parameters<PageServerLoad>[0]) => {
	const { locale } = await parent();
	// `as` holds the perspective identifier — a node UUID for tree members
	// or a user UUID for the unplaced / cross-cutting personas above.
	const loginId = url.searchParams.get('as');

	if (!loginId) {
		// No persona selected - send to role picker
		redirect(302, '/platform');
	}

	// Primary lookup: the main platform hierarchy tree.
	const rosterMatch = PLATFORM_ROSTER.find((p) => p.nodeId === loginId);
	// Fallback lookup: extras table (tree-late-adds + unplaced users).
	const extraMatch = EXTRA_PERSONAS[loginId];

	if (!rosterMatch && !extraMatch) {
		redirect(302, '/platform');
	}

	const person = rosterMatch
		? {
				nodeId: rosterMatch.nodeId,
				name: rosterMatch.name,
				email: rosterMatch.email,
				title: rosterMatch.title,
				orgRole: rosterMatch.orgRole,
				nodeType: rosterMatch.nodeType
			}
		: {
				// `nodeId` here is the form field name the POST handler reads —
				// it may in fact be a user UUID, not a node UUID. The cookie
				// contract is just "whatever identifier downstream can resolve."
				nodeId: loginId,
				name: extraMatch!.name,
				email: extraMatch!.email,
				title: extraMatch!.title,
				orgRole: extraMatch!.orgRole,
				nodeType: extraMatch!.nodeType
			};

	return {
		locale,
		person,
		// Pre-filled on the demo site so visitors can pass through without typing.
		// On a real deployment this field is left empty and your auth logic validates it.
		password: PLATFORM_PASSWORD
	};
};

export const actions = {
	default: async ({ request, cookies }: import('./$types').RequestEvent) => {
		const formData = await request.formData();
		// The form field is named `nodeId` for historical reasons but its value
		// is a perspective identifier — may be a node UUID or a user UUID.
		const loginId = formData.get('nodeId') as string;
		const password = formData.get('password') as string;

		if (!loginId) {
			return fail(400, { error: 'platform.login_error_no_role' });
		}

		const isValid = PLATFORM_ROSTER.some((p) => p.nodeId === loginId) || loginId in EXTRA_PERSONAS;

		if (!isValid) {
			return fail(400, { error: 'platform.login_error_no_role' });
		}

		// ---- Replace the block below with your authentication logic ----
		// Validate the submitted credentials against your auth provider here.
		// On the demo site we check a shared password; on your deployment you
		// would call your identity provider, session store, LDAP, etc.
		if (password !== PLATFORM_PASSWORD) {
			return fail(400, { error: 'error.login_failed' });
		}
		// ---- End of customer-replaceable block ----

		// Set perspective cookie - this is the handoff contract between your
		// auth layer and the Primer application. Once your auth provider has
		// verified the user, set primer_perspective to their hierarchy node ID
		// and redirect to /app. Everything downstream reads from this cookie.
		cookies.set(PERSPECTIVE_COOKIE, loginId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(302, '/app');
	}
};
;null as any as Actions;