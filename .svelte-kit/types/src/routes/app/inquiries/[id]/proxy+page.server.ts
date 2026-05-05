// @ts-nocheck
/**
 * Inquiry Detail Page Server
 *
 * Shows full inquiry details and allows resolution.
 */

import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';
import { canResolveAnyInquiry } from '$lib/server/permissions.js';
import type { OrgRole } from '$lib/types/database.js';
import { t } from '$lib/i18n/index.js';

/**
 * Shared authorization check for resolve/dismiss actions.
 * Returns an inquiry status payload on success, or a fail() Result on denial.
 */
async function authorizeResolution(inquiryId: string, userId: string) {
	const { data: inquiryCheck } = await db
		.from('inquiries')
		.select('authority_id, status')
		.eq('id', inquiryId)
		.single();

	if (!inquiryCheck) return { error: fail(404, { error: 'error.generic' }) };
	if (inquiryCheck.status === 'resolved' || inquiryCheck.status === 'dismissed') {
		return { error: fail(400, { error: 'error.generic' }) };
	}

	const { data: callerMembership } = await db
		.from('org_members')
		.select('role')
		.eq('user_id', userId)
		.is('removed_at', null)
		.single();

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

	// Fetch the inquiry
	const { data: inquiry } = await db.from('inquiries').select('*').eq('id', params.id).single();

	if (!inquiry) {
		throw error(404, t(locals.locale, 'error.inquiry_not_found'));
	}

	// Fetch related data in parallel
	const [targetMetricResult, filedByUserResult, filedByNodeResult] = await Promise.all([
		db.from('metrics').select('id, name').eq('id', inquiry.target_metric_id).single(),
		db.from('users').select('id, name').eq('id', inquiry.filed_by).single(),
		db
			.from('org_hierarchy_nodes')
			.select('id, name, title')
			.eq('id', inquiry.filed_by_node_id)
			.single()
	]);

	const targetMetric = targetMetricResult.data;
	const filedByUser = filedByUserResult.data;
	const filedByNode = filedByNodeResult.data;

	if (!targetMetric || !filedByUser || !filedByNode) {
		throw error(404, t(locals.locale, 'error.inquiry_not_found'));
	}

	// Get comments with author names
	const { data: commentsRaw } = await db
		.from('inquiry_comments')
		.select('*, users!inquiry_comments_author_id_fkey(id, name)')
		.eq('inquiry_id', params.id)
		.order('created_at', { ascending: false });

	// Check if user can resolve: either named authority on this inquiry,
	// or system_admin (org-wide resolution power for CoS/pilot role).
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
			resolvedAt: inquiry.resolved_at || null
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
		comments: (commentsRaw ?? []).map((c) => {
			const author = c.users as { id: string; name: string } | null;
			return {
				id: c.id,
				body: c.body,
				createdAt: c.created_at,
				author: {
					id: author?.id ?? '',
					name: author?.name ?? ''
				}
			};
		}),
		canResolve
	};
};

export const actions = {
	/**
	 * Add a comment
	 */
	comment: async ({ request, params, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const body = formData.get('body')?.toString().trim();

		if (!body) {
			return fail(400, { error: 'validation.field_required' });
		}

		await db.from('inquiry_comments').insert({
			inquiry_id: params.id,
			author_id: locals.user.id,
			body
		});

		return { commentSuccess: true };
	},

	/**
	 * Resolve the inquiry.
	 * Allowed for the named authority on the inquiry or any system_admin.
	 */
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

		await db
			.from('inquiries')
			.update({
				status: 'resolved',
				resolution_action: resolutionAction,
				resolution_summary: resolutionSummary,
				resolved_at: new Date().toISOString(),
				resolved_by: locals.user.id,
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id);

		return { resolveSuccess: true };
	},

	/**
	 * Dismiss the inquiry.
	 * Allowed for the named authority on the inquiry or any system_admin.
	 */
	dismiss: async ({ params, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		const auth = await authorizeResolution(params.id, locals.user.id);
		if (auth.error) return auth.error;

		await db
			.from('inquiries')
			.update({
				status: 'dismissed',
				resolved_at: new Date().toISOString(),
				resolved_by: locals.user.id,
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id);

		redirect(302, '/app/inquiries');
	}
};
;null as any as Actions;