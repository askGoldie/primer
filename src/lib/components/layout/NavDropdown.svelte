<script lang="ts">
	/**
	 * NavDropdown Component
	 *
	 * Reusable nav dropdown used when a primary nav link has child pages.
	 * The parent link still navigates; the chevron toggles the dropdown.
	 * Desktop renders an anchored panel; mobile renders a flat list.
	 *
	 * Interaction mirrors ResourcesMenu: click outside or Escape to close.
	 */

	import { href } from '$lib/utils/href.js';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';

	interface DropdownItem {
		href: string;
		key: string;
	}

	interface Props {
		/** Current locale for i18n labels */
		locale: Locale;
		/** i18n key for the parent label */
		labelKey: string;
		/** Route for the parent link */
		parentHref: string;
		/** Child dropdown entries */
		items: DropdownItem[];
		/** Layout mode */
		variant?: 'desktop' | 'mobile';
	}

	let { locale, labelKey, parentHref, items, variant = 'desktop' }: Props = $props();

	let isOpen = $state(false);

	function toggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}
</script>

{#if variant === 'mobile'}
	<div>
		<a
			href={href(parentHref)}
			class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
		>
			{t(locale, labelKey)}
		</a>
		{#each items as item (item.href)}
			<a
				href={href(item.href)}
				class="block rounded-md px-5 py-2 text-sm text-secondary hover:bg-surfaceLight hover:text-primary"
			>
				{t(locale, item.key)}
			</a>
		{/each}
	</div>
{:else}
	<div class="relative">
		<span class="flex items-center gap-0.5">
			<a href={href(parentHref)} class="text-sm text-secondary hover:text-primary">
				{t(locale, labelKey)}
			</a>
			<button
				type="button"
				class="flex items-center p-1 text-secondary hover:text-primary"
				onclick={toggle}
				aria-expanded={isOpen}
				aria-haspopup="menu"
				aria-label="{t(locale, labelKey)} submenu"
			>
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
		</span>

		{#if isOpen}
			<div
				class="absolute top-full left-0 z-50 mt-2 w-56 rounded-md border border-border bg-surfaceMid py-2 shadow-lg rtl:right-0 rtl:left-auto"
				role="menu"
				aria-label={t(locale, labelKey)}
			>
				{#each items as item (item.href)}
					<a
						href={href(item.href)}
						class="block px-4 py-2 text-sm text-secondary hover:bg-surfaceLight hover:text-primary"
						role="menuitem"
						onclick={close}
					>
						{t(locale, item.key)}
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/if}

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
