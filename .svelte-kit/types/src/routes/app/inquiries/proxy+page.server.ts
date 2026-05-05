// @ts-nocheck
/**
 * Inquiries Page Server
 *
 * Lists all inquiries - both self-inquiries and peer inquiries.
 * Core mechanism for challenging thresholds and weights.
 */

import type { PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load = async ({ parent, locals }: Parameters<PageServerLoad>[0]) => {
	const { organization, userNode, membership } = await parent();

	// Build the query - owners see all, others see only their own + where they are authority
	let query = db
		.from('inquiries')
		.select(
			'*, metrics!inquiries_target_metric_id_fkey(id, name), filed_by_user:users!inquiries_filed_by_fkey(id, name), filed_by_node:org_hierarchy_nodes!inquiries_filed_by_node_id_fkey(id, name, title)'
		)
		.eq('organization_id', organization.id)
		.order('filed_at', { ascending: false })
		.limit(50);

	if (membership.role !== 'owner' && membership.role !== 'system_admin') {
		query = query.or(`filed_by.eq.${locals.user!.id},authority_id.eq.${locals.user!.id}`);
	}

	const { data: allInquiries } = await query;

	return {
		inquiries: (allInquiries ?? []).map((row) => ({
			id: row.id,
			type: row.inquiry_type,
			status: row.status,
			challengeType: row.challenge_type,
			rationale: row.rationale,
			resolutionSummary: row.resolution_summary,
			resolutionAction: row.resolution_action,
			filedAt: row.filed_at,
			resolvedAt: row.resolved_at || null,
			targetMetric: {
				id: (row.metrics as { id: string; name: string })?.id,
				name: (row.metrics as { id: string; name: string })?.name
			},
			filedBy: {
				id: (row.filed_by_user as { id: string; name: string })?.id,
				name: (row.filed_by_user as { id: string; name: string })?.name
			},
			filedByNode: {
				id: (row.filed_by_node as { id: string; name: string; title: string | null })?.id,
				name: (row.filed_by_node as { id: string; name: string; title: string | null })?.name,
				title: (row.filed_by_node as { id: string; name: string; title: string | null })?.title
			}
		})),
		canFileInquiry: !!userNode
	};
};
