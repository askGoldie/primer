/**
 * Platform Role Picker
 *
 * GET /platform
 *
 * Shows 9 curated demo personas grouped into three tiers:
 *   - Executive (CEO, VP, CFO)
 *   - Management (Director, Manager)
 *   - Specialists (IC, New Hire, HR Director, Chief of Staff)
 *
 * Each persona highlights specific Primer capabilities visitors can
 * explore by logging in as that person. Recommended personas are
 * visually promoted to reduce choice paralysis.
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { platformNodeId, platformUserId } from '$lib/server/demo/constants.js';

/**
 * A curated demo persona shown on the role-picker page.
 *
 * `loginId` is the node or user UUID passed to /login?as={id}.
 * `activitiesKey` is the i18n key prefix for the persona's activity list.
 * `recommended` flags the 3 personas highlighted as starting points.
 * `icon` identifies which SVG icon to render on the card.
 */
export interface DemoPersona {
	loginId: string;
	name: string;
	titleKey: string;
	descriptionKey: string;
	activitiesKey: string;
	activityCount: number;
	orgRole: 'owner' | 'editor' | 'viewer';
	level: 'ceo' | 'vp' | 'cfo' | 'director' | 'manager' | 'ic' | 'new_hire' | 'hr' | 'cos';
	tier: 'executive' | 'management' | 'specialist';
	recommended: boolean;
	icon: string;
}

/**
 * The 9 demo personas grouped by tier.
 *
 * Node IDs for tree members use platformNodeId(idx).
 * Users added in seed 07 (no tree node) use their user UUID directly.
 */
const DEMO_PERSONAS: DemoPersona[] = [
	// ── Executive tier ──────────────────────────────────────────────
	{
		loginId: platformNodeId(1),
		name: 'Alex Rivera',
		titleKey: 'platform.persona.ceo.title',
		descriptionKey: 'platform.persona.ceo.desc',
		activitiesKey: 'platform.persona.ceo.activity',
		activityCount: 4,
		orgRole: 'owner',
		level: 'ceo',
		tier: 'executive',
		recommended: true,
		icon: 'crown'
	},
	{
		loginId: platformNodeId(10),
		name: 'Jordan Lee',
		titleKey: 'platform.persona.vp.title',
		descriptionKey: 'platform.persona.vp.desc',
		activitiesKey: 'platform.persona.vp.activity',
		activityCount: 4,
		orgRole: 'editor',
		level: 'vp',
		tier: 'executive',
		recommended: false,
		icon: 'building'
	},
	{
		loginId: platformNodeId(30),
		name: 'Morgan Kim',
		titleKey: 'platform.persona.cfo.title',
		descriptionKey: 'platform.persona.cfo.desc',
		activitiesKey: 'platform.persona.cfo.activity',
		activityCount: 4,
		orgRole: 'editor',
		level: 'cfo',
		tier: 'executive',
		recommended: false,
		icon: 'chart'
	},

	// ── Management tier ─────────────────────────────────────────────
	{
		loginId: platformNodeId(21),
		name: 'Hayden Park',
		titleKey: 'platform.persona.director.title',
		descriptionKey: 'platform.persona.director.desc',
		activitiesKey: 'platform.persona.director.activity',
		activityCount: 4,
		orgRole: 'editor',
		level: 'director',
		tier: 'management',
		recommended: true,
		icon: 'layers'
	},
	{
		loginId: platformNodeId(211),
		name: 'Cameron Vega',
		titleKey: 'platform.persona.manager.title',
		descriptionKey: 'platform.persona.manager.desc',
		activitiesKey: 'platform.persona.manager.activity',
		activityCount: 4,
		orgRole: 'editor',
		level: 'manager',
		tier: 'management',
		recommended: false,
		icon: 'users'
	},

	// ── Specialist tier ─────────────────────────────────────────────
	{
		loginId: '00000000-0000-4000-b100-000000000214',
		name: 'Derek Solís',
		titleKey: 'platform.persona.ic.title',
		descriptionKey: 'platform.persona.ic.desc',
		activitiesKey: 'platform.persona.ic.activity',
		activityCount: 3,
		orgRole: 'editor',
		level: 'ic',
		tier: 'specialist',
		recommended: true,
		icon: 'code'
	},
	{
		loginId: platformUserId(70),
		name: 'Linda Reyes',
		titleKey: 'platform.persona.hr.title',
		descriptionKey: 'platform.persona.hr.desc',
		activitiesKey: 'platform.persona.hr.activity',
		activityCount: 4,
		orgRole: 'editor',
		level: 'hr',
		tier: 'specialist',
		recommended: false,
		icon: 'shield'
	},
	{
		loginId: platformUserId(80),
		name: 'Carlos Mendez',
		titleKey: 'platform.persona.cos.title',
		descriptionKey: 'platform.persona.cos.desc',
		activitiesKey: 'platform.persona.cos.activity',
		activityCount: 4,
		orgRole: 'owner',
		level: 'cos',
		tier: 'specialist',
		recommended: false,
		icon: 'key'
	}
];

/** Tier definitions for grouping and display order */
const TIERS = ['executive', 'management', 'specialist'] as const;

export type Tier = (typeof TIERS)[number];

export interface PersonaTier {
	id: Tier;
	labelKey: string;
	personas: DemoPersona[];
}

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	// Require a real Supabase login to view the org picker.
	if (!locals.isSupabaseAuthenticated) {
		redirect(302, `/web/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const { locale } = await parent();

	/** Group personas by tier for the template */
	const tiers: PersonaTier[] = TIERS.map((id) => ({
		id,
		labelKey: `platform.tier.${id}`,
		personas: DEMO_PERSONAS.filter((p) => p.tier === id)
	}));

	return {
		locale,
		tiers
	};
};
