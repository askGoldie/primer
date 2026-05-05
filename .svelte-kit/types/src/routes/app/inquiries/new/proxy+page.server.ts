// @ts-nocheck
/**
 * New Inquiry Page Server
 *
 * Handles filing of new self-inquiries and peer inquiries.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/server/db.js';

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
	const { userNode } = await parent();

	if (!userNode) {
		redirect(302, '/app/inquiries');
	}

	// Fetch the full node record to get parentId (layout only exposes a subset of fields)
	const { data: fullUserNode } = await db
		.from('org_hierarchy_nodes')
		.select('*')
		.eq('id', userNode.id)
		.single();

	// Get user's own metrics (for self-inquiry)
	const { data: ownMetrics } = await db.from('metrics').select('*').eq('node_id', userNode.id);

	// Get metrics from other nodes (for peer inquiry)
	// Only nodes that are connected (siblings or parent)
	const peerMetrics: {
		metric: { id: string; name: string; weight: number | null; current_tier: string | null };
		node: { id: string; name: string };
	}[] = [];

	if (fullUserNode?.parent_id) {
		// Get sibling nodes
		const { data: siblings } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('parent_id', fullUserNode.parent_id)
			.neq('id', userNode.id);

		if (siblings?.length) {
			const siblingById = new Map(siblings.map((s) => [s.id, s]));
			const { data: siblingMetrics } = await db
				.from('metrics')
				.select('*')
				.in(
					'node_id',
					siblings.map((s) => s.id)
				);

			for (const metric of siblingMetrics ?? []) {
				const node = siblingById.get(metric.node_id);
				if (node) peerMetrics.push({ metric, node });
			}
		}
	}

	return {
		ownMetrics: (ownMetrics ?? []).map((m) => ({
			id: m.id,
			name: m.name,
			weight: m.weight,
			currentTier: m.current_tier
		})),
		peerMetrics: peerMetrics.map(({ metric, node }) => ({
			id: metric.id,
			name: metric.name,
			weight: metric.weight,
			currentTier: metric.current_tier,
			nodeName: node.name,
			nodeId: node.id
		}))
	};
};

export const actions = {
	default: async ({ request, locals }: import('./$types').RequestEvent) => {
		if (!locals.user) {
			return fail(403, { error: 'error.generic' });
		}

		// Fetch organization and user node directly (parent() is not available in actions)
		const { data: memberships } = await db
			.from('org_members')
			.select('*, organizations(*)')
			.eq('user_id', locals.user.id)
			.is('removed_at', null)
			.limit(1);

		const membership = memberships?.[0];
		if (!membership?.organizations) {
			return fail(403, { error: 'error.generic' });
		}

		const organization = membership.organizations;

		const { data: userNode } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('organization_id', organization.id)
			.eq('user_id', locals.user.id)
			.single();

		if (!userNode) {
			return fail(403, { error: 'error.generic' });
		}

		const formData = await request.formData();
		const inquiryType = formData.get('inquiryType')?.toString() as 'self' | 'peer';
		const targetMetricId = formData.get('targetMetricId')?.toString();
		const affectedMetricId = formData.get('affectedMetricId')?.toString();
		const challengeType = formData.get('challengeType')?.toString() as
			| 'threshold'
			| 'weight'
			| 'definition'
			| 'measurement';
		const rationale = formData.get('rationale')?.toString().trim();

		if (!targetMetricId || !challengeType || !rationale) {
			return fail(400, { error: 'validation.field_required' });
		}

		// Get target metric to find authority
		const { data: targetMetric } = await db
			.from('metrics')
			.select('*')
			.eq('id', targetMetricId)
			.single();

		if (!targetMetric) {
			return fail(400, { error: 'error.generic' });
		}

		// Get the node that owns the target metric
		const { data: targetNode } = await db
			.from('org_hierarchy_nodes')
			.select('*')
			.eq('id', targetMetric.node_id)
			.single();

		if (!targetNode) {
			return fail(400, { error: 'error.generic' });
		}

		// Authority is the parent of the target node, or the node owner if no parent
		let authorityId = targetNode.user_id;
		let authorityNodeId = targetNode.id;

		if (targetNode.parent_id) {
			const { data: parentNode } = await db
				.from('org_hierarchy_nodes')
				.select('*')
				.eq('id', targetNode.parent_id)
				.single();

			if (parentNode && parentNode.user_id) {
				authorityId = parentNode.user_id;
				authorityNodeId = parentNode.id;
			}
		}

		if (!authorityId) {
			// Fallback to the metric assignedBy
			authorityId = targetMetric.assigned_by;
		}

		// Create the inquiry
		const { data: inquiry, error } = await db
			.from('inquiries')
			.insert({
				organization_id: organization.id,
				inquiry_type: inquiryType,
				filed_by: locals.user.id,
				filed_by_node_id: userNode.id,
				target_metric_id: targetMetricId,
				affected_metric_id: affectedMetricId || targetMetricId,
				authority_id: authorityId,
				authority_node_id: authorityNodeId,
				challenge_type: challengeType,
				rationale
			})
			.select()
			.single();

		if (error || !inquiry) {
			return fail(500, { error: 'error.generic' });
		}

		redirect(302, `/app/inquiries/${inquiry.id}`);
	}
};
;null as any as Actions;