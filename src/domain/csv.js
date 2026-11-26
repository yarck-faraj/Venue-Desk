/** Encode the quoted, BOM-prefixed text used by every spreadsheet export.
 * @param {unknown[][]} rows
 */
export function csvText(rows) {
  /** @param {unknown} v */
  const quote = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  return "\ufeff" + rows.map((row) => row.map(quote).join(",")).join("\n");
}
