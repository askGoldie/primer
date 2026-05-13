/**
 * SBOM Generator
 *
 * Walks `package-lock.json` and emits `docs/sbom.csv` — a Software Bill
 * of Materials suitable for procurement, security audit, and compliance
 * review. The lockfile (lockfileVersion 3) carries license, integrity
 * hash, and resolved URL for every installed package, so the SBOM does
 * not need `node_modules` to be present.
 *
 * Usage:
 *   npm run sbom
 *
 * Output:
 *   docs/sbom.csv
 *
 * Columns:
 *   name              Package name (npm)
 *   version           Resolved version
 *   license           License identifier (typically SPDX, e.g. MIT, Apache-2.0)
 *   classification    production | development | optional
 *   direct_dependency yes if listed in the root package.json's
 *                     dependencies / devDependencies, no if transitive
 *   integrity         SHA hash from the lockfile (supply-chain audit)
 *   resolved          Tarball URL the package was fetched from
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

interface LockfileEntry {
  version?: string;
  resolved?: string;
  integrity?: string;
  license?: string | string[];
  dev?: boolean;
  optional?: boolean;
  devOptional?: boolean;
}

interface Lockfile {
  lockfileVersion: number;
  packages: Record<string, LockfileEntry>;
}

interface RootManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolvePath(__dirname, "..");
const lockfilePath = resolvePath(projectRoot, "package-lock.json");
const manifestPath = resolvePath(projectRoot, "package.json");
const outputPath = resolvePath(projectRoot, "docs", "sbom.csv");

const lockfile: Lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
const manifest: RootManifest = JSON.parse(readFileSync(manifestPath, "utf8"));

if (lockfile.lockfileVersion < 3) {
  console.error(
    `error: package-lock.json is lockfileVersion ${lockfile.lockfileVersion}; this script requires lockfileVersion 3 or later (npm 7+).`,
  );
  process.exit(1);
}

const directDependencies = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.devDependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
]);

interface SbomRow {
  name: string;
  version: string;
  license: string;
  classification: "production" | "development" | "optional";
  direct: boolean;
  integrity: string;
  resolved: string;
}

const rows: SbomRow[] = [];

for (const [path, entry] of Object.entries(lockfile.packages)) {
  // The root package is keyed as "" — skip it.
  if (!path.startsWith("node_modules/")) continue;

  // Resolve the package name. For nested paths
  // (e.g. node_modules/foo/node_modules/bar) we want the deepest segment
  // after the last "node_modules/", since that is the package whose
  // version, license, and integrity are recorded on this entry.
  const lastNodeModules = path.lastIndexOf("node_modules/");
  const name = path.slice(lastNodeModules + "node_modules/".length);

  const license = Array.isArray(entry.license)
    ? entry.license.join(" OR ")
    : (entry.license ?? "unknown");

  // dev/devOptional packages are part of the build/test toolchain and
  // classify as 'development' even when also flagged optional.
  // Pure-optional runtime deps (rare) get the 'optional' label.
  const classification: SbomRow["classification"] =
    entry.dev || entry.devOptional
      ? "development"
      : entry.optional
        ? "optional"
        : "production";

  rows.push({
    name,
    version: entry.version ?? "",
    license,
    classification,
    direct: directDependencies.has(name),
    integrity: entry.integrity ?? "",
    resolved: entry.resolved ?? "",
  });
}

// Production first (most relevant to runtime risk), then development,
// then optional. Within each group, alphabetical by name.
const classOrder = { production: 0, development: 1, optional: 2 };
rows.sort((a, b) => {
  const c = classOrder[a.classification] - classOrder[b.classification];
  return c !== 0 ? c : a.name.localeCompare(b.name);
});

/**
 * Quote a CSV cell. Wraps in double quotes if it contains a comma,
 * quote, or newline; doubles any embedded quotes.
 */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const header = [
  "name",
  "version",
  "license",
  "classification",
  "direct_dependency",
  "integrity",
  "resolved",
];

const lines = [header.join(",")];
for (const row of rows) {
  lines.push(
    [
      csvCell(row.name),
      csvCell(row.version),
      csvCell(row.license),
      csvCell(row.classification),
      row.direct ? "yes" : "no",
      csvCell(row.integrity),
      csvCell(row.resolved),
    ].join(","),
  );
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join("\n") + "\n");

const counts = rows.reduce(
  (acc, r) => {
    acc[r.classification]++;
    if (r.direct) acc.direct++;
    return acc;
  },
  { production: 0, development: 0, optional: 0, direct: 0 },
);

console.log(`wrote ${outputPath}`);
console.log(
  `  ${rows.length} packages — ${counts.production} production, ${counts.development} development, ${counts.optional} optional (${counts.direct} direct)`,
);
