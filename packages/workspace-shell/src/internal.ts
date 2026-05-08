import type { WorkspaceNavItem } from "./types";

/**
 * Match the current request pathname against a nav item. The active
 * rule is intentionally simple:
 *
 *   1. Exact match wins (eg. /candidate is active on /candidate exactly)
 *   2. matchPrefix wins for sub-routes (eg. /candidate/applications/123
 *      activates /candidate/applications when matchPrefix is set)
 *
 * Hosts can opt into prefix matching by setting `matchPrefix` on the
 * nav item; without it, only exact matches activate.
 */
export function isNavActive(pathname: string, item: WorkspaceNavItem): boolean {
  if (pathname === item.href) return true;
  if (item.matchPrefix && pathname.startsWith(`${item.matchPrefix}/`)) return true;
  return false;
}

/**
 * Check whether the current request is inside any takeover prefix.
 * Takeover routes opt out of the standard chrome and render full-bleed
 * (eg. studio's /client/messages inbox).
 */
export function isTakeoverPath(pathname: string, prefixes: string[] = []): boolean {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
