<script lang="ts">
	/**
	 * Button Component
	 *
	 * Primary interactive element for user actions.
	 * Supports multiple variants and sizes per the Tier style guide.
	 */

	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Button variant */
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		/** Button size */
		size?: 'sm' | 'md' | 'lg';
		/** Full width button */
		fullWidth?: boolean;
		/** Loading state */
		loading?: boolean;
		/** Button content */
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		loading = false,
		disabled = false,
		children,
		class: className = '',
		...rest
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-accent1 text-white hover:bg-accent1/90 focus:ring-accent1',
		secondary:
			'bg-surfaceMid text-primary border border-border hover:bg-surfaceLight focus:ring-border',
		ghost: 'text-secondary hover:bg-surfaceMid hover:text-primary focus:ring-border',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {fullWidth
		? 'w-full'
		: ''} {className}"
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<svg
			class="mr-2 h-4 w-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			></path>
		</svg>
	{/if}
	{@render children()}
</button>
