<script lang="ts">
	import { href } from '$lib/utils/href.js';
	/**
	 * Settings Page
	 *
	 * Four-tab settings surface. Tab visibility is role-gated:
	 *
	 *   Organization — owner / system_admin
	 *     org name + inquiry toggle, default peer visibility, elevated grants
	 *
	 *   Hierarchy    — owner / system_admin / hr_admin
	 *     Placeholder in Pass A. Tree-view builder lands in Pass B.
	 *
	 *   Team         — owner (role assignment)
	 *     member table with role dropdowns
	 *
	 *   Audit        — owner / system_admin / hr_admin
	 *     stats, pending placements, dept overview, bulk snapshot/unlock,
	 *     all-nodes status table, cycle cadence, audit log link, exports
	 *
	 * Tab state is reflected in `?tab=<id>` so links like `/app/settings?tab=audit`
	 * land directly on the right tab (used by the /app/admin redirect).
	 *
	 * @see docs/settings-reorg-plan.md
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageData, ActionData } from './$types.js';
	import { t } from '$lib/i18n/index.js';
	import { enhance } from '$app/forms';
	import { fade, slide } from 'svelte/transition';
	import HelpTooltip from '$lib/components/ui/HelpTooltip.svelte';
	import TierIndicator from '$lib/components/tier/TierIndicator.svelte';
	import HierarchyBuilder from '$lib/components/hierarchy/HierarchyBuilder.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ── Tab navigation ──────────────────────────────────────────────────────
	type SettingsTab = 'organization' | 'hierarchy' | 'team' | 'audit';

	/** All possible tabs with their visibility conditions */
	const allTabs: { id: SettingsTab; labelKey: string; visible: boolean }[] = $derived([
		{ id: 'organization', labelKey: 'settings.tab.organization', visible: data.canEditOrg },
		{
			id: 'hierarchy',
			labelKey: 'settings.tab.hierarchy',
			visible: data.canEditHierarchy
		},
		{
			id: 'team',
			labelKey: 'settings.tab.team',
			visible: data.canAssignRoles && data.members.length > 0
		},
		{ id: 'audit', labelKey: 'settings.tab.audit', visible: data.canViewAudit }
	]);

	/** Only tabs the current user is permitted to see */
	const visibleTabs = $derived(allTabs.filter((tab) => tab.visible));

	/**
	 * Initial active tab — pulled from the `?tab=` query param when set
	 * (so `/app/settings?tab=audit` deep-links into the Audit tab), otherwise
	 * defaults to the first visible tab for this user.
	 */
	function initialTab(): SettingsTab {
		const qp = $page.url.searchParams.get('tab') as SettingsTab | null;
		if (qp && visibleTabs.some((t) => t.id === qp)) return qp;
		return visibleTabs[0]?.id ?? 'organization';
	}

	let activeTab = $state<SettingsTab>(initialTab());

	/** Keep the URL in sync when the user switches tabs (no reload) */
	function switchTab(id: SettingsTab) {
		activeTab = id;
		const params = new SvelteURLSearchParams($page.url.searchParams);
		params.set('tab', id);
		goto(`${$page.url.pathname}?${params.toString()}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	/** Auto-switch tab when a form action succeeds, so the user sees the banner */
	$effect(() => {
		if (form?.success) activeTab = 'organization';
		else if (form?.roleSuccess) activeTab = 'team';
		else if (form?.peerVisibilitySuccess || form?.grantSuccess || form?.revokeSuccess)
			activeTab = 'organization';
		else if (
			form?.cadenceSuccess ||
			form?.bulkSnapshotSuccess ||
			form?.bulkUnlockSuccess ||
			form?.resolvePlacementSuccess
		)
			activeTab = 'audit';
	});

	// ── Organization tab: peer visibility + grants ──────────────────────────
	/** Whether the grant creation form is visible */
	let showGrantForm = $state(false);

	/** Track selected radio to detect unsaved changes */
	// svelte-ignore state_referenced_locally
	let selectedVisibility = $state(data.peerVisibilitySetting);

	/** Sync when server data updates (e.g. after successful save) */
	$effect(() => {
		selectedVisibility = data.peerVisibilitySetting;
	});

	/** Map setting key to its display title i18n key */
	const visibilityTitleKey = $derived(`visibility.${data.peerVisibilitySetting}_title` as const);

	/** Whether the user has picked a different option than what's saved */
	const hasUnsavedChanges = $derived(selectedVisibility !== data.peerVisibilitySetting);

	// ── Audit tab: bulk snapshot form state ────────────────────────────────
	let showSnapshotForm = $state(false);

	/** Nodes that are not currently locked (candidates for snapshot) */
	const unlockedNodes = $derived(data.auditNodes.filter((n) => !n.isLocked && n.metricCount > 0));
	const lockedNodes = $derived(data.auditNodes.filter((n) => n.isLocked));
</script>

<svelte:head>
	<title>{t(data.locale, 'nav.settings')} | {data.organization.name}</title>
</svelte:head>

<div class="p-8">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-medium text-primary">
			{t(data.locale, 'nav.settings')}
		</h1>
		<p class="mt-1 text-secondary">{t(data.locale, 'settings.subtitle')}</p>

		<!-- Tab bar -->
		<div class="mt-4 flex gap-1 rounded-lg bg-surfaceMid p-1">
			{#each visibleTabs as tab (tab.id)}
				<button
					onclick={() => switchTab(tab.id)}
					class="rounded-md px-4 py-1.5 text-sm transition-colors {activeTab === tab.id
						? 'bg-accent2/15 font-medium text-accent2'
						: 'text-secondary hover:text-primary'}"
				>
					{t(data.locale, tab.labelKey)}
				</button>
			{/each}
		</div>
	</div>

	<div class="mx-auto max-w-4xl">
		<!-- ── Organization Tab ─────────────────────────────────────────────── -->
		{#if activeTab === 'organization' && data.canEditOrg}
			<div class="space-y-8">
				<!-- Core org settings -->
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h2 class="text-lg font-medium text-primary">
						{t(data.locale, 'setup.organization')}
					</h2>
					<p class="mt-1 text-sm text-secondary">
						{t(data.locale, 'settings.org_explain')}
					</p>

					{#if form?.success}
						<div
							transition:fade={{ duration: 200 }}
							class="mt-4 rounded-lg bg-accent2/10 p-4 text-sm text-accent2"
						>
							{t(data.locale, 'settings.saved')}
						</div>
					{/if}

					<form method="POST" action="?/updateOrg" class="mt-6 space-y-4" use:enhance>
						<div>
							<label for="name" class="block text-sm font-medium text-primary">
								{t(data.locale, 'setup.org_name')}
							</label>
							<input
								type="text"
								id="name"
								name="name"
								value={data.organization.name}
								required
								class="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2 text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							/>
						</div>

						<div>
							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									id="inquiryEnabled"
									name="inquiryEnabled"
									checked={data.organization.inquiryEnabled}
									class="h-4 w-4 rounded border-border text-accent1 focus:ring-accent1"
								/>
								<label for="inquiryEnabled" class="text-sm text-primary">
									{t(data.locale, 'settings.inquiry_system')}
								</label>
							</div>
							<p class="mt-1 ml-7 text-xs text-secondary">
								{t(data.locale, 'settings.inquiry_explain')}
							</p>
						</div>

						<div class="pt-2">
							<button
								type="submit"
								class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
							>
								{t(data.locale, 'action.save')}
							</button>
						</div>
					</form>
				</div>

				<!-- Peer Visibility (was old Access tab) -->
				{#if data.showVisibility}
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<div class="flex items-center gap-3">
							<h2 class="text-lg font-medium text-primary">
								{t(data.locale, 'settings.peer_visibility')}
							</h2>
							<HelpTooltip text={t(data.locale, 'tooltip.visibility.peer_visibility')} />
							<span
								class="inline-flex items-center gap-1 rounded-full bg-accent1/10 px-2.5 py-0.5 text-xs font-medium text-accent1"
							>
								{t(data.locale, 'visibility.current_label')}: {t(data.locale, visibilityTitleKey)}
							</span>
						</div>
						<p class="mt-1 text-sm text-secondary">
							{t(data.locale, 'team.peer_visibility_description')}
						</p>

						{#if form?.peerVisibilitySuccess}
							<div
								transition:fade={{ duration: 200 }}
								class="mt-4 rounded-lg bg-accent2/10 p-3 text-sm text-accent2"
							>
								{t(data.locale, 'visibility.saved_to', {
									level: t(data.locale, visibilityTitleKey)
								})}
							</div>
						{/if}

						<form method="POST" action="?/updatePeerVisibility" class="mt-5" use:enhance>
							<div class="space-y-3">
								<label
									class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors has-[:checked]:border-accent1 has-[:checked]:bg-accent1/5"
								>
									<input
										type="radio"
										name="peerVisibility"
										value="score_only"
										bind:group={selectedVisibility}
										class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
									/>
									<div>
										<span class="block text-sm font-medium text-primary">
											{t(data.locale, 'visibility.score_only_title')}
										</span>
										<span class="block text-xs text-secondary">
											{t(data.locale, 'visibility.score_only_desc')}
										</span>
									</div>
								</label>

								<label
									class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors has-[:checked]:border-accent1 has-[:checked]:bg-accent1/5"
								>
									<input
										type="radio"
										name="peerVisibility"
										value="metrics"
										bind:group={selectedVisibility}
										class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
									/>
									<div>
										<span class="block text-sm font-medium text-primary">
											{t(data.locale, 'visibility.metrics_title')}
										</span>
										<span class="block text-xs text-secondary">
											{t(data.locale, 'visibility.metrics_desc')}
										</span>
									</div>
								</label>

								<label
									class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors has-[:checked]:border-accent1 has-[:checked]:bg-accent1/5"
								>
									<input
										type="radio"
										name="peerVisibility"
										value="full"
										bind:group={selectedVisibility}
										class="mt-0.5 h-4 w-4 border-border text-accent1 focus:ring-accent1"
									/>
									<div>
										<span class="block text-sm font-medium text-primary">
											{t(data.locale, 'visibility.full_title')}
										</span>
										<span class="block text-xs text-secondary">
											{t(data.locale, 'visibility.full_desc')}
										</span>
									</div>
								</label>
							</div>

							<div class="mt-4 flex items-center gap-3">
								<button
									type="submit"
									disabled={!hasUnsavedChanges}
									class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors {hasUnsavedChanges
										? 'bg-accent1 hover:bg-accent1/90'
										: 'cursor-not-allowed bg-accent1/40'}"
								>
									{t(data.locale, 'action.save')}
								</button>
								{#if hasUnsavedChanges}
									<span
										transition:fade={{ duration: 150 }}
										class="text-xs font-medium text-amber-600"
									>
										{t(data.locale, 'visibility.unsaved')}
									</span>
								{/if}
							</div>
						</form>
					</div>

					<!-- Elevated Access Grants (was old Access tab) -->
					<div class="rounded-lg border border-border bg-surfaceMid p-6">
						<div class="flex items-start justify-between gap-4">
							<div>
								<div class="flex items-center gap-2">
									<h2 class="text-lg font-medium text-primary">
										{t(data.locale, 'team.grants_heading')}
									</h2>
									<HelpTooltip text={t(data.locale, 'tooltip.visibility.grants')} />
								</div>
								<p class="mt-1 text-sm text-secondary">
									{t(data.locale, 'team.grants_description')}
								</p>
							</div>
							<button
								type="button"
								class="shrink-0 rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
								onclick={() => (showGrantForm = !showGrantForm)}
							>
								{showGrantForm ? t(data.locale, 'action.cancel') : t(data.locale, 'team.add_grant')}
							</button>
						</div>

						{#if form?.grantSuccess}
							<div
								transition:fade={{ duration: 200 }}
								class="mt-4 rounded-lg bg-accent2/10 p-3 text-sm text-accent2"
							>
								{t(data.locale, 'team.grant_created')}
							</div>
						{/if}

						{#if showGrantForm}
							<form
								transition:slide={{ duration: 300 }}
								method="POST"
								action="?/createGrant"
								class="mt-6 space-y-4 rounded-lg border border-border bg-surface p-5"
								use:enhance
							>
								<div>
									<label for="granteeNodeId" class="block text-sm font-medium text-primary">
										{t(data.locale, 'team.grant_person')}
									</label>
									<select
										id="granteeNodeId"
										name="granteeNodeId"
										required
										class="mt-1 block w-full rounded-lg border border-border bg-surfaceMid px-4 py-2 text-sm text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
									>
										<option value="">{t(data.locale, 'team.grant_select_person')}</option>
										{#each data.allNodes as node (node.id)}
											<option value={node.id}>
												{node.name}{node.title ? ` — ${node.title}` : ''}
											</option>
										{/each}
									</select>
								</div>

								<div>
									<label for="scopeNodeId" class="block text-sm font-medium text-primary">
										{t(data.locale, 'team.grant_scope')}
									</label>
									<p class="text-xs text-secondary">
										{t(data.locale, 'visibility.scope_help')}
									</p>
									<select
										id="scopeNodeId"
										name="scopeNodeId"
										class="mt-1 block w-full rounded-lg border border-border bg-surfaceMid px-4 py-2 text-sm text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
									>
										<option value="">
											{t(data.locale, 'team.grant_scope_entire_org')}
										</option>
										{#each data.allNodes as node (node.id)}
											<option value={node.id}>
												{node.name}{node.title ? ` — ${node.title}` : ''}
											</option>
										{/each}
									</select>
								</div>

								<div>
									<label for="visibility" class="block text-sm font-medium text-primary">
										{t(data.locale, 'team.grant_level')}
									</label>
									<select
										id="visibility"
										name="visibility"
										class="mt-1 block w-full rounded-lg border border-border bg-surfaceMid px-4 py-2 text-sm text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
									>
										<option value="full">{t(data.locale, 'visibility.full_title')}</option>
										<option value="metrics">
											{t(data.locale, 'visibility.metrics_title')}
										</option>
										<option value="score_only">
											{t(data.locale, 'visibility.score_only_title')}
										</option>
									</select>
								</div>

								<button
									type="submit"
									class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent1/90"
								>
									{t(data.locale, 'team.grant_create')}
								</button>
							</form>
						{/if}

						{#if data.grants.length > 0}
							<div class="mt-6 rounded-lg border border-border bg-surface">
								<ul class="divide-y divide-border">
									{#each data.grants as grant (grant.id)}
										<li class="flex items-center justify-between gap-4 p-4">
											<div class="min-w-0 flex-1">
												<span class="block font-medium text-primary">
													{grant.granteeName}
												</span>
												{#if grant.granteeTitle}
													<span class="block text-sm text-secondary">
														{grant.granteeTitle}
													</span>
												{/if}
												<span class="block text-xs text-secondary">
													{grant.scopeName
														? t(data.locale, 'team.grant_scope_label', {
																name: grant.scopeName
															})
														: t(data.locale, 'team.grant_scope_entire_org')}
													·
													{t(data.locale, `visibility.${grant.visibility}_title`)}
												</span>
											</div>
											<form method="POST" action="?/revokeGrant" use:enhance>
												<input type="hidden" name="grantId" value={grant.id} />
												<button
													type="submit"
													class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-red-300 hover:text-red-500"
												>
													{t(data.locale, 'team.grant_revoke')}
												</button>
											</form>
										</li>
									{/each}
								</ul>
							</div>
						{:else if !showGrantForm}
							<p class="mt-6 text-sm text-secondary">
								{t(data.locale, 'team.no_grants')}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- ── Hierarchy Tab (Pass B) ───────────────────────────────────────── -->
		{#if activeTab === 'hierarchy' && data.canEditHierarchy}
			<div class="space-y-4">
				<div class="rounded-lg border border-border bg-surfaceMid p-6">
					<h2 class="text-lg font-medium text-primary">
						{t(data.locale, 'settings.tab.hierarchy')}
					</h2>
					<p class="mt-1 text-sm text-secondary">
						{t(data.locale, 'hierarchy.tab_description')}
					</p>
				</div>
				<HierarchyBuilder
					nodes={data.hierarchyNodes}
					members={data.assignableMembers}
					locale={data.locale}
				/>
			</div>
		{/if}

		<!-- ── Team Tab ────────────────────────────────────────────────────── -->
		{#if activeTab === 'team' && data.canAssignRoles && data.members.length > 0}
			<div class="rounded-lg border border-border bg-surfaceMid p-6">
				<h2 class="text-lg font-medium text-primary">
					{t(data.locale, 'settings.role_management')}
				</h2>
				<p class="mt-1 text-sm text-secondary">
					{t(data.locale, 'settings.role_explain')}
				</p>

				{#if form?.roleSuccess}
					<div
						transition:fade={{ duration: 200 }}
						class="mt-4 rounded-lg bg-accent2/10 p-4 text-sm text-accent2"
					>
						{t(data.locale, 'settings.role_saved')}
					</div>
				{/if}

				<div class="mt-4 overflow-x-auto rounded-lg border border-border/50">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-border bg-surface">
							<tr>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'auth.name')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'auth.email')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'settings.role')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/50">
							{#each data.members as member (member.id)}
								<tr class="hover:bg-surfaceHigh/50">
									<td class="px-4 py-3 font-medium text-primary">{member.userName}</td>
									<td class="px-4 py-3 text-secondary">{member.userEmail}</td>
									<td class="px-4 py-3">
										<span
											class="rounded-full px-2 py-0.5 text-xs font-medium {member.role === 'owner'
												? 'bg-accent1/10 text-accent1'
												: member.role === 'system_admin'
													? 'bg-accent3/10 text-accent3'
													: member.role === 'hr_admin'
														? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
														: member.role === 'editor'
															? 'bg-accent2/10 text-accent2'
															: member.role === 'participant'
																? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
																: 'bg-surfaceHigh text-secondary'}"
										>
											{t(data.locale, `settings.role.${member.role}`)}
										</span>
									</td>
									<td class="px-4 py-3">
										{#if member.userId !== data.user.id}
											<form
												method="POST"
												action="?/updateRole"
												use:enhance
												class="flex items-center gap-2"
											>
												<input type="hidden" name="membershipId" value={member.id} />
												<select
													name="role"
													class="rounded border border-border bg-surface px-2 py-1 text-xs text-primary"
													value={member.role}
												>
													<option value="viewer">
														{t(data.locale, 'settings.role.viewer')}
													</option>
													<option value="participant">
														{t(data.locale, 'settings.role.participant')}
													</option>
													<option value="editor">
														{t(data.locale, 'settings.role.editor')}
													</option>
													<option value="hr_admin">
														{t(data.locale, 'settings.role.hr_admin')}
													</option>
													<option value="system_admin">
														{t(data.locale, 'settings.role.system_admin')}
													</option>
													<option value="owner">
														{t(data.locale, 'settings.role.owner')}
													</option>
												</select>
												<button
													type="submit"
													class="rounded bg-accent1/10 px-2 py-1 text-xs font-medium text-accent1 hover:bg-accent1/20"
												>
													{t(data.locale, 'action.save')}
												</button>
											</form>
										{:else}
											<span class="text-xs text-secondary">
												{t(data.locale, 'settings.your_role')}
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- ── Audit Tab (ported from /app/admin) ──────────────────────────── -->
		{#if activeTab === 'audit' && data.canViewAudit}
			<div class="space-y-6">
				<!-- Cycle cadence + export toolbar -->
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="min-w-[240px] flex-1 rounded-lg border border-border bg-surfaceMid p-4">
						<div class="flex items-center gap-2">
							<h2 class="text-sm font-medium text-primary">
								{t(data.locale, 'setup.cycle_cadence')}
							</h2>
							<HelpTooltip text={t(data.locale, 'settings.cycle_explain')} />
						</div>

						{#if form?.cadenceSuccess}
							<div
								transition:fade={{ duration: 200 }}
								class="mt-2 rounded-lg bg-accent2/10 p-2 text-xs text-accent2"
							>
								{t(data.locale, 'settings.saved')}
							</div>
						{/if}

						<form
							method="POST"
							action="?/updateCycleCadence"
							class="mt-3 flex items-center gap-2"
							use:enhance
						>
							<select
								name="cycleCadence"
								class="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:border-accent1 focus:ring-1 focus:ring-accent1 focus:outline-none"
							>
								<option value="quarterly" selected={data.organization.cycleCadence === 'quarterly'}>
									{t(data.locale, 'setup.cycle.quarterly')}
								</option>
								<option value="monthly" selected={data.organization.cycleCadence === 'monthly'}>
									{t(data.locale, 'setup.cycle.monthly')}
								</option>
							</select>
							<button
								type="submit"
								class="rounded-lg bg-accent1 px-3 py-2 text-xs font-medium text-white hover:bg-accent1/90"
							>
								{t(data.locale, 'action.save')}
							</button>
						</form>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<a
							href={href('/api/export/admin-nodes')}
							data-sveltekit-preload-data="off"
							class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
						>
							{t(data.locale, 'export.csv')}
						</a>
						<a
							href="{href('/api/export/snapshots')}?scope=org"
							data-sveltekit-preload-data="off"
							class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
						>
							{t(data.locale, 'export.snapshots_csv')}
						</a>
						<a
							href="{href('/api/export/performance-logs')}?scope=org"
							data-sveltekit-preload-data="off"
							class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
						>
							{t(data.locale, 'export.perf_logs_csv')}
						</a>
						{#if data.canExport}
							<a
								href={href('/app/settings/audit-log')}
								class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
							>
								{t(data.locale, 'admin.audit_log')}
							</a>
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href="/app/api/audit-export?format=csv"
								class="rounded-lg border border-border px-3 py-2 text-sm text-secondary hover:bg-surfaceHigh hover:text-primary"
							>
								{t(data.locale, 'admin.compliance_export')}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{/if}
					</div>
				</div>

				<!-- Success messages -->
				{#if form?.resolvePlacementSuccess}
					<div
						transition:fade={{ duration: 200 }}
						class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
					>
						{t(data.locale, 'admin.resolve_placement')} ✓
					</div>
				{/if}
				{#if form?.bulkSnapshotSuccess}
					<div
						transition:fade={{ duration: 200 }}
						class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
					>
						{t(data.locale, 'admin.bulk_snapshot_success', {
							captured: String(form.captured ?? 0),
							skipped: String(form.skipped ?? 0)
						})}
					</div>
				{/if}
				{#if form?.bulkUnlockSuccess}
					<div
						transition:fade={{ duration: 200 }}
						class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
					>
						{t(data.locale, 'admin.bulk_unlock_success', {
							count: String(form.unlocked ?? 0)
						})}
					</div>
				{/if}

				<!-- Pending Placements -->
				{#if data.canManageMembers && data.pendingPlacements.length > 0}
					<div
						class="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950"
					>
						<div class="mb-3 flex items-center gap-2">
							<h2 class="text-base font-medium text-primary">
								{t(data.locale, 'admin.pending_placements')}
							</h2>
							<HelpTooltip text={t(data.locale, 'tooltip.admin.pending_placements')} />
						</div>
						<div class="space-y-2">
							{#each data.pendingPlacements as placement (placement.id)}
								<div
									class="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
								>
									<div>
										<span class="font-medium text-primary">
											{placement.userName ?? placement.userEmail ?? '—'}
										</span>
										{#if placement.userEmail}
											<span class="ml-2 text-xs text-secondary">
												{placement.userEmail}
											</span>
										{/if}
									</div>
									<form
										method="POST"
										action="?/resolvePlacement"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="placementId" value={placement.id} />
										<button
											type="submit"
											class="rounded-lg bg-accent2 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent2/90"
										>
											{t(data.locale, 'admin.resolve_placement')}
										</button>
									</form>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Department Overview -->
				{#if data.isSystemAdmin && data.departmentOverview.length > 0}
					<div>
						<h2 class="mb-3 text-base font-medium text-primary">
							{t(data.locale, 'admin.department_overview')}
						</h2>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each data.departmentOverview as dept (dept.name)}
								<div class="rounded-lg border border-border bg-surfaceMid p-4">
									<h3 class="font-medium text-primary">{dept.name}</h3>
									<div class="mt-2 grid grid-cols-2 gap-2 text-xs">
										<div>
											<span class="text-secondary">
												{t(data.locale, 'admin.node_count')}
											</span>
											<span class="ml-1 font-medium text-primary">{dept.nodeCount}</span>
										</div>
										<div>
											<span class="text-secondary">
												{t(data.locale, 'admin.avg_score')}
											</span>
											<span class="ml-1 font-medium text-primary">
												{dept.avgScore?.toFixed(1) ?? '—'}
											</span>
										</div>
										<div>
											<span class="text-secondary">
												{t(data.locale, 'admin.snapshot_completion')}
											</span>
											<span class="ml-1 font-medium text-primary">
												{dept.snapshotCount}/{dept.nodeCount}
											</span>
										</div>
										<div>
											<span class="text-secondary">
												{t(data.locale, 'admin.pending_reviews')}
											</span>
											<span
												class="ml-1 font-medium {dept.pendingReviews > 0
													? 'text-accent1'
													: 'text-primary'}"
											>
												{dept.pendingReviews}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Org-wide Stats -->
				<div class="grid gap-4 sm:grid-cols-4">
					<div class="rounded-lg border border-border bg-surfaceMid p-4">
						<p class="text-2xl font-medium text-primary">{data.auditStats.totalNodes}</p>
						<p class="text-xs text-secondary">
							{t(data.locale, 'admin.stat_total_nodes')}
						</p>
					</div>
					<div class="rounded-lg border border-border bg-surfaceMid p-4">
						<p class="text-2xl font-medium text-primary">
							{data.auditStats.nodesWithMetrics}
						</p>
						<p class="text-xs text-secondary">
							{t(data.locale, 'admin.stat_with_metrics')}
						</p>
					</div>
					<div class="rounded-lg border border-border bg-surfaceMid p-4">
						<p class="text-2xl font-medium text-accent1">
							{data.auditStats.nodesPending}
						</p>
						<p class="text-xs text-secondary">
							{t(data.locale, 'admin.stat_pending_review')}
						</p>
					</div>
					<div class="rounded-lg border border-border bg-surfaceMid p-4">
						<p
							class="text-2xl font-medium {data.auditStats.nodesLocked > 0
								? 'text-amber-600 dark:text-amber-400'
								: 'text-primary'}"
						>
							{data.auditStats.nodesLocked}
						</p>
						<p class="text-xs text-secondary">{t(data.locale, 'admin.stat_locked')}</p>
					</div>
				</div>

				<!-- Bulk Actions (system_admin/owner only) -->
				{#if data.isSystemAdmin}
					<div
						class="flex flex-wrap items-center gap-3 rounded-lg border border-accent1/20 bg-accent1/5 p-4"
					>
						<button
							onclick={() => (showSnapshotForm = !showSnapshotForm)}
							class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
						>
							{t(data.locale, 'admin.bulk_capture')}
						</button>

						{#if lockedNodes.length > 0}
							<form
								method="POST"
								action="?/bulkUnlock"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="scope" value="all" />
								<button
									type="submit"
									class="rounded-lg border border-accent2/50 bg-accent2/10 px-4 py-2 text-sm font-medium text-accent2 hover:bg-accent2/20"
								>
									{t(data.locale, 'admin.bulk_unlock')}
								</button>
							</form>
						{/if}
					</div>

					{#if showSnapshotForm}
						<div
							transition:slide={{ duration: 300 }}
							class="rounded-lg border border-border bg-surfaceMid p-6"
						>
							<h2 class="mb-4 text-base font-medium text-primary">
								{t(data.locale, 'admin.bulk_capture_heading')}
							</h2>
							<p class="mb-4 text-xs text-secondary">
								{t(data.locale, 'admin.bulk_capture_description')}
							</p>
							<form
								method="POST"
								action="?/bulkSnapshot"
								use:enhance={() => {
									return async ({ update }) => {
										showSnapshotForm = false;
										await update();
									};
								}}
							>
								<div class="grid gap-4 sm:grid-cols-3">
									<div>
										<label
											for="bulk-cycle-label"
											class="mb-1 block text-xs font-medium text-secondary"
										>
											{t(data.locale, 'leaders.cycle_label')}
										</label>
										<input
											id="bulk-cycle-label"
											name="cycleLabel"
											type="text"
											required
											placeholder={t(data.locale, 'leaders.cycle_label_placeholder')}
											class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
										/>
									</div>
									<div>
										<label for="bulk-notes" class="mb-1 block text-xs font-medium text-secondary">
											{t(data.locale, 'performance.notes')}
										</label>
										<input
											id="bulk-notes"
											name="notes"
											type="text"
											class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
										/>
									</div>
									<div>
										<label for="bulk-scope" class="mb-1 block text-xs font-medium text-secondary">
											{t(data.locale, 'admin.scope')}
										</label>
										<select
											id="bulk-scope"
											name="scope"
											class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary"
										>
											<option value="all">{t(data.locale, 'admin.scope_all')}</option>
											<option value={unlockedNodes.map((n) => n.id).join(',')}>
												{t(data.locale, 'admin.scope_unlocked', {
													count: String(unlockedNodes.length)
												})}
											</option>
										</select>
									</div>
								</div>
								<div class="mt-4 flex justify-end gap-2">
									<button
										type="button"
										onclick={() => (showSnapshotForm = false)}
										class="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-surfaceHigh"
									>
										{t(data.locale, 'action.cancel')}
									</button>
									<button
										type="submit"
										class="rounded-lg bg-accent1 px-4 py-2 text-sm font-medium text-white hover:bg-accent1/90"
									>
										{t(data.locale, 'admin.bulk_capture')}
									</button>
								</div>
							</form>
						</div>
					{/if}
				{/if}

				<!-- All Nodes Table -->
				<div class="overflow-x-auto rounded-lg border border-border">
					<table class="w-full text-left text-sm">
						<thead class="border-b border-border bg-surfaceMid">
							<tr>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_name')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_type')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_metrics')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_status')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_snapshot')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary">
									{t(data.locale, 'admin.col_perf_logs')}
								</th>
								<th class="px-4 py-3 text-xs font-medium text-secondary"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.auditNodes as node (node.id)}
								<tr class="hover:bg-surfaceHigh/50">
									<td class="px-4 py-3">
										<div class="font-medium text-primary">{node.name}</div>
										{#if node.title}
											<div class="text-xs text-secondary">{node.title}</div>
										{/if}
										{#if node.userName}
											<div class="text-xs text-secondary/60">{node.userName}</div>
										{/if}
									</td>
									<td class="px-4 py-3 text-xs text-secondary capitalize">
										{t(data.locale, `hierarchy.type.${node.nodeType}`)}
									</td>
									<td class="px-4 py-3 text-secondary">
										{node.metricCount}
										{#if node.pendingCount > 0}
											<span
												class="ml-1 rounded-full bg-accent1/10 px-1.5 py-0.5 text-xs text-accent1"
											>
												{node.pendingCount}
												{t(data.locale, 'admin.pending')}
											</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										{#if node.isLocked}
											<span
												class="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
											>
												<svg
													class="h-3 w-3"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
													/>
												</svg>
												{t(data.locale, 'admin.status_locked')}
											</span>
										{:else if node.metricCount > 0}
											<span class="text-xs text-accent2">
												{t(data.locale, 'admin.status_active')}
											</span>
										{:else}
											<span class="text-xs text-secondary">
												{t(data.locale, 'admin.status_no_metrics')}
											</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										{#if node.latestSnapshot}
											<div class="flex items-center gap-2">
												<TierIndicator
													tier={node.latestSnapshot.tier}
													locale={data.locale}
													size="sm"
													dotOnly
												/>
												<span class="text-xs text-secondary">
													{node.latestSnapshot.score.toFixed(1)}
												</span>
												{#if node.latestSnapshot.cycleLabel}
													<span class="text-xs text-secondary/60">
														{node.latestSnapshot.cycleLabel}
													</span>
												{/if}
											</div>
										{:else}
											<span class="text-xs text-secondary">—</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-secondary">{node.perfLogCount}</td>
									<td class="px-4 py-3">
										<a
											href={href(`/app/leaders/${node.id}`)}
											class="rounded-lg border border-border px-2 py-1 text-xs text-secondary hover:bg-surfaceHigh hover:text-primary"
										>
											{t(data.locale, 'admin.view')}
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
