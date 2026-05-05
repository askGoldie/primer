<script lang="ts">
	/**
	 * ResourcesMenu Component
	 *
	 * Primary-nav dropdown that groups every "how do I get Primer running"
	 * resource for a visitor. The first entry is always Deployment (the
	 * original standalone nav link, now living inside this menu). Below
	 * Deployment sit the migration guides — one per existing goal system
	 * a reader might already be running — sorted by popularity of use.
	 *
	 * Editorial stance — mirrors MigrationGuideLayout:
	 *   We do not position Primer as a replacement for any established
	 *   framework. The guides walk a reader through running Primer
	 *   concurrently, combining it with their current system, or
	 *   A/B testing for a cycle. This menu is the entry point to that
	 *   content, so it lists every supported source system by name —
	 *   never with a marketing hook — and lets the reader self-select.
	 *
	 * Interaction pattern mirrors AccessibilityMenu.svelte:
	 *   - click the trigger to open
	 *   - click outside or press Escape to close
	 *   - click a link to navigate (closes naturally on navigation)
	 *
	 * Accessibility: trigger is a <button> with aria-expanded / aria-haspopup,
	 * the panel has role="menu", and each item has role="menuitem".
	 */

	import { href } from '$lib/utils/href.js';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';

	interface Props {
		/** Current locale for i18n labels */
		locale: Locale;
		/** Layout mode — desktop renders an inline dropdown; mobile renders a flat list */
		variant?: 'desktop' | 'mobile';
	}

	let { locale, variant = 'desktop' }: Props = $props();

	let isOpen = $state(false);

	/**
	 * Dropdown entries, sorted by popularity of use:
	 *   1. Deployment      — always first; it is what the original nav tab linked to
	 *   2. OKRs            — the single most-asked-about source system
	 *   3. KPI dashboards  — most common starting point in operationally-run companies
	 *   4. Balanced Scorecard
	 *   5. 4DX (4 Disciplines of Execution)
	 *   6. EOS / Traction
	 *   7. Hoshin Kanri    — enterprise lean
	 *   8. MBO             — ancestor of every other system; still common in traditional enterprises
	 *
	 * Each entry resolves through `href()` so the app-base path is applied
	 * consistently with the rest of the nav.
	 */
	const items = [
		{ href: '/web/deployment', key: 'nav.resources.deployment' },
		{ href: '/web/resources/migration-guides/from-okrs', key: 'nav.resources.okrs' },
		{ href: '/web/resources/migration-guides/from-kpis', key: 'nav.resources.kpis' },
		{
			href: '/web/resources/migration-guides/from-balanced-scorecard',
			key: 'nav.resources.bsc'
		},
		{ href: '/web/resources/migration-guides/from-4dx', key: 'nav.resources.four_dx' },
		{ href: '/web/resources/migration-guides/from-eos', key: 'nav.resources.eos' },
		{ href: '/web/resources/migration-guides/from-hoshin-kanri', key: 'nav.resources.hoshin' },
		{ href: '/web/resources/migration-guides/from-mbo', key: 'nav.resources.mbo' }
	];

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}
</script>

{#if variant === 'mobile'}
	<!--
		Mobile rendering: no dropdown — a section heading followed by every
		link in the menu, flattened. Matches the way the existing mobile
		menu lays out the primary nav links.
	-->
	<div class="pt-1">
		<p
			class="px-3 pb-1 text-xs font-semibold tracking-wide text-secondary/70 uppercase"
			id="resources-mobile-heading"
		>
			{t(locale, 'nav.resources')}
		</p>
		<ul class="space-y-1" aria-labelledby="resources-mobile-heading">
			{#each items as item (item.href)}
				<li>
					<a
						href={href(item.href)}
						class="block rounded-md px-5 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
					>
						{t(locale, item.key)}
					</a>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<!--
		Desktop rendering: button that toggles an anchored dropdown panel.
		Panel closes on outside click or Escape (handled via svelte:window
		at the bottom of this file).
	-->
	<div class="relative">
		<button
			type="button"
			class="flex items-center gap-1 text-sm text-secondary hover:text-primary"
			onclick={toggle}
			aria-expanded={isOpen}
			aria-haspopup="menu"
		>
			{t(locale, 'nav.resources')}
			<svg
				class="h-3 w-3 transition-transform {isOpen ? 'rotate-180' : ''}"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>

		{#if isOpen}
			<div
				class="absolute top-full left-0 z-50 mt-2 w-64 rounded-md border border-border bg-surfaceMid py-2 shadow-lg rtl:right-0 rtl:left-auto"
				role="menu"
				aria-label={t(locale, 'nav.resources')}
			>
				{#each items as item, index (item.href)}
					<a
						href={href(item.href)}
						class="block px-4 py-2 text-sm text-secondary hover:bg-surfaceLight hover:text-primary"
						role="menuitem"
						onclick={close}
					>
						{t(locale, item.key)}
					</a>
					<!--
						Separator between Deployment (index 0) and the migration guides:
						Deployment is a different kind of resource — it is how you stand
						Primer up; the guides are how you adopt it alongside what you
						already run — so the visual break helps readers scan.
					-->
					{#if index === 0}
						<div class="my-1 border-t border-border" role="none"></div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!--
	Close the desktop dropdown on outside click or Escape. `svelte:window`
	must live at the template root, so it is declared unconditionally and
	gated on `isOpen` inside the handler. In mobile mode `isOpen` is never
	set, so these handlers become no-ops.
-->
<svelte:window
	onclick={(e) => {
		if (isOpen && !(e.target as HTMLElement).closest('.relative')) {
			isOpen = false;
		}
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') isOpen = false;
	}}
/>
