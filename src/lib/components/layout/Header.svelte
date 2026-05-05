<script lang="ts">
	/**
	 * Header Component
	 *
	 * Primary site navigation: The Problem, How It Works, Pricing, Security,
	 * Demo, and authentication actions (Sign In / Get Primer).
	 *
	 * Auth state is driven by `session` (the Supabase session), NOT by `user`.
	 * The `user` field in PageData is also populated by the primer_perspective
	 * cookie (demo personas), so it cannot distinguish Supabase-authenticated
	 * users from demo visitors. `session` is only non-null when the Supabase
	 * JWT has been validated server-side via safeGetSession().
	 */

	import { resolve } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { href } from '$lib/utils/href.js';
	import type { Session } from '@supabase/supabase-js';
	import type { Locale } from '$lib/types/index.js';
	import { t } from '$lib/i18n/index.js';
	import { theme } from '$lib/config/theme.js';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import AccessibilityMenu from './AccessibilityMenu.svelte';
	import ResourcesMenu from './ResourcesMenu.svelte';
	import NavDropdown from './NavDropdown.svelte';

	interface Props {
		/** Current locale */
		locale: Locale;
		/** Supabase session — non-null only when the user is Supabase-authenticated */
		session?: Session | null;
	}

	let { locale, session = null }: Props = $props();

	let isMobileMenuOpen = $state(false);

	// Close the mobile menu whenever the user navigates to a new page.
	// Without this, tapping a link inside the open panel (e.g. a Resources
	// entry) routes to the page but leaves the menu covering the content.
	afterNavigate(() => {
		isMobileMenuOpen = false;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isMobileMenuOpen = false;
		}
	}

	/**
	 * Primary nav links — the conversion funnel.
	 *
	 * Note: the former standalone "Deployment" tab has been folded into the
	 * new <ResourcesMenu /> dropdown (rendered separately below). Deployment
	 * is still the first item inside that dropdown; it just no longer lives
	 * in the flat nav array.
	 */
	/**
	 * Nav items with optional dropdown children. Items with `children`
	 * render as a NavDropdown; items without render as a flat link.
	 */
	interface NavItem {
		href: string;
		key: string;
		children?: { href: string; key: string }[];
	}

	const navLinksBeforeResources: NavItem[] = [
		{ href: '/web/problem', key: 'nav.problem' },
		{ href: '/web/how-it-works', key: 'nav.how_it_works' },
		{
			href: '/web/pricing',
			key: 'nav.pricing',
			children: [{ href: '/web/pricing/calculator', key: 'nav.pricing.calculator' }]
		},
		{ href: '/web/security', key: 'nav.security' },
		// "For Partners" was previously split across a thin entry under
		// The Problem (`/web/problem/personas`) and a separate landing page
		// (`/web/for-consultants`). Both routed to the same four audiences
		// — PE operators, fractional CFOs, EOS implementers, ops consultants
		// — so they were merged into a single persona-toggled page and
		// promoted to a top-level nav entry here.
		{ href: '/web/for-partners', key: 'nav.for_partners' }
	];

	const navLinksAfterResources: NavItem[] = [
		{
			href: '/web/demo',
			key: 'nav.demo',
			children: [{ href: '/web/demo/pitch-deck', key: 'nav.demo.pitch_deck' }]
		}
	];
</script>

<header class="sticky top-0 z-50 border-b border-border bg-surfaceLight">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<div class="flex items-center">
				<a href={resolve('/')} class="flex items-center gap-2">
					<img src={theme.brand.logoPath} alt={theme.brand.applicationName} class="h-8 w-auto" />
					<span class="text-xl font-medium text-primary">
						{theme.brand.applicationName}
					</span>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<nav class="hidden items-center gap-5 lg:flex">
				{#each navLinksBeforeResources as link (link.href)}
					{#if link.children}
						<NavDropdown
							{locale}
							labelKey={link.key}
							parentHref={link.href}
							items={link.children}
							variant="desktop"
						/>
					{:else}
						<a href={href(link.href)} class="text-sm text-secondary hover:text-primary">
							{t(locale, link.key)}
						</a>
					{/if}
				{/each}

				<!-- Resources dropdown (Deployment + migration guides) -->
				<ResourcesMenu {locale} variant="desktop" />

				{#each navLinksAfterResources as link (link.href)}
					{#if link.children}
						<NavDropdown
							{locale}
							labelKey={link.key}
							parentHref={link.href}
							items={link.children}
							variant="desktop"
						/>
					{:else}
						<a href={href(link.href)} class="text-sm text-secondary hover:text-primary">
							{t(locale, link.key)}
						</a>
					{/if}
				{/each}

				<!-- Accessibility menu -->
				<AccessibilityMenu {locale} />

				<!-- Language switcher -->
				<LanguageSwitcher {locale} />

				<!-- Auth controls -->
				{#if session}
					<a href={resolve('/web/dashboard')} class="text-sm text-secondary hover:text-primary">
						{t(locale, 'nav.dashboard')}
					</a>
					<a href={resolve('/auth/logout')} class="text-sm text-secondary hover:text-primary">
						{t(locale, 'nav.signout')}
					</a>
				{:else}
					<a href={resolve('/web/login')} class="text-sm text-secondary hover:text-primary">
						{t(locale, 'nav.signin')}
					</a>
					<a
						href={resolve('/web/register')}
						class="btn-primary px-4 py-1.5 focus:ring-2 focus:ring-accent1 focus:ring-offset-2 focus:outline-none"
					>
						{t(locale, 'nav.get_primer')}
					</a>
				{/if}
			</nav>

			<!-- Mobile menu button -->
			<button
				type="button"
				class="rounded-md p-2 text-secondary hover:bg-surfaceMid hover:text-primary lg:hidden"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-expanded={isMobileMenuOpen}
				aria-label="Toggle menu"
			>
				{#if isMobileMenuOpen}
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{:else}
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if isMobileMenuOpen}
		<div class="border-t border-border bg-surfaceMid lg:hidden">
			<div class="space-y-1 px-4 py-3">
				{#each navLinksBeforeResources as link (link.href)}
					{#if link.children}
						<NavDropdown
							{locale}
							labelKey={link.key}
							parentHref={link.href}
							items={link.children}
							variant="mobile"
						/>
					{:else}
						<a
							href={href(link.href)}
							class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
						>
							{t(locale, link.key)}
						</a>
					{/if}
				{/each}

				<!-- Resources menu (flattened on mobile — no dropdown chrome) -->
				<ResourcesMenu {locale} variant="mobile" />

				{#each navLinksAfterResources as link (link.href)}
					{#if link.children}
						<NavDropdown
							{locale}
							labelKey={link.key}
							parentHref={link.href}
							items={link.children}
							variant="mobile"
						/>
					{:else}
						<a
							href={href(link.href)}
							class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
						>
							{t(locale, link.key)}
						</a>
					{/if}
				{/each}

				<div class="border-t border-border pt-3">
					<div class="flex items-center gap-2">
						<AccessibilityMenu {locale} />
						<LanguageSwitcher {locale} />
					</div>
				</div>

				<div class="border-t border-border pt-3">
					{#if session}
						<a
							href={resolve('/web/dashboard')}
							class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
						>
							{t(locale, 'nav.dashboard')}
						</a>
						<a
							href={resolve('/auth/logout')}
							class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
						>
							{t(locale, 'nav.signout')}
						</a>
					{:else}
						<a
							href={resolve('/web/login')}
							class="block rounded-md px-3 py-2 text-base text-secondary hover:bg-surfaceLight hover:text-primary"
						>
							{t(locale, 'nav.signin')}
						</a>
						<a
							href={resolve('/web/register')}
							class="btn-primary mt-2 block w-full px-3 py-2 text-center"
						>
							{t(locale, 'nav.get_primer')}
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Close mobile menu on Escape -->
<svelte:window onkeydown={handleKeydown} />
