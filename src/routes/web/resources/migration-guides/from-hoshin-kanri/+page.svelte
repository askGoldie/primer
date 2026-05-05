<script lang="ts">
	/**
	 * Migration Guide: From Hoshin Kanri / Policy Deployment to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.hoshin.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_hoshin"
	path="/web/resources/migration-guides/from-hoshin-kanri"
	i18nPrefix="resources.mg.hoshin"
/>
