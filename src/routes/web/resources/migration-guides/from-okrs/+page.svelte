<script lang="ts">
	/**
	 * Migration Guide: From OKRs to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives in the
	 * locale files under `resources.mg.okrs.*` so it can be translated
	 * and edited without touching this file.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_okrs"
	path="/web/resources/migration-guides/from-okrs"
	i18nPrefix="resources.mg.okrs"
/>
