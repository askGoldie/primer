<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * My Team Page
	 *
	 * Shows the current user's direct reports and the full subtree below them.
	 * Peers have been moved to /app/peers.
	 *
	 * Tree view: collapsible nodes with explicit navigation buttons.
	 * List view: flat table with depth-indented names.
	 */
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fade, slide } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

	let viewMode = $state<'tree' | 'list'>('tree');

	/**
	 * Tracks which node IDs are collapsed in the tree.
	 * Top-level cards start collapsed by default.
	 */
	// svelte-ignore state_referenced_locally
	const collapsedNodes = new SvelteSet<string>(data.subtree.map((n) => n.id));

	function toggleCollapse(id: string) {
		if (collapsedNodes.has(id)) {
			collapsedNodes.delete(id);
		} else {
			collapsedNodes.add(id);
		}
	}

	/**
	 * Get node type icon SVG path
	 */
	function getNodeIcon(nodeType: string): string {
		switch (nodeType) {
			case 'executive_leader':
				return 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z';
			case 'department':
				return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
			case 'team':
				return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
			case 'individual':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			default:
				return 'M4 6h16M4 10h16M4 14h16M4 18h16';
		}
	}
</script>

<svelte:head>
	<title>{t(data.locale, 'nav.my_team')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-medium text-primary">
			{t(data.locale, 'nav.my_team')}
		</h1>
		<p class="mt-1 text-secondary">
			{t(data.locale, 'team.subtitle')}
		</p>
	</div>

	<!-- ── Subtree: Direct Reports & Below ─────────────────────────────────── -->
	{#if data.hasReports}
		<div class="mb-10">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-medium tracking-wider text-secondary uppercase">
					{t(data.locale, 'team.direct_reports')}
				</h2>

				<!-- View toggle -->
				<div
					class="flex rounded-lg border border-border bg-surface p-1"
					role="group"
					aria-label={t(data.locale, 'nav.my_team')}
				>
					<button
						type="button"
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'tree'
							? 'bg-surfaceMid text-primary'
							: 'text-secondary hover:text-primary'}"
						onclick={() => (viewMode = 'tree')}
						aria-pressed={viewMode === 'tree'}
					>
						{t(data.locale, 'team.view.tree')}
					</button>
					<button
						type="button"
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'list'
							? 'bg-surfaceMid text-primary'
							: 'text-secondary hover:text-primary'}"
						onclick={() => (viewMode = 'list')}
						aria-pressed={viewMode === 'list'}
					>
						{t(data.locale, 'team.view.list')}
					</button>
				</div>
			</div>

			{#if viewMode === 'tree'}
				<!-- Tree view with collapsible nodes -->
				<div class="space-y-2">
					{#snippet renderNode(node: (typeof data.subtree)[0], depth: number)}
						{@const isCollapsed = collapsedNodes.has(node.id)}
						{@const hasChildren = node.children.length > 0}

						<div style="margin-left: {depth * 28}px">
							<!-- Node row -->
							<div
								class="flex items-center gap-2 rounded-lg border border-border bg-surfaceMid p-3 transition-colors hover:border-accent1/40"
							>
								<!-- Collapse toggle (only for nodes with children) -->
								{#if hasChildren}
									<button
										type="button"
										onclick={() => toggleCollapse(node.id)}
										class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-secondary transition-colors hover:bg-surfaceHigh hover:text-primary"
										aria-label={isCollapsed
											? t(data.locale, 'stack.expand')
											: t(data.locale, 'stack.collapse')}
									>
										<svg
											class="h-3.5 w-3.5 transition-transform {isCollapsed ? '-rotate-90' : ''}"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
								{:else}
									<!-- Spacer to keep alignment -->
									<span class="h-6 w-6 flex-shrink-0"></span>
								{/if}

								<!-- Node type icon -->
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent1/10"
								>
									<svg
										class="h-4 w-4 text-accent1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d={getNodeIcon(node.nodeType)}
										/>
									</svg>
								</div>

								<!-- Node info -->
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="font-medium text-primary">{node.name}</span>
										<span class="text-xs text-secondary capitalize">
											({t(data.locale, `hierarchy.type.${node.nodeType}`)})
										</span>
									</div>
									{#if node.title}
										<div class="text-sm text-secondary">{node.title}</div>
									{/if}
								</div>

								<!-- Score -->
								{#if node.compositeTier}
									<TierIndicator tier={node.compositeTier} locale={data.locale} size="sm" />
								{/if}

								<!-- Navigate to goals button -->
								<a
									href={href(`/app/leaders/${node.id}`)}
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-secondary transition-colors hover:border-accent1/50 hover:bg-surfaceHigh hover:text-accent1"
									title={t(data.locale, 'leaders.view_stack')}
									aria-label={t(data.locale, 'leaders.view_stack_for', { name: node.name })}
								>
									<svg
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</a>
							</div>

							<!-- Children (hidden when collapsed) -->
							{#if hasChildren && !isCollapsed}
								<div class="mt-2 space-y-2" transition:slide={{ duration: 200 }}>
									{#each node.children as child (child.id)}
										{@render renderNode(child, depth + 1)}
									{/each}
								</div>
							{/if}
						</div>
					{/snippet}

					{#each data.subtree as node (node.id)}
						{@render renderNode(node, 0)}
					{/each}
				</div>
			{:else}
				<!-- List view -->
				<div class="rounded-lg border border-border bg-surfaceMid">
					<table class="w-full">
						<thead>
							<tr class="border-b border-border text-left text-sm font-medium text-secondary">
								<th scope="col" class="p-4">{t(data.locale, 'team.col.name')}</th>
								<th scope="col" class="p-4">{t(data.locale, 'team.col.type')}</th>
								<th scope="col" class="p-4">{t(data.locale, 'team.col.title')}</th>
								<th scope="col" class="p-4">{t(data.locale, 'team.col.assigned_to')}</th>
								<th scope="col" class="p-4 text-right">{t(data.locale, 'team.col.status')}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.flatList as node (node.id)}
								<tr class="hover:bg-surfaceHigh">
									<td class="p-4">
										<a
											href={href(`/app/leaders/${node.id}`)}
											class="font-medium text-primary hover:text-accent1"
										>
											<span style="padding-left: {node.depth * 24}px">
												{#if node.depth > 0}
													<span class="text-secondary">└</span>
												{/if}
												{node.name}
											</span>
										</a>
									</td>
									<td class="p-4 text-sm text-secondary capitalize">
										{t(data.locale, `hierarchy.type.${node.nodeType}`)}
									</td>
									<td class="p-4 text-sm text-secondary">
										{node.title || '-'}
									</td>
									<td class="p-4 text-sm text-secondary">
										{node.userName || '-'}
									</td>
									<td class="p-4 text-right">
										{#if node.compositeTier}
											<TierIndicator tier={node.compositeTier} locale={data.locale} size="sm" />
										{:else}
											<a
												href={href(`/app/leaders/${node.id}`)}
												class="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-secondary transition-colors hover:border-accent1/50 hover:text-accent1"
											>
												{t(data.locale, 'leaders.view_stack')}
												<svg
													class="h-3 w-3"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</a>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{:else}
		<!-- No direct reports -->
		<div
			class="mb-10 rounded-lg border border-dashed border-border bg-surface p-8 text-center"
			in:fade={{ duration: 300 }}
		>
			<svg
				class="mx-auto h-12 w-12 text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="mt-4 text-secondary">{t(data.locale, 'team.no_reports')}</p>
			<p class="mt-1 text-sm text-secondary">{t(data.locale, 'team.no_reports_description')}</p>
		</div>
	{/if}
</div>
