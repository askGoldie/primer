<script lang="ts">
	/**
	 * Migration Guide: From 4DX (4 Disciplines of Execution) to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.four_dx.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_four_dx"
	path="/web/resources/migration-guides/from-4dx"
	i18nPrefix="resources.mg.four_dx"
/>
