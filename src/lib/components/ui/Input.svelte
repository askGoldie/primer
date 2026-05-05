<script lang="ts">
	/**
	 * Input Component
	 *
	 * Text input field with label and error state support.
	 */

	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		/** Input label */
		label?: string;
		/** Error message */
		error?: string;
		/** Helper text */
		hint?: string;
	}

	let { label, error, hint, id, class: className = '', ...rest }: Props = $props();

	const fallbackId = `input-${Math.random().toString(36).slice(2)}`;
	const inputId = $derived(id || fallbackId);
</script>

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-primary">
			{label}
		</label>
	{/if}

	<input
		id={inputId}
		class="
			block w-full rounded-md border px-3 py-2 text-sm
			placeholder:text-secondary/50
			focus:ring-2 focus:ring-offset-1 focus:outline-none
			disabled:cursor-not-allowed disabled:opacity-50
			{error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500'
			: 'border-border bg-surfaceMid focus:border-accent1 focus:ring-accent1'}
			{className}
		"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
		{...rest}
	/>

	{#if error}
		<p id="{inputId}-error" class="text-sm text-red-600">{error}</p>
	{:else if hint}
		<p id="{inputId}-hint" class="text-sm text-secondary">{hint}</p>
	{/if}
</div>
