<script lang="ts">
	/**
	 * Demo Layout
	 *
	 * Minimal chrome for the visual walkthrough. Relies on the parent
	 * /web layout for site navigation; this layout just wraps content.
	 */

	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-surface">
	<main>
		{@render children()}
	</main>
</div>
