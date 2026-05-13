<script lang="ts">
	/**
	 * EvaluationModePanel
	 *
	 * EVALUATION MODE — remove this file along with
	 * `src/routes/auth/demo-login/` and the `seeds/14_demo_admin.sql`
	 * seed before going to production. The banner text below also lists
	 * the same removal checklist so IT cannot miss it during deployment.
	 *
	 * Renders an amber-bordered panel above the login form with a single
	 * "Sign in as Demo CEO" button (posts to `/auth/demo-login`) plus the
	 * plain-text credentials for evaluators who prefer the form.
	 */
</script>

<div class="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-5 text-amber-900">
	<div class="mb-2 text-xs font-semibold tracking-wide uppercase">Evaluation mode</div>

	<p class="mb-4 text-sm leading-relaxed">
		One-click sign-in for evaluating Primer. Before going to production, remove
		<code class="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs"
			>src/routes/auth/login/EvaluationModePanel.svelte</code
		>,
		<code class="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs"
			>src/routes/auth/demo-login/</code
		>, and the
		<code class="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs"
			>seeds/14_demo_admin.sql</code
		> seed.
	</p>

	<form method="POST" action="/auth/demo-login">
		<button
			type="submit"
			class="w-full rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600"
		>
			Sign in as Demo CEO
		</button>
	</form>

	<p class="mt-3 text-xs text-amber-800">
		Or sign in with the form below:
		<code class="rounded bg-amber-100 px-1 py-0.5 font-mono">demo@primer.company</code>
		/
		<code class="rounded bg-amber-100 px-1 py-0.5 font-mono">demo2026</code>
	</p>
</div>
