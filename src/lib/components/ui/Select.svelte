<script lang="ts">
	/**
	 * Select Component
	 *
	 * Dropdown select with label and error state support.
	 */

	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends HTMLSelectAttributes {
		/** Select label */
		label?: string;
		/** Error message */
		error?: string;
		/** Options content */
		children: Snippet;
	}

	let { label, error, id, children, class: className = '', ...rest }: Props = $props();

	const fallbackId = `select-${Math.random().toString(36).slice(2)}`;
	const selectId = $derived(id || fallbackId);
</script>

<div class="space-y-1">
	{#if label}
		<label for={selectId} class="block text-sm font-medium text-primary">
			{label}
		</label>
	{/if}

	<select
		id={selectId}
		class="
			block w-full rounded-md border px-3 py-2 text-sm
			focus:ring-2 focus:ring-offset-1 focus:outline-none
			disabled:cursor-not-allowed disabled:opacity-50
			{error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500'
			: 'border-border bg-surfaceMid focus:border-accent1 focus:ring-accent1'}
			{className}
		"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${selectId}-error` : undefined}
		{...rest}
	>
		{@render children()}
	</select>

	{#if error}
		<p id="{selectId}-error" class="text-sm text-red-600">{error}</p>
	{/if}
</div>
