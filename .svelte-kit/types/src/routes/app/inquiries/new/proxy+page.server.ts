// @ts-nocheck
/**
 * New Inquiry Page Server
 *
 * Handles filing of new self-inquiries and peer inquiries.
 */

import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types.js";
import { sql, maybeOne, many } from "$lib/server/db.js";

interface MetricRow {
  id: string;
  name: string;
  weight: number | null;
  current_tier: string | null;
  node_id: string | null;
  assigned_by: string | null;
}

interface NodeRow {
  id: string;
  name: string;
  title: string | null;
  parent_id: string | null;
  user_id: string | null;
  organization_id: string;
}

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
  const { userNode } = await parent();

  if (!userNode) {
    redirect(302, "/app/inquiries");
  }

  const fullUserNode = await maybeOne<NodeRow>(sql`
		select * from org_hierarchy_nodes where id = ${userNode.id}
	`);

  const ownMetrics = await many<MetricRow>(sql`
		select id, name, weight, current_tier, node_id, assigned_by
		from metrics where node_id = ${userNode.id}
	`);

  const peerMetrics: {
    metric: {
      id: string;
      name: string;
      weight: number | null;
      current_tier: string | null;
    };
    node: { id: string; name: string };
  }[] = [];

  if (fullUserNode?.parent_id) {
    const siblings = await many<NodeRow>(sql`
			select * from org_hierarchy_nodes
			where parent_id = ${fullUserNode.parent_id} and id <> ${userNode.id}
		`);

    if (siblings.length > 0) {
      const siblingById = new Map(siblings.map((s) => [s.id, s]));
      const siblingIds = siblings.map((s) => s.id);
      const siblingMetrics = await many<MetricRow>(sql`
				select id, name, weight, current_tier, node_id, assigned_by
				from metrics where node_id = any(${siblingIds}::uuid[])
			`);

      for (const metric of siblingMetrics) {
        if (!metric.node_id) continue;
        const node = siblingById.get(metric.node_id);
        if (node) peerMetrics.push({ metric, node });
      }
    }
  }

  return {
    ownMetrics: ownMetrics.map((m) => ({
      id: m.id,
      name: m.name,
      weight: m.weight,
      currentTier: m.current_tier,
    })),
    peerMetrics: peerMetrics.map(({ metric, node }) => ({
      id: metric.id,
      name: metric.name,
      weight: metric.weight,
      currentTier: metric.current_tier,
      nodeName: node.name,
      nodeId: node.id,
    })),
  };
};

export const actions = {
  default: async ({ request, locals }: import('./$types').RequestEvent) => {
    if (!locals.user) {
      return fail(403, { error: "error.generic" });
    }

    const membership = await maybeOne<{ organization_id: string }>(sql`
			select organization_id from org_members
			where user_id = ${locals.user.id} and removed_at is null
			limit 1
		`);

    if (!membership) {
      return fail(403, { error: "error.generic" });
    }

    const userNode = await maybeOne<NodeRow>(sql`
			select * from org_hierarchy_nodes
			where organization_id = ${membership.organization_id}
				and user_id = ${locals.user.id}
			limit 1
		`);

    if (!userNode) {
      return fail(403, { error: "error.generic" });
    }

    const formData = await request.formData();
    const inquiryType = formData.get("inquiryType")?.toString() as
      | "self"
      | "peer";
    const targetMetricId = formData.get("targetMetricId")?.toString();
    const affectedMetricId = formData.get("affectedMetricId")?.toString();
    const challengeType = formData.get("challengeType")?.toString() as
      | "threshold"
      | "weight"
      | "definition"
      | "measurement";
    const rationale = formData.get("rationale")?.toString().trim();

    if (!targetMetricId || !challengeType || !rationale) {
      return fail(400, { error: "validation.field_required" });
    }

    const targetMetric = await maybeOne<MetricRow>(sql`
			select id, name, weight, current_tier, node_id, assigned_by
			from metrics where id = ${targetMetricId}
		`);

    if (!targetMetric) {
      return fail(400, { error: "error.generic" });
    }

    const targetNode = await maybeOne<NodeRow>(sql`
			select * from org_hierarchy_nodes where id = ${targetMetric.node_id}
		`);

    if (!targetNode) {
      return fail(400, { error: "error.generic" });
    }

    let authorityId = targetNode.user_id;
    let authorityNodeId = targetNode.id;

    if (targetNode.parent_id) {
      const parentNode = await maybeOne<NodeRow>(sql`
				select * from org_hierarchy_nodes where id = ${targetNode.parent_id}
			`);

      if (parentNode?.user_id) {
        authorityId = parentNode.user_id;
        authorityNodeId = parentNode.id;
      }
    }

    if (!authorityId) {
      authorityId = targetMetric.assigned_by;
    }

    const inquiry = await maybeOne<{ id: string }>(sql`
			insert into inquiries (
				organization_id, inquiry_type, filed_by, filed_by_node_id,
				target_metric_id, affected_metric_id, authority_id, authority_node_id,
				challenge_type, rationale
			)
			values (
				${membership.organization_id},
				${inquiryType},
				${locals.user.id},
				${userNode.id},
				${targetMetricId},
				${affectedMetricId || targetMetricId},
				${authorityId},
				${authorityNodeId},
				${challengeType},
				${rationale}
			)
			returning id
		`);

    if (!inquiry) {
      return fail(500, { error: "error.generic" });
    }

    redirect(302, `/app/inquiries/${inquiry.id}`);
  },
};
;null as any as Actions;