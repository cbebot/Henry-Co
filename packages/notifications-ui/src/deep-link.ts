/**
 * Client-side deep-link guard. Mirrors @henryco/notifications/validate-shared
 * isSafeDeepLink but operates on already-stored values without pulling the
 * server-only publisher dep.
 *
 * Accepts:
 *   - same-origin relative paths starting with a single '/' (not '//'),
 *     no backslash, no HTML-significant characters
 *   - absolute https/http URLs whose hostname matches a HenryCo TLD suffix,
 *     with no userinfo
 *
 * Rejects everything else: javascript:, data:, mailto:, //evil.com,
 * https://evil.com, paths containing <, >, ", or backslashes.
 */

const HENRYCO_HOST_SUFFIXES = ["henrycogroup.com", "henryco.local"] as const;
const MAX_LEN = 1024;

export function isSafeNotificationDeepLink(
  value: string | null | undefined,
): boolean {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_LEN) return false;

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return false;
    if (trimmed.includes("\\")) return false;
    if (trimmed.includes("<") || trimmed.includes(">") || trimmed.includes('"')) {
      return false;
    }
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  for (const suffix of HENRYCO_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}
