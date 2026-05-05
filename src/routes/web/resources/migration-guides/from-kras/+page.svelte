<script lang="ts">
	/**
	 * Migration Guide: From KRAs (Key Result Areas) to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.kras.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_kras"
	path="/web/resources/migration-guides/from-kras"
	i18nPrefix="resources.mg.kras"
/>
