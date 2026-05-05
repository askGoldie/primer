<script lang="ts">
	/**
	 * Migration Guide: From EOS / Traction (Rocks + Scorecard) to Primer
	 *
	 * Thin wrapper around MigrationGuideLayout. All copy lives under
	 * `resources.mg.eos.*` in the locale files.
	 */

	import type { PageData } from './$types.js';
	import MigrationGuideLayout from '$lib/components/resources/MigrationGuideLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<MigrationGuideLayout
	locale={data.locale}
	pageKey="mg_eos"
	path="/web/resources/migration-guides/from-eos"
	i18nPrefix="resources.mg.eos"
/>
