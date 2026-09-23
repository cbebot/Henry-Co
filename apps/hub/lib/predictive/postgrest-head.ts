/**
 * V3-42 — pure helpers for reading PostgREST HEAD (count-only) responses.
 * Kept free of any client import so it is unit-testable in isolation.
 */

/**
 * Is this source genuinely ABSENT (not yet deployed), as opposed to broken?
 * A HEAD request has no body, and postgrest-js rewrites a body-less 404 to
 * `status: 204, error: null, count: null` (round 5, verified against the real
 * client) — a combination a successful count never produces, since a real
 * count always arrives in `content-range`. Error codes are honoured too for
 * transports that do carry a body. Anything else is BROKEN, and fails closed.
 */
export function isMissingRelation(
  error: { code?: string | null } | null,
  status: number | undefined,
  count: number | null | undefined,
): boolean {
  if (!error && (status === 404 || status === 204) && (count === null || count === undefined)) return true;
  const code = error?.code ?? "";
  return code === "42P01" || code === "PGRST205";
}
