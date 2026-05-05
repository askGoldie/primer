<script lang="ts">
	/**
	 * ResearchDive - Expandable "paper scroll" accordion
	 *
	 * Renders a tab/lip at the bottom of a card that, when clicked,
	 * unrolls a panel of 2-4 supporting research items (articles,
	 * TED talks, stats). Designed to sit at the bottom of any card
	 * container - the parent card provides the main point, and this
	 * component reveals the evidence layer beneath.
	 *
	 * Visual metaphor: a paper scroll tab that pulls down to reveal
	 * more content. Uses Svelte's `slide` transition for the expand.
	 *
	 * @example
	 * <div class="card">
	 *   <h3>Card heading</h3>
	 *   <p>Card body</p>
	 *   <ResearchDive label={t(locale, 'home.research.tab')} items={[...]} />
	 * </div>
	 */

	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	/**
	 * A single research resource backing a card's claim.
	 *
	 * @property type    - 'video' for embeddable talks, 'article' for external links, 'stat' for inline data points
	 * @property title   - display title (already resolved from i18n)
	 * @property url     - destination URL (opens in new tab)
	 * @property subtitle - speaker name, domain, or source attribution
	 * @property description - optional short blurb
	 * @property badge   - optional label like "TED" rendered as a pill
	 */
	export interface ResearchItem {
		type: 'video' | 'article' | 'stat';
		title: string;
		url: string;
		subtitle?: string;
		description?: string;
		badge?: string;
	}

	interface Props {
		/** Accessible label for the toggle button (i18n resolved) */
		label: string;
		/** 2-4 research items to display when expanded */
		items: ResearchItem[];
	}

	let { label, items }: Props = $props();

	/** Whether the research panel is expanded */
	let open = $state(false);
</script>

<!-- ─── Tab / lip - sits at the bottom edge of the parent card ─────────── -->
<div class="-mx-6 mt-5 -mb-6">
	<button
		type="button"
		onclick={() => (open = !open)}
		aria-expanded={open}
		class="group flex w-full items-center justify-center gap-2 border-t border-border
		       bg-surface px-6 py-3
		       text-xs font-medium tracking-wide text-secondary
		       transition-colors hover:text-primary
		       {open ? 'rounded-none' : 'rounded-b-xl'}"
	>
		<!-- Scroll icon -->
		<svg
			class="h-3.5 w-3.5 flex-shrink-0 text-secondary transition-colors group-hover:text-accent1"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
			/>
		</svg>

		<span>{label}</span>

		<!-- Chevron - rotates on open -->
		<svg
			class="h-3 w-3 flex-shrink-0 transition-transform duration-300 {open ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- ─── Expandable panel - the "unrolled scroll" ─────────────────────── -->
	{#if open}
		<div
			transition:slide={{ duration: 350, easing: cubicOut }}
			class="rounded-b-xl border-t border-border bg-surface"
		>
			<div class="divide-y divide-border">
				{#each items as item (item.url)}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group/item flex items-start gap-3 px-6 py-4 transition-colors hover:bg-surfaceMid"
					>
						<!-- Type icon -->
						<span
							class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
							style="background-color: color-mix(in srgb, var(--color-accent1) 10%, transparent);"
						>
							{#if item.type === 'video'}
								<svg
									class="h-3.5 w-3.5"
									fill="currentColor"
									viewBox="0 0 24 24"
									style="color: var(--color-accent1);"
									aria-hidden="true"
								>
									<path d="M8 5v14l11-7z" />
								</svg>
							{:else if item.type === 'stat'}
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="color: var(--color-accent1);"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							{:else}
								<svg
									class="h-3.5 w-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="color: var(--color-accent1);"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
							{/if}
						</span>

						<!-- Content -->
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								{#if item.badge}
									<span
										class="inline-block rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
									>
										{item.badge}
									</span>
								{/if}
								<span
									class="line-clamp-1 text-sm font-medium text-primary group-hover/item:text-accent1"
								>
									{item.title}
								</span>
							</div>
							{#if item.subtitle}
								<p class="mt-0.5 text-xs text-secondary">{item.subtitle}</p>
							{/if}
							{#if item.description}
								<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-secondary">
									{item.description}
								</p>
							{/if}
						</div>

						<!-- External link indicator -->
						<svg
							class="mt-1 h-3 w-3 flex-shrink-0 text-secondary opacity-0 transition-opacity group-hover/item:opacity-100"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
			</div>
		</div>
	{/if}
</div>
