/**
 * Release Packager
 *
 * Produces the customer-deliverable source-code zip from the current
 * `git HEAD`. Wraps `git archive` so we get a clean, repeatable artifact
 * that respects the export-ignore rules in `.gitattributes` (which
 * exclude `docs/_internal/`, `skills/`, etc.).
 *
 * Usage:
 *   npm run package                        # produces primer-source-vX.Y.Z.zip
 *   npm run package -- --output custom.zip # custom path
 *
 * Pre-flight:
 *   - `npm run check` must pass (typecheck gate).
 *   - The committed `docs/sbom.csv` is the SBOM that will ship; if your
 *     dependencies have changed since the last commit, run `npm run sbom`
 *     and commit the result before packaging.
 *   - Warns (does not fail) if the working tree is dirty — `git archive`
 *     ships HEAD, not your uncommitted changes.
 */

import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolvePath(__dirname, '..');
const manifest = JSON.parse(readFileSync(resolvePath(projectRoot, 'package.json'), 'utf8'));
const version = manifest.version ?? '0.0.0';

const args = process.argv.slice(2);
const outputArgIdx = args.indexOf('--output');
const outputPath = resolvePath(
	projectRoot,
	outputArgIdx >= 0 && args[outputArgIdx + 1]
		? args[outputArgIdx + 1]
		: `primer-source-v${version}.zip`
);

function run(cmd: string, opts: { silent?: boolean } = {}): string {
	const out = execSync(cmd, {
		cwd: projectRoot,
		encoding: 'utf8',
		stdio: opts.silent ? ['ignore', 'pipe', 'pipe'] : 'pipe'
	});
	return typeof out === 'string' ? out : '';
}

// ---------------------------------------------------------------------------
// Pre-flight: typecheck gate
// ---------------------------------------------------------------------------

console.log('[package] running npm run check…');
try {
	run('npm run check', { silent: true });
	console.log('[package]   ✓ check passed');
} catch (err) {
	console.error('[package]   ✗ npm run check failed — fix errors before packaging.');
	const stderr = (err as { stdout?: Buffer; stderr?: Buffer }).stdout?.toString() ?? '';
	if (stderr) console.error(stderr);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Working-tree warning (not a failure)
// ---------------------------------------------------------------------------

const dirty = run('git status --porcelain').trim();
if (dirty) {
	console.warn('[package] ⚠ working tree has uncommitted changes:');
	console.warn(
		dirty
			.split('\n')
			.map((l) => '         ' + l)
			.join('\n')
	);
	console.warn('[package]   git archive ships HEAD only — these changes will NOT be in the zip.');
}

// ---------------------------------------------------------------------------
// SBOM freshness reminder
// ---------------------------------------------------------------------------

const sbomPath = resolvePath(projectRoot, 'docs/sbom.csv');
const lockPath = resolvePath(projectRoot, 'package-lock.json');
if (existsSync(sbomPath) && existsSync(lockPath)) {
	const sbomMtime = statSync(sbomPath).mtimeMs;
	const lockMtime = statSync(lockPath).mtimeMs;
	if (lockMtime > sbomMtime) {
		console.warn(
			'[package] ⚠ package-lock.json is newer than docs/sbom.csv — run `npm run sbom` and commit before packaging if dependencies changed.'
		);
	}
}

// ---------------------------------------------------------------------------
// Build the archive
// ---------------------------------------------------------------------------

const headRef = run('git rev-parse --short HEAD').trim();
console.log(`[package] archiving HEAD (${headRef}) → ${outputPath}`);
// `--worktree-attributes` makes git archive consult the working tree's
// .gitattributes (instead of HEAD's) so newly-added export-ignore rules
// apply immediately, without first having to commit them. When the working
// tree is clean — the standard release condition — this is identical to
// the default behaviour.
run(
	`git archive HEAD --worktree-attributes --format=zip --prefix=primer-source/ --output=${JSON.stringify(outputPath)}`
);

// Sanity-check the result
const sizeBytes = statSync(outputPath).size;
const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
console.log(`[package]   ✓ wrote ${sizeMB} MB`);

// Quick listing — confirm key paths are present and excluded paths are absent
const listing = run(`unzip -l ${JSON.stringify(outputPath)}`);
const expectedPaths = [
	'primer-source/README.md',
	'primer-source/CLAUDE.md',
	'primer-source/package.json',
	'primer-source/docker-compose.yml',
	'primer-source/migrations/',
	'primer-source/seeds/',
	'primer-source/src/',
	'primer-source/docs/architecture.md',
	'primer-source/docs/sbom.csv'
];
const forbiddenPaths = [
	'primer-source/docs/_internal/',
	'primer-source/docs/Primer-Delivery.md',
	'primer-source/docs/delivery-plan/',
	'primer-source/skills/',
	'primer-source/skills-lock.json',
	'primer-source/.gitattributes',
	'primer-source/.DS_Store',
	'primer-source/node_modules/',
	'primer-source/.svelte-kit/'
];

let ok = true;
for (const p of expectedPaths) {
	if (!listing.includes(p)) {
		console.error(`[package]   ✗ MISSING from zip: ${p}`);
		ok = false;
	}
}
for (const p of forbiddenPaths) {
	if (listing.includes(p)) {
		console.error(`[package]   ✗ LEAKED into zip: ${p}`);
		ok = false;
	}
}

if (!ok) {
	console.error('[package] zip contents do not match the expected shape — investigate .gitattributes.');
	process.exit(1);
}

console.log(`[package]   ✓ zip contents look right`);
console.log(`[package] done — share ${outputPath} with the customer.`);
