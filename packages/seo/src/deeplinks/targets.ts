/**
 * V3-04 (S4) — Typed deep-link target catalog.
 *
 * Every deep-link target type HenryCo sends in a notification, email, or
 * share link is modelled here as a `(input) -> canonical absolute URL`
 * builder. Callers MUST use these instead of string-concatenating
 * `https://<sub>.<domain>/...` so that:
 *
 *   - The domain is NEVER hardcoded. Every URL is derived from
 *     `@henryco/config` (`getAbsoluteDivisionUrl` / `getAccountUrl`),
 *     which resolve through `NEXT_PUBLIC_BASE_DOMAIN` /
 *     `henryDomain()`. A V3-DOMAIN-01 base-domain flip re-points every
 *     deep link with zero edits here.
 *   - Each builder produces a canonical, crawlable, https origin with the
 *     correct division subdomain.
 *   - The mobile-app universal-link variant is identical to the web URL
 *     (HenryCo uses native iOS Universal Links / Android App Links per
 *     S2, NOT a separate scheme), so `webUrl === appUrl` for every target
 *     whose path the Expo apps intercept. `buildAppLink` is exposed so
 *     callers that want the explicitly-mobile intent can document it.
 *
 * NOTE ON `account` vs divisions: the account app is NOT a `DivisionKey`
 * (it has no row in `COMPANY.divisions`); its origin is resolved by
 * `getAccountUrl` which honours `NEXT_PUBLIC_ACCOUNT_URL` + the live
 * Vercel-alias fallback. Care/marketplace/jobs/etc. are real divisions
 * resolved by `getAbsoluteDivisionUrl`.
 */

import {
  getAbsoluteDivisionUrl,
  getAccountUrl,
  type DivisionKey,
} from "@henryco/config";

/** Canonical division origins a deep link can target. */
export type DeepLinkDivision = Extract<
  DivisionKey,
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "studio"
  | "jobs"
  | "learn"
  | "hub"
>;

function normalizePath(path: string): string {
  const value = String(path || "").trim();
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

/**
 * Canonical absolute URL on a division subdomain. Thin wrapper over
 * `getAbsoluteDivisionUrl` so the deeplinks module has a single internal
 * choke-point (and so a future change — e.g. forcing trailing-slash
 * normalisation — lands in one place).
 */
export function divisionUrl(division: DeepLinkDivision, path: string): string {
  return getAbsoluteDivisionUrl(division, normalizePath(path));
}

/** Canonical absolute URL on the account (SSO root) app. */
export function accountUrl(path: string): string {
  return getAccountUrl(normalizePath(path));
}

/**
 * Encode an opaque/path-safe id segment. Deep-link ids are surfaced in
 * URLs; this guards against a caller passing a value with a stray `/`
 * or query char that would break the route. It does NOT obscure the id —
 * ANTI-CLONE opacity for sensitive references (KYC docs) is the caller's
 * responsibility (pass an already-tokenised value).
 */
export function encodeIdSegment(id: string | number): string {
  return encodeURIComponent(String(id).trim());
}
