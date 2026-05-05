<script lang="ts">
	/**
	 * StructuredData — emit JSON-LD into the page head.
	 *
	 * JSON-LD is the format Google, Bing, and most AI assistants prefer for
	 * structured data. It is also the most ergonomic for an LLM to ingest:
	 * a single JSON object describing the entity is far easier to cite than
	 * scraping HTML.
	 *
	 * This component is a low-level emitter — it just stringifies whatever
	 * object you pass it. Use the helper builders in `$lib/seo/structured.ts`
	 * to construct properly-shaped schema.org objects.
	 *
	 * Multiple objects: render multiple StructuredData instances. Each emits
	 * its own ld+json block, which is the spec-compliant way to expose
	 * multiple top-level entities on one page.
	 *
	 * @example
	 *   import StructuredData from '$lib/components/seo/StructuredData.svelte';
	 *   import { buildOrganization } from '$lib/seo/structured.js';
	 *
	 *   const org = buildOrganization(data.locale);
	 *   <StructuredData data={org} />
	 */

	interface Props {
		/** A schema.org object (or array of objects) to emit as JSON-LD. */
		data: Record<string, unknown> | Record<string, unknown>[];
	}

	let { data }: Props = $props();

	// JSON.stringify is safe — we additionally escape any closing-tag
	// sequences inside string values so the closing tag of our injected
	// script block cannot be terminated early. This is the standard pattern
	// for inlining JSON-LD payloads.
	//
	// NOTE: we use hex escapes (\x3c = '<') when assembling the tag so the
	// Svelte compiler, which scans the source for literal `<script>` strings
	// to identify script blocks, does not misinterpret our tag-builder code.
	const json = $derived(JSON.stringify(data).replace(/\x3c\/script/gi, '\x3c\\/script'));
	const tagOpen = '\x3cscript type="application/ld+json">';
	const tagClose = '\x3c/script>';
	const html = $derived(tagOpen + json + tagClose);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
</svelte:head>
