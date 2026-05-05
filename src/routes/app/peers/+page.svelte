<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Peers Page
	 *
	 * Shows all nodes at the same level as the current user under the same
	 * parent authority. Each card navigates to the peer's detail page where
	 * visibility is gated by the parent's peer_visibility setting.
	 */
	import type { PageData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import { fade } from 'svelte/transition';

	let { data }: { data: PageData } = $props();

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
	<title>{t(data.locale, 'nav.peers')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-2">
			<h1 class="text-2xl font-medium text-primary">
				{t(data.locale, 'nav.peers')}
			</h1>
			<HelpTooltip text={t(data.locale, 'tooltip.peers.overview')} />
		</div>
		<p class="mt-1 text-secondary">
			{t(data.locale, 'team.peers_subtitle')}
		</p>
	</div>

	<!-- Peer visibility info -->
	{#if data.peers.length > 0 && data.peerVisibilityLevel}
		<div
			class="mb-4 rounded-lg bg-surfaceMid px-4 py-3 text-xs text-secondary"
			transition:fade={{ duration: 200 }}
		>
			{t(data.locale, 'peers.visibility_level_info', { level: data.peerVisibilityLevel })}
		</div>
	{/if}

	{#if data.peers.length === 0}
		<div
			class="rounded-lg border border-dashed border-border bg-surface p-8 text-center"
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
					d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
			<p class="mt-4 text-secondary">{t(data.locale, 'team.no_peers')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.peers as peer (peer.id)}
				<a
					href={href(`/app/leaders/${peer.id}`)}
					class="group flex items-center gap-4 rounded-xl border border-border bg-surfaceMid p-5 transition-colors hover:border-accent2/50 hover:bg-surfaceHigh"
				>
					<!-- Icon -->
					<div
						class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent2/10"
					>
						<svg
							class="h-5 w-5 text-accent2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={getNodeIcon(peer.nodeType)}
							/>
						</svg>
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<span class="block truncate font-medium text-primary">{peer.name}</span>
						{#if peer.title}
							<span class="block truncate text-sm text-secondary">{peer.title}</span>
						{/if}
					</div>

					<!-- Navigation indicator -->
					<div class="flex flex-shrink-0 items-center gap-2">
						<svg
							class="h-4 w-4 text-secondary transition-colors group-hover:text-accent2"
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
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
