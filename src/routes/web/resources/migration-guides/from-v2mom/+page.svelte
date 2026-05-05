<script lang="ts">
	/**
	 * Migration Guide: From V2MOM (Salesforce) to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.v2mom.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_v2mom"
	path="/web/resources/migration-guides/from-v2mom"
	i18nPrefix="resources.mg.v2mom"
/>
