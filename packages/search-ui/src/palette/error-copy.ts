/**
 * Palette error copy — maps raw fetch error strings produced by the
 * palette's three data hooks (commands / suggestions / search) into
 * single-line user-facing copy.
 *
 * Lives in its own file so the mapping can be unit-tested without
 * importing React. The DashboardCommandPalette's PaletteErrorBanner
 * imports humaniseError() at render time.
 *
 * Inputs come from `Error.message`. Common shapes:
 *   - "commands: 503" / "suggestions: 401" / "Search failed: 429"
 *   - "Failed to fetch" / "NetworkError when attempting to fetch"
 *   - AbortError (filtered upstream — should not reach this fn)
 *   - Anything else falls through to a calm generic message.
 *
 * Copy contract:
 *   - One sentence, ≤ 60 chars where possible.
 *   - Verb-first imperative ("Check…", "Refresh…").
 *   - No exclamation marks (anti-pattern: shouty UI).
 *   - No raw status codes leaked to the user.
 */

export function humaniseError(raw: string): string {
  if (!raw) return "Try again in a moment.";
  if (/abort/i.test(raw)) return "Cancelled. Try again.";
  if (/network|failed to fetch/i.test(raw))
    return "Check your connection, then retry.";
  const status = raw.match(/(\d{3})/)?.[1];
  if (status === "401" || status === "403")
    return "Your session expired. Refresh the page.";
  if (status === "429") return "Too many searches — slow down a moment.";
  if (status?.startsWith("5")) return "Our search service is reconnecting.";
  return "Try again in a moment.";
}
