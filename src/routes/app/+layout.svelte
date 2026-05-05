<script lang="ts">
	/**
	 * App Layout
	 *
	 * Main application shell with sidebar navigation.
	 * On the platform (demo site), shows the current perspective
	 * and a "Switch Role" link. On customer deployments, shows
	 * the user's own identity.
	 */

	import { resolve } from '$app/paths';
	import { href } from '$lib/utils/href.js';
	import type { LayoutData } from './$types.js';
	import type { Snippet } from 'svelte';
	import { page, navigating } from '$app/stores';
	import { t } from '$lib/i18n/index.js';
	import { fade } from 'svelte/transition';
	import LanguageSwitcher from '$lib/components/layout/LanguageSwitcher.svelte';
	import AccessibilityMenu from '$lib/components/layout/AccessibilityMenu.svelte';
	// ── ONBOARDING NAV (removable) ────────────────────────────────────────
	// Imported here so the first-visit spotlight can mount alongside the
	// nav link. Remove this import when removing the onboarding tab — see
	// src/lib/components/onboarding/paths.ts for the full checklist.
	import OnboardingSpotlight from '$lib/components/onboarding/OnboardingSpotlight.svelte';
	// ──────────────────────────────────────────────────────────────────────

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	/** Whether the mobile sidebar is open */
	let sidebarOpen = $state(false);

	/** Hide settings icon when the user has no settings tabs */
	const hasSettingsAccess = $derived(data.isSystemAdmin || data.isHrAdmin);

	/**
	 * Navigation items with expanded role awareness:
	 *
	 * - Dashboard: always
	 * - My Team: only if user has direct reports
	 * - My Goals: if user has a node and canSelfServe (participant+)
	 * - Peers: only if user has siblings
	 * - Inquiries: always (filtered by role server-side)
	 * - Reports: always
	 * - Admin: system_admin, owner, OR hr_admin (HR gets scoped view)
	 *
	 * Settings is in the user section at the bottom of the sidebar,
	 * alongside language, accessibility, and logout controls.
	 */
	const navItems = $derived([
		{ href: '/app', label: 'nav.dashboard', icon: 'dashboard' },
		...(data.hasDirectReports
			? [{ href: '/app/leaders', label: 'nav.my_team', icon: 'leaders' }]
			: []),
		...(data.userNode && data.membership.role !== 'viewer'
			? [{ href: '/app/goals', label: 'nav.goals', icon: 'goals' }]
			: []),
		...(data.hasPeers ? [{ href: '/app/peers', label: 'nav.peers', icon: 'peers' }] : []),
		{ href: '/app/inquiries', label: 'nav.inquiries', icon: 'inquiries' },
		{ href: '/app/reports', label: 'nav.reports', icon: 'reports' }
	]);

	// ── ONBOARDING NAV (removable) ────────────────────────────────────────
	// Separate nav item pinned to the bottom of the sidebar, visible only
	// to the CEO (owner role) and system admins. Rendered below a divider,
	// not inside `navItems`, so the divider collapses cleanly when the
	// viewer doesn't have access.
	//
	// TO REMOVE: delete this block, the `{#if showOnboardingNav}` section
	// in the sidebar template below, and follow the rest of the checklist
	// in src/lib/components/onboarding/paths.ts.
	const showOnboardingNav = $derived(data.isSystemAdmin);
	// ──────────────────────────────────────────────────────────────────────

	/**
	 * Check if a nav item is active
	 */
	function isActive(href: string): boolean {
		if (href === '/app') {
			return $page.url.pathname === '/app';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-screen bg-surface">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 z-30 bg-black/40 lg:hidden"
			role="presentation"
			onclick={() => (sidebarOpen = false)}
		></div>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed top-0 left-0 z-40 h-screen w-64 border-r border-border bg-surfaceMid pt-16 transition-transform duration-200 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'} lg:translate-x-0"
	>
		<!-- Logo -->
		<div class="flex h-14 items-center border-b border-border px-6">
			<a href={href('/app')} class="flex items-center gap-3">
				<img src="/demo-logo.webp" alt={data.organization.name} class="h-8" />
				<span class="font-medium text-primary">{data.organization.name}</span>
			</a>
		</div>

		<!-- Navigation -->
		<nav class="mt-6 px-4">
			<ul class="space-y-1">
				{#each navItems as item (item.href)}
					<li>
						<a
							href={href(item.href)}
							onclick={() => (sidebarOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
								item.href
							)
								? 'bg-accent1/10 text-accent1'
								: 'text-secondary hover:bg-surfaceHigh hover:text-primary'}"
						>
							<!-- Icon based on type -->
							{#if item.icon === 'dashboard'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
									/>
								</svg>
							{:else if item.icon === 'goals'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{:else if item.icon === 'performance'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							{:else if item.icon === 'reports'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
									/>
								</svg>
							{:else if item.icon === 'leaders'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							{:else if item.icon === 'peers'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
							{:else if item.icon === 'admin'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
									/>
								</svg>
							{:else if item.icon === 'inquiries'}
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{/if}
							{t(data.locale, item.label)}
						</a>
					</li>
				{/each}

				<!-- ── ONBOARDING NAV (removable) ───────────────────────────── -->
				<!--
					Divider + onboarding link. Pinned to the bottom of the main
					nav list (above the platform "Switch role" control) so CEOs
					and system admins can always find it. To remove: delete this
					entire block and see the checklist in
					src/lib/components/onboarding/paths.ts.
				-->
				{#if showOnboardingNav}
					<li class="pt-2">
						<div class="mb-2 border-t border-border" role="presentation"></div>
						<a
							id="onboarding-nav-link"
							href={href('/app/onboarding')}
							onclick={() => (sidebarOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
								'/app/onboarding'
							)
								? 'bg-accent1/10 text-accent1'
								: 'text-secondary hover:bg-surfaceHigh hover:text-primary'}"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
								/>
							</svg>
							{t(data.locale, 'onboarding.nav_label')}
						</a>
					</li>
				{/if}
				<!-- ── /ONBOARDING NAV ──────────────────────────────────────── -->
			</ul>
		</nav>

		<!-- Switch role link (platform mode) -->
		{#if data.isPlatform}
			<div class="mt-4 border-t border-border px-4 pt-4">
				<p class="px-3 text-xs text-secondary">
					{t(data.locale, 'platform.banner_viewing_as', {
						name: data.userNode?.name ?? ''
					})}
				</p>
				<a
					href={href('/platform')}
					class="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surfaceHigh hover:text-primary"
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
							d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
						/>
					</svg>
					{t(data.locale, 'platform.switch_role')}
				</a>
			</div>
		{/if}

		<!-- User section at bottom -->
		<div class="absolute right-0 bottom-0 left-0 border-t border-border p-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-accent1/10 text-sm font-medium text-accent1"
				>
					{(data.userNode?.name ?? data.user.name).charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium text-primary">
						{data.userNode?.name ?? data.user.name}
					</div>
					<div class="truncate text-xs text-secondary">
						{data.userNode?.title || data.membership.role}
					</div>
				</div>
			</div>
			<!-- Preferences & logout row -->
			<div class="mt-3 flex items-center justify-between">
				<div class="flex items-center gap-1">
					<LanguageSwitcher locale={data.locale} direction="up" />
					<AccessibilityMenu locale={data.locale} direction="up" />
					{#if hasSettingsAccess}
						<a
							href={resolve('/app/settings')}
							class="rounded-md px-3 py-2 text-secondary hover:bg-surfaceMid hover:text-primary"
							title={t(data.locale, 'nav.settings')}
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
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</a>
					{/if}
				</div>
				<a
					href={resolve('/auth/logout')}
					class="rounded-md p-2 text-secondary hover:bg-surfaceHigh hover:text-primary"
					title={t(data.locale, 'nav.signout')}
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
				</a>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<main class="min-w-0 flex-1 lg:ml-64">
		<!-- Mobile top bar -->
		<div class="flex items-center border-b border-border bg-surfaceMid px-4 py-3 lg:hidden">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="rounded-lg p-1.5 text-secondary hover:bg-surfaceHigh hover:text-primary"
				aria-label={t(data.locale, 'nav.open_menu')}
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
			<a href={resolve('/app')} class="ml-3 flex items-center gap-2">
				<img src="/demo-logo.webp" alt={data.organization.name} class="h-6" />
				<span class="text-sm font-medium text-primary">{data.organization.name}</span>
			</a>
		</div>

		{#if data.isPlatform}
			<!-- Platform mode banner -->
			<div
				class="flex items-center border-b border-amber-200 bg-amber-50 px-6 py-2 dark:border-amber-800 dark:bg-amber-950"
			>
				<div class="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
					<svg
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{t(data.locale, 'platform.banner_source_code')}</span>
				</div>
			</div>
		{/if}
		{#if $navigating}
			<div in:fade={{ duration: 150 }} class="flex items-center justify-center py-32">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-accent1/30 border-t-accent1"
					role="status"
					aria-label={t(data.locale, 'app.loading')}
				></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</main>

	<!-- ── ONBOARDING NAV (removable) ──────────────────────────────────── -->
	<!--
		First-visit spotlight that draws attention to the onboarding
		nav link. Gated on the same `showOnboardingNav` flag as the nav
		entry so non-admins never see it, and the component itself
		handles the localStorage "already seen" check. Remove this block
		alongside the other ONBOARDING NAV markers when tearing the
		feature out — see src/lib/components/onboarding/paths.ts for
		the full checklist.
	-->
	{#if showOnboardingNav}
		<OnboardingSpotlight locale={data.locale} targetId="onboarding-nav-link" />
	{/if}
	<!-- ── /ONBOARDING NAV ─────────────────────────────────────────────── -->
</div>
