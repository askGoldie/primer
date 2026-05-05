<script lang="ts">
	/**
	 * Migration Guide: From KPI Dashboards to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.kpis.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_kpis"
	path="/web/resources/migration-guides/from-kpis"
	i18nPrefix="resources.mg.kpis"
/>
