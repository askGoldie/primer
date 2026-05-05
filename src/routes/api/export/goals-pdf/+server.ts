/**
 * Personal Goals PDF Export
 *
 * Generates an HTML document styled for print/PDF conversion.
 * The browser's "Save as PDF" or window.print() renders this
 * as a clean, formatted goal stack document.
 *
 * Customers can customize the layout, branding, and styling
 * by modifying the HTML template below.
 */

import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import type { TierLevel } from '$lib/types/index.js';

const TIER_LEVELS: TierLevel[] = ['alarm', 'concern', 'content', 'effective', 'optimized'];

const TIER_LABELS: Record<TierLevel, string> = {
	alarm: 'Alarm',
	concern: 'Concern',
	content: 'Content',
	effective: 'Effective',
	optimized: 'Optimized'
};

const TIER_COLORS: Record<TierLevel, string> = {
	alarm: '#B03A2E',
	concern: '#7A4A00',
	content: '#6B6058',
	effective: '#2C6EA6',
	optimized: '#2A7A45'
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401);

	const { data: membership } = await db
		.from('org_members')
		.select('organization_id, organizations(name)')
		.eq('user_id', locals.user.id)
		.is('removed_at', null)
		.single();

	if (!membership) error(403);

	const org = membership.organizations as { name: string } | null;

	const { data: userNode } = await db
		.from('org_hierarchy_nodes')
		.select('id, name, title')
		.eq('user_id', locals.user.id)
		.eq('organization_id', membership.organization_id)
		.single();

	if (!userNode) error(400);

	// Load metrics with thresholds
	const { data: metrics } = await db
		.from('metrics')
		.select('*')
		.eq('node_id', userNode.id)
		.order('sort_order', { ascending: true });

	const metricsWithThresholds = await Promise.all(
		(metrics ?? []).map(async (m) => {
			const { data: thresholds } = await db
				.from('metric_thresholds')
				.select('*')
				.eq('metric_id', m.id);

			return {
				name: m.name,
				description: m.description,
				weight: m.weight,
				currentTier: m.current_tier as TierLevel | null,
				origin: m.origin,
				indicatorType: m.indicator_type,
				submittedAt: m.submitted_at,
				approvedAt: m.approved_at,
				thresholds: TIER_LEVELS.map((tier) => {
					const t = (thresholds ?? []).find((th) => th.tier === tier);
					return { tier, description: t?.description || '' };
				})
			};
		})
	);

	// Load goals
	const { data: goals } = await db
		.from('org_goals')
		.select('*')
		.eq('hierarchy_node_id', userNode.id)
		.order('created_at', { ascending: true });

	// Build HTML
	const date = new Date().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const esc = (s: string | null | undefined) =>
		(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	let metricsHtml = '';
	for (const m of metricsWithThresholds) {
		const tierBadge = m.currentTier
			? `<span style="color:${TIER_COLORS[m.currentTier]};font-weight:600">${TIER_LABELS[m.currentTier]}</span>`
			: '<span style="color:#999">Not assessed</span>';

		const status = m.approvedAt
			? '&#10003;&#10003; Aligned'
			: m.submittedAt
				? '&#10003; Submitted'
				: 'Draft';

		let thresholdsHtml = '';
		const hasThresholds = m.thresholds.some((t) => t.description);
		if (hasThresholds) {
			thresholdsHtml = '<table class="thresholds"><tr>';
			for (const t of m.thresholds) {
				thresholdsHtml += `<th style="color:${TIER_COLORS[t.tier]}">${TIER_LABELS[t.tier]}</th>`;
			}
			thresholdsHtml += '</tr><tr>';
			for (const t of m.thresholds) {
				thresholdsHtml += `<td>${esc(t.description) || '—'}</td>`;
			}
			thresholdsHtml += '</tr></table>';
		}

		metricsHtml += `
			<div class="metric">
				<div class="metric-header">
					<div>
						<strong>${esc(m.name)}</strong>
						${m.weight ? `<span class="weight">${m.weight}%</span>` : ''}
						<span class="badge">${esc(m.indicatorType)}</span>
					</div>
					<div>${tierBadge} &middot; ${status}</div>
				</div>
				${m.description ? `<p class="desc">${esc(m.description)}</p>` : ''}
				${thresholdsHtml}
			</div>`;
	}

	const GOAL_TYPE_LABELS: Record<string, string> = {
		strategic: 'Strategic',
		operational: 'Operational',
		developmental: 'Developmental',
		compliance: 'Compliance'
	};

	let goalsHtml = '';
	for (const g of goals ?? []) {
		const goalType = g.goal_type
			? `<span class="badge">${esc(GOAL_TYPE_LABELS[g.goal_type] ?? g.goal_type)}</span>`
			: '';
		const targetTier = g.target_tier
			? `<span style="color:${TIER_COLORS[g.target_tier as TierLevel]};font-size:9pt">Target: ${TIER_LABELS[g.target_tier as TierLevel]}</span>`
			: '';
		const actualTier = g.actual_tier
			? `<span style="color:${TIER_COLORS[g.actual_tier as TierLevel]};font-size:9pt">Actual: ${TIER_LABELS[g.actual_tier as TierLevel]}</span>`
			: '';
		const dueDate = g.due_date
			? `<span class="desc">Due: ${new Date(g.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>`
			: '';

		goalsHtml += `
			<div class="goal">
				<div class="goal-header">
					<span class="priority priority-${g.priority}"></span>
					<strong>${esc(g.title)}</strong>
					${goalType}
					<span class="badge">${esc(g.status)}</span>
				</div>
				${g.description ? `<p class="desc">${esc(g.description)}</p>` : ''}
				${targetTier || actualTier || dueDate ? `<div style="margin-top:4pt;display:flex;gap:12pt">${targetTier}${actualTier}${dueDate}</div>` : ''}
			</div>`;
	}

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Goal Stack — ${esc(userNode.name)}</title>
<style>
/* Customers: modify this stylesheet to match your brand */
@page { margin: 1in 0.75in; size: letter; }
body { font-family: 'Inter', system-ui, sans-serif; color: #22201C; font-size: 11pt; line-height: 1.5; max-width: 7.5in; margin: 0 auto; }
h1 { font-size: 18pt; margin: 0 0 4pt; }
h2 { font-size: 13pt; margin: 24pt 0 8pt; border-bottom: 1px solid #C8BFB0; padding-bottom: 4pt; }
.subtitle { color: #5C5044; font-size: 10pt; margin: 0 0 2pt; }
.date { color: #5C5044; font-size: 9pt; }
.metric { border: 1px solid #E5E0D8; border-radius: 6px; padding: 10pt; margin-bottom: 8pt; }
.metric-header { display: flex; justify-content: space-between; align-items: center; }
.weight { color: #5C5044; font-size: 9pt; margin-left: 6pt; }
.badge { display: inline-block; background: #F2EDE4; color: #5C5044; font-size: 8pt; padding: 1pt 6pt; border-radius: 10pt; margin-left: 4pt; text-transform: capitalize; }
.desc { color: #5C5044; font-size: 9pt; margin: 4pt 0 0; }
.thresholds { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 8pt; }
.thresholds th { text-align: left; padding: 3pt 6pt; font-size: 8pt; font-weight: 600; }
.thresholds td { padding: 3pt 6pt; color: #5C5044; border-top: 1px solid #E5E0D8; vertical-align: top; }
.goal { border: 1px solid #E5E0D8; border-radius: 6px; padding: 10pt; margin-bottom: 8pt; }
.goal-header { display: flex; align-items: center; gap: 6pt; }
.priority { display: inline-block; width: 8pt; height: 8pt; border-radius: 50%; }
.priority-high { background: #B03A2E; }
.priority-medium { background: #D4A842; }
.priority-low { background: #999; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<h1>${esc(userNode.name)}</h1>
${userNode.title ? `<p class="subtitle">${esc(userNode.title)}</p>` : ''}
<p class="subtitle">${esc(org?.name)}</p>
<p class="date">${date}</p>

<h2>Metric Stack (${metricsWithThresholds.length} metrics)</h2>
${metricsHtml || '<p class="desc">No metrics defined.</p>'}

${(goals ?? []).length > 0 ? `<h2>Goals (${goals!.length})</h2>${goalsHtml}` : ''}

</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8'
		}
	});
};
