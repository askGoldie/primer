/**
 * CSV Export Utility
 *
 * Simple, dependency-free CSV generation for data exports.
 * Customers can customize column mappings and formatting
 * by modifying this module.
 *
 * @example
 * ```ts
 * const csv = toCsv(
 *   ['Name', 'Score', 'Tier'],
 *   rows.map(r => [r.name, r.score, r.tier])
 * );
 * ```
 */

/**
 * Escape a CSV field value.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
function escapeField(value: unknown): string {
	const str = value === null || value === undefined ? '' : String(value);
	if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Generate a CSV string from headers and rows.
 *
 * @param headers - Column header labels
 * @param rows - Array of row arrays (each row is an array of cell values)
 * @returns UTF-8 CSV string with BOM for Excel compatibility
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
	const bom = '\uFEFF'; // UTF-8 BOM for Excel
	const headerLine = headers.map(escapeField).join(',');
	const dataLines = rows.map((row) => row.map(escapeField).join(','));
	return bom + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Create a SvelteKit Response with CSV content and download headers.
 *
 * @param filename - The download filename (without path)
 * @param csv - The CSV string content
 */
export function csvResponse(filename: string, csv: string): Response {
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}
