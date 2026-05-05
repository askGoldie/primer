<script lang="ts">
	/**
	 * Migration Guide: From Balanced Scorecard to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.bsc.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_bsc"
	path="/web/resources/migration-guides/from-balanced-scorecard"
	i18nPrefix="resources.mg.bsc"
/>
