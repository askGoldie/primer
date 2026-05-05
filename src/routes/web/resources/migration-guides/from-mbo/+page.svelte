<script lang="ts">
	/**
	 * Migration Guide: From MBO (Management by Objectives) to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.mbo.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_mbo"
	path="/web/resources/migration-guides/from-mbo"
	i18nPrefix="resources.mg.mbo"
/>
