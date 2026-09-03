/**
 * Lightweight formatting helpers for the studio module's widgets.
 * Mirrors `packages/dashboard-modules-marketplace/src/format.ts` so each
 * module package stays self-contained. The studio home widgets surface
 * counts rather than money, so the helpers here are count-oriented.
 */

/**
 * Pluralize a labelled count — `pluralize(1, "active project")` →
 * "1 active project"; `pluralize(3, "active project")` →
 * "3 active projects". Pass an explicit plural when the noun is
 * irregular.
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Title-case status enum values (`ready_for_review` → `Ready For Review`).
 * Mirrors the marketplace helper of the same name.
 */
export function titleCaseStatus(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
