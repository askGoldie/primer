<script lang="ts">
	/**
	 * BulkUpload
	 *
	 * CSV / paste-from-spreadsheet bulk importer for hierarchy nodes.
	 * Parses input client-side with PapaParse, validates against
	 * containment rules, shows a preview table with inline errors,
	 * then submits valid rows to the bulkCreateHierarchyNodes action.
	 *
	 * This is a starter implementation customers can extend to integrate
	 * with their own HR/identity systems (Workday, BambooHR, etc.).
	 */

	import Papa from 'papaparse';
	import { SvelteMap } from 'svelte/reactivity';
	import { invalidateAll } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import { validateContainment } from '$lib/hierarchy/containment.js';
	import type { HierarchyNodeType, Locale } from '$lib/types/index.js';

	interface ExistingNode {
		id: string;
		parentId: string | null;
		nodeType: HierarchyNodeType;
		name: string;
		title: string | null;
	}

	let {
		nodes,
		locale,
		onClose
	}: {
		nodes: ExistingNode[];
		locale: Locale;
		onClose: () => void;
	} = $props();

	const VALID_TYPES: HierarchyNodeType[] = ['executive_leader', 'department', 'team', 'individual'];

	interface ParsedRow {
		name: string;
		title: string;
		nodeType: string;
		parentName: string;
		description: string;
		errors: string[];
		rowIndex: number;
	}

	let parsedRows = $state<ParsedRow[]>([]);
	let dragOver = $state(false);
	let importing = $state(false);
	let resultMessage = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const validCount = $derived(parsedRows.filter((r) => r.errors.length === 0).length);
	const errorCount = $derived(parsedRows.filter((r) => r.errors.length > 0).length);
	const canImport = $derived(validCount > 0 && !importing);

	/**
	 * Build a name-to-node lookup from existing DB nodes. Used for
	 * resolving the "parent" column in uploaded rows.
	 */
	function buildExistingNameMap(): Map<string, { id: string; nodeType: HierarchyNodeType }> {
		const map = new SvelteMap<string, { id: string; nodeType: HierarchyNodeType }>();
		for (const n of nodes) {
			map.set(n.name.toLowerCase().trim(), { id: n.id, nodeType: n.nodeType });
		}
		return map;
	}

	/** Parse CSV or tab-separated text and populate the preview table. */
	function parseInput(text: string) {
		resultMessage = null;
		if (!text.trim()) {
			parsedRows = [];
			return;
		}

		const result = Papa.parse<Record<string, string>>(text, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (h) => h.trim().toLowerCase()
		});

		const nameMap = buildExistingNameMap();
		const batchNames = new SvelteMap<string, { rowIndex: number; nodeType: HierarchyNodeType }>();
		const rows: ParsedRow[] = [];

		for (let i = 0; i < result.data.length; i++) {
			const raw = result.data[i];
			const row: ParsedRow = {
				name: (raw['name'] ?? '').trim(),
				title: (raw['title'] ?? '').trim(),
				nodeType: (raw['node_type'] ?? raw['type'] ?? '').trim().toLowerCase(),
				parentName: (raw['parent'] ?? raw['parent_name'] ?? '').trim(),
				description: (raw['description'] ?? '').trim(),
				errors: [],
				rowIndex: i
			};

			if (!row.name) {
				row.errors.push(t(locale, 'hierarchy.bulk.error_name_required'));
			} else if (row.name.length > 200) {
				row.errors.push(t(locale, 'hierarchy.bulk.error_name_too_long'));
			}

			if (!VALID_TYPES.includes(row.nodeType as HierarchyNodeType)) {
				row.errors.push(t(locale, 'hierarchy.bulk.error_invalid_type'));
			}

			if (row.nodeType === 'executive_leader' && row.parentName) {
				row.errors.push(t(locale, 'hierarchy.bulk.error_exec_has_parent'));
			}

			if (row.parentName && row.nodeType !== 'executive_leader') {
				const parentKey = row.parentName.toLowerCase().trim();
				const existingParent = nameMap.get(parentKey);
				const batchParent = batchNames.get(parentKey);

				if (existingParent) {
					if (!validateContainment(row.nodeType as HierarchyNodeType, existingParent.nodeType)) {
						row.errors.push(
							t(locale, 'hierarchy.bulk.error_containment', {
								childType: row.nodeType,
								parentType: existingParent.nodeType
							})
						);
					}
				} else if (batchParent) {
					if (!validateContainment(row.nodeType as HierarchyNodeType, batchParent.nodeType)) {
						row.errors.push(
							t(locale, 'hierarchy.bulk.error_containment', {
								childType: row.nodeType,
								parentType: batchParent.nodeType
							})
						);
					}
				} else {
					row.errors.push(
						t(locale, 'hierarchy.bulk.error_parent_not_found', {
							name: row.parentName
						})
					);
				}
			}

			if (!row.parentName && row.nodeType !== 'executive_leader' && row.errors.length === 0) {
				row.errors.push(t(locale, 'hierarchy.bulk.error_parent_required'));
			}

			if (row.errors.length === 0 && row.name) {
				batchNames.set(row.name.toLowerCase().trim(), {
					rowIndex: i,
					nodeType: row.nodeType as HierarchyNodeType
				});
			}

			rows.push(row);
		}

		parsedRows = rows;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => parseInput(reader.result as string);
		reader.readAsText(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => parseInput(reader.result as string);
		reader.readAsText(file);
	}

	function handlePaste(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		setTimeout(() => parseInput(target.value), 0);
	}

	/** Generate and download a CSV template file. */
	function downloadTemplate() {
		const csv = [
			'name,title,node_type,parent,description',
			'Jane Smith,CEO,executive_leader,,Chief Executive Officer',
			'Engineering,,department,Jane Smith,Engineering division',
			'Backend Team,,team,Engineering,Server-side development',
			'Alex Johnson,Senior Engineer,individual,Backend Team,Full-stack developer'
		].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'hierarchy-template.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	/** Submit valid rows to the server. */
	async function submitImport() {
		importing = true;
		resultMessage = null;

		const validRows = parsedRows
			.filter((r) => r.errors.length === 0)
			.map((r) => ({
				name: r.name,
				title: r.title || null,
				nodeType: r.nodeType,
				parentName: r.parentName || null,
				description: r.description || null
			}));

		try {
			const fd = new FormData();
			fd.set('payload', JSON.stringify(validRows));
			const res = await fetch('?/bulkCreateHierarchyNodes', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-action': 'true' }
			});

			if (res.ok) {
				const body = await res.json();
				const data = body?.data;
				const success = data?.successCount ?? validRows.length;
				const failure = data?.failureCount ?? 0;
				resultMessage = t(locale, 'hierarchy.bulk.success', {
					success: String(success),
					failure: String(failure)
				});
				await invalidateAll();
				parsedRows = [];
			} else {
				resultMessage = t(locale, 'error.generic');
			}
		} catch {
			resultMessage = t(locale, 'error.generic');
		} finally {
			importing = false;
		}
	}

	function hasFieldError(row: ParsedRow, field: string): boolean {
		const fieldErrors: Record<string, string[]> = {
			name: ['error_name_required', 'error_name_too_long'],
			nodeType: ['error_invalid_type'],
			parentName: [
				'error_parent_not_found',
				'error_containment',
				'error_exec_has_parent',
				'error_parent_required'
			]
		};
		const patterns = fieldErrors[field] ?? [];
		return row.errors.some((e) =>
			patterns.some((p) => e.includes(p) || e.includes(t(locale, `hierarchy.bulk.${p}`)))
		);
	}
</script>

<div class="space-y-4">
	<!-- Guidance banner -->
	<div class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
		<div class="flex gap-3">
			<svg
				class="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<div class="text-sm text-amber-800 dark:text-amber-200">
				<p class="font-medium">{t(locale, 'hierarchy.bulk.guidance_heading')}</p>
				<p class="mt-1">{t(locale, 'hierarchy.bulk.guidance_body')}</p>
			</div>
		</div>
	</div>

	<!-- Download template -->
	<button
		type="button"
		class="inline-flex items-center gap-2 text-sm font-medium text-accent1 hover:text-accent1/80"
		onclick={downloadTemplate}
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
			/>
		</svg>
		{t(locale, 'hierarchy.bulk.download_template')}
	</button>

	<!-- Input modes -->
	<div class="grid gap-4 lg:grid-cols-2">
		<!-- File drop zone -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors {dragOver
				? 'border-accent1 bg-accent1/5'
				: 'border-border'}"
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => (dragOver = false)}
			ondrop={handleDrop}
		>
			<svg
				class="mb-2 h-8 w-8 text-secondary"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
				/>
			</svg>
			<button
				type="button"
				class="text-sm font-medium text-accent1 hover:text-accent1/80"
				onclick={() => fileInput?.click()}
			>
				{t(locale, 'hierarchy.bulk.choose_file')}
			</button>
			<p class="mt-1 text-xs text-secondary">
				{t(locale, 'hierarchy.bulk.drop_hint')}
			</p>
			<input
				bind:this={fileInput}
				type="file"
				accept=".csv,.tsv,.txt"
				class="hidden"
				onchange={handleFileSelect}
			/>
		</div>

		<!-- Paste zone -->
		<textarea
			class="min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-primary placeholder:text-secondary/60"
			placeholder={t(locale, 'hierarchy.bulk.paste_placeholder')}
			oninput={handlePaste}
		></textarea>
	</div>

	<!-- Result message -->
	{#if resultMessage}
		<div
			role="status"
			aria-live="polite"
			class="rounded-lg border border-accent2/30 bg-accent2/10 px-4 py-2 text-sm text-accent2"
		>
			{resultMessage}
		</div>
	{/if}

	<!-- Summary + preview -->
	{#if parsedRows.length > 0}
		<div class="flex items-center gap-4">
			<span class="text-sm font-medium text-green-600 dark:text-green-400">
				{t(locale, 'hierarchy.bulk.valid_count', { count: String(validCount) })}
			</span>
			{#if errorCount > 0}
				<span class="text-sm font-medium text-red-500">
					{t(locale, 'hierarchy.bulk.error_count', { count: String(errorCount) })}
				</span>
			{/if}
		</div>

		<div class="overflow-x-auto rounded-lg border border-border">
			<table class="w-full text-sm">
				<thead>
					<tr
						class="border-b border-border bg-surfaceMid text-left text-xs font-medium text-secondary"
					>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_row')}</th>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_name')}</th>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_type')}</th>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_parent')}</th>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_title')}</th>
						<th class="px-3 py-2">{t(locale, 'hierarchy.bulk.col_issues')}</th>
					</tr>
				</thead>
				<tbody>
					{#each parsedRows as row (row.rowIndex)}
						<tr
							class="border-b border-border last:border-b-0 {row.errors.length > 0
								? 'bg-red-500/5'
								: ''}"
						>
							<td class="px-3 py-1.5 text-xs text-secondary">{row.rowIndex + 1}</td>
							<td
								class="px-3 py-1.5 {hasFieldError(row, 'name')
									? 'font-medium text-red-500'
									: 'text-primary'}"
							>
								{row.name || '—'}
							</td>
							<td
								class="px-3 py-1.5 {hasFieldError(row, 'nodeType')
									? 'font-medium text-red-500'
									: 'text-primary'}"
							>
								{row.nodeType || '—'}
							</td>
							<td
								class="px-3 py-1.5 {hasFieldError(row, 'parentName')
									? 'font-medium text-red-500'
									: 'text-primary'}"
							>
								{row.parentName || '—'}
							</td>
							<td class="px-3 py-1.5 text-primary">{row.title || '—'}</td>
							<td class="max-w-[200px] px-3 py-1.5 text-xs text-red-500">
								{#if row.errors.length > 0}
									{row.errors.join('; ')}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Action buttons -->
	<div class="flex items-center justify-end gap-3">
		<button
			type="button"
			class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh"
			onclick={onClose}
		>
			{t(locale, 'action.cancel')}
		</button>
		<button
			type="button"
			disabled={!canImport}
			class="inline-flex items-center gap-2 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90 disabled:cursor-not-allowed disabled:opacity-60"
			onclick={submitImport}
		>
			{#if importing}
				<svg
					class="h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
					></path>
				</svg>
				{t(locale, 'hierarchy.saving')}
			{:else}
				{t(locale, 'hierarchy.bulk.import', { count: String(validCount) })}
			{/if}
		</button>
	</div>
</div>
