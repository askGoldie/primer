<script lang="ts">
	/**
	 * Admin Layout
	 *
	 * Admin dashboard shell with navigation.
	 */

	import { resolve } from '$app/paths';
	import { href } from '$lib/utils/href.js';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	/**
	 * Admin navigation items
	 */
	const navItems = [
		{ href: '/web/admin', label: 'Overview', icon: 'dashboard' },
		{ href: '/web/admin/narrative', label: 'Narrative Events', icon: 'narrative' },
		{ href: '/web/admin/accounts', label: 'Accounts', icon: 'accounts' },
		{ href: '/web/admin/purchases', label: 'Purchases', icon: 'purchases' },
		{ href: '/web/admin/downloads', label: 'Downloads', icon: 'downloads' },
		{ href: '/web/admin/errors', label: 'Errors', icon: 'errors' }
	];

	/**
	 * Check if a nav item is active
	 */
	function isActive(path: string): boolean {
		if (path === '/web/admin') {
			return $page.url.pathname === '/web/admin';
		}
		return $page.url.pathname.startsWith(path);
	}
</script>

<div class="flex min-h-screen bg-surface">
	<!-- Sidebar -->
	<aside class="fixed top-0 left-0 z-40 h-screen w-56 border-r border-border bg-surfaceMid">
		<!-- Logo -->
		<div class="flex h-16 items-center border-b border-border px-4">
			<a href={resolve('/web/admin')} class="flex items-center gap-2">
				<img src="/logo.svg" alt="Tier" class="h-7" />
				<span class="text-xs font-medium tracking-wider text-secondary uppercase">Admin</span>
			</a>
		</div>

		<!-- Navigation -->
		<nav class="mt-4 px-3">
			<ul class="space-y-1">
				{#each navItems as item (item.href)}
					<li>
						<a
							href={href(item.href)}
							class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
								item.href
							)
								? 'bg-accent1/10 text-accent1'
								: 'text-secondary hover:bg-surfaceHigh hover:text-primary'}"
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- Admin info at bottom -->
		<div class="absolute right-0 bottom-0 left-0 border-t border-border p-4">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full bg-accent1/10 text-xs font-medium text-accent1"
				>
					{data.admin.name.charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium text-primary">{data.admin.name}</div>
				</div>
				<a
					href={resolve('/')}
					class="text-secondary hover:text-primary"
					title="Back to site"
					aria-label="Back to site"
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
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
				</a>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<main class="ml-56 flex-1">
		{@render children()}
	</main>
</div>
