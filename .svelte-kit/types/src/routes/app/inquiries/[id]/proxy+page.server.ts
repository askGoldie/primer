// @ts-nocheck
/**
 * Inquiry Detail Page Server
 *
 * Shows full inquiry details and allows resolution.
 */

import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { sql, maybeOne, many } from '$lib/server/db.js';
import { canResolveAnyInquiry } from '$lib/server/permissions.js';
import type { OrgRole } from '$lib/types/database.js';
import { t } from '$lib/i18n/index.js';

interface InquiryRow {
	id: string;
	target_metric_id: string;
	filed_by: string;
	filed_by_node_id: string;
	authority_id: string | null;
	inquiry_type: string;
	status: string;
	challenge_type: string;
	rationale: string;
	resolution_summary: string | null;
	resolution_action: string | null;
	filed_at: string;
	resolved_at: string | null;
}

/**
 * Shared authorization check for resolve/dismiss actions.
 * Returns an inquiry status payload on success, or a fail() Result on denial.
 */
async function authorizeResolution(inquiryId: string, userId: string) {
	const inquiryCheck = await maybeOne<{ authority_id: string | null; status: string }>(sql`
		select authority_id, status from inquiries where id = ${inquiryId}
	`);

	if (!inquiryCheck) return { error: fail(404, { error: 'error.generic' }) };
	if (inquiryCheck.status === 'resolved' || inquiryCheck.status === 'dismissed') {
		return { error: fail(400, { error: 'error.generic' }) };
	}

	const callerMembership = await maybeOne<{ role: OrgRole }>(sql`
		select role from org_members
		where user_id = ${userId} and removed_at is null
		limit 1
	`);

	const callerRole = (callerMembership?.role ?? 'viewer') as OrgRole;
	const isAuthority = userId === inquiryCheck.authority_id;

	if (!isAuthority && !canResolveAnyInquiry(callerRole)) {
		return { error: fail(403, { error: 'error.generic' }) };
	}

	return { error: null };
}

export const load = async ({ params, locals, parent }: Parameters<PageServerLoad>[0]) => {
	const { membership } = await parent();
	const role = membership.role as OrgRole;

	const inquiry = await maybeOne<InquiryRow>(sql`
		select * from inquiries where id = ${params.id}
	`);

	if (!inquiry) {
		throw error(404, t(locals.locale, 'error.inquiry_not_found'));
	}

	const [targetMetric, filedByUser, filedByNode] = await Promise.all([
		maybeOne<{ id: string; name: string }>(sql`
			select id, name from metrics where id = ${inquiry.target_metric_id}
		`),
		maybeOne<{ id: string; name: string }>(sql`
			select id, name from users where id = ${inquiry.filed_by}
		`),
		maybeOne<{ id: string; name: string; title: string | null }>(sql`
			select id, name, title from org_hierarchy_nodes where id = ${inquiry.filed_by_node_id}
		`)
	]);

	if (!targetMetric || !filedByUser || !filedByNode) {
		throw error(404, t(locals.locale, 'error.inquiry_not_found'));
	}

	const commentsRaw = await many<{
		id: string;
		body: string;
		created_at: string;
		author_id: string;
		author_name: string | null;
	}>(sql`
		select c.id, c.body, c.created_at, c.author_id, u.name as author_name
		from inquiry_comments c
		left join users u on u.id = c.author_id
		where c.inquiry_id = ${params.id}
		order by c.created_at desc
	`);

	const isActive = inquiry.status !== 'resolved' && inquiry.status !== 'dismissed';
	const canResolve =
		isActive && (locals.user?.id === inquiry.authority_id || canResolveAnyInquiry(role));

	return {
		inquiry: {
			id: inquiry.id,
			type: inquiry.inquiry_type,
			status: inquiry.status,
			challengeType: inquiry.challenge_type,
			rationale: inquiry.rationale,
			resolutionSummary: inquiry.resolution_summary,
			resolutionAction: inquiry.resolution_action,
			filedAt: inquiry.filed_at,
			resolvedAt: inquiry.resolved_at
		},
		targetMetric: {
			id: targetMetric.id,
			name: targetMetric.name
		},
		filedBy: {
			id: filedByUser.id,
			name: filedByUser.name
		},
		filedByNode: {
			id: filedByNode.id,
			name: filedByNode.name,
			title: filedByNode.title
		},
		comments: commentsRaw.map((c) => ({
			id: c.id,
			body: c.body,
			createdAt: c.created_at,
			author: {
				id: c.author_id,
				name: c.author_name ?? ''
			}
		})),
		canResolve
	};
};

export const actions = {
	comment: async ({ request, params, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const body = formData.get('body')?.toString().trim();

		if (!body) {
			return fail(400, { error: 'validation.field_required' });
		}

		await sql`
			insert into inquiry_comments (inquiry_id, author_id, body)
			values (${params.id}, ${locals.user.id}, ${body})
		`;

		return { commentSuccess: true };
	},

	resolve: async ({ request, params, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const auth = await authorizeResolution(params.id, locals.user.id);
		if (auth.error) return auth.error;

		const formData = await request.formData();
		const resolutionAction = formData.get('resolutionAction')?.toString() as
			| 'adjusted'
			| 'no_change'
			| 'deferred';
		const resolutionSummary = formData.get('resolutionSummary')?.toString().trim();

		if (!resolutionAction || !resolutionSummary) {
			return fail(400, { error: 'validation.field_required' });
		}

		await sql`
			update inquiries
			set status = 'resolved',
				resolution_action = ${resolutionAction},
				resolution_summary = ${resolutionSummary},
				resolved_at = now(),
				resolved_by = ${locals.user.id},
				updated_at = now()
			where id = ${params.id}
		`;

		return { resolveSuccess: true };
	},

	dismiss: async ({ params, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const auth = await authorizeResolution(params.id, locals.user.id);
		if (auth.error) return auth.error;

		await sql`
			update inquiries
			set status = 'dismissed',
				resolved_at = now(),
				resolved_by = ${locals.user.id},
				updated_at = now()
			where id = ${params.id}
		`;

		redirect(302, '/app/inquiries');
	}
};
;null as any as Actions;