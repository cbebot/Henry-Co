/**
 * V3-07(S2): Domain helper for HenryCo division URLs.
 *
 * Replaces hardcoded `henrycogroup.com` literals across `apps/` + `packages/`
 * with env-aware helpers that respect `NEXT_PUBLIC_BASE_DOMAIN`
 * (and, on the Expo `super-app`, `EXPO_PUBLIC_HENRYCO_ENV`).
 *
 * Thin wrappers over the existing `COMPANY` registry in `company.ts` —
 * this module exists so callers can opt into a single ergonomic API
 * (`henryDomain('care')`, `henryWebRoot()`) instead of reaching into
 * `COMPANY.divisions[...].subdomain` themselves.
 *
 * Why a new module rather than extending `company.ts` in place:
 *  - `company.ts` already ships several domain helpers (`getDivisionUrl`,
 *    `getHubUrl`, `getAccountUrl`, etc.) that ARE the canonical
 *    implementation. We re-export those + add `HenryDivision` typing
 *    + a `henrySubdomain(host, path)` escape hatch for sites that need
 *    a non-division subdomain (e.g. `hq.`, `staff.`, `files.`).
 *
 * Caller pattern:
 *
 *   import { henryDomain, henryWebRoot, henrySubdomain } from "@henryco/config";
 *
 *   const careHome = henryDomain("care");                // https://care.henrycogroup.com
 *   const careBook = henryDomain("care", "/book");       // https://care.henrycogroup.com/book
 *   const hub      = henryWebRoot();                     // https://henrycogroup.com
 *   const hubPath  = henryWebRoot("/terms");             // https://henrycogroup.com/terms
 *   const filesUrl = henrySubdomain("files");            // https://files.henrycogroup.com
 *
 * Tests: see __tests__/domain.test.mjs
 */

import { COMPANY, type DivisionKey } from "./company";

/**
 * Subset of `DivisionKey` that maps to a real `<sub>.henrycogroup.com` host.
 * Currently equal to `DivisionKey` itself — the only division without a
 * subdomain is `hub`, which still resolves to the bare base domain via
 * `getDivisionUrl`. Kept as a distinct type so future restrictions (e.g.
 * gating internal divisions) have a single place to land.
 */
export type HenryDivision = DivisionKey;

function normalizePath(path?: string | null) {
  const value = String(path || "").trim();
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
}

/**
 * Origin (no trailing slash) for the given division. `henryDomain('hub')`
 * returns the bare base domain; every other division uses its
 * `<subdomain>.<baseDomain>` host. Pass a `path` to get a fully-qualified
 * URL with that path appended.
 */
export function henryDomain(division: HenryDivision, path?: string): string {
  const config = COMPANY.divisions[division];
  if (!config) {
    // Defensive: TypeScript should prevent this, but keep runtime sane.
    return `https://${COMPANY.group.baseDomain}${normalizePath(path)}`;
  }
  const origin = config.subdomain
    ? `https://${config.subdomain}.${COMPANY.group.baseDomain}`
    : `https://${COMPANY.group.baseDomain}`;
  return `${origin}${normalizePath(path)}`;
}

/**
 * Public web root for Henry Onyx — `https://henrycogroup.com` (or whatever
 * `NEXT_PUBLIC_BASE_DOMAIN` resolves to). Pass a `path` to append.
 */
export function henryWebRoot(path?: string): string {
  return `https://${COMPANY.group.baseDomain}${normalizePath(path)}`;
}

/**
 * Escape hatch for non-division subdomains. Use for `hq.`, `staff.`,
 * `workspace.`, `files.`, `status.`, etc.
 *
 *   henrySubdomain("hq")          // https://hq.henrycogroup.com
 *   henrySubdomain("hq", "/owner")// https://hq.henrycogroup.com/owner
 */
export function henrySubdomain(host: string, path?: string): string {
  const cleanHost = String(host || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.+$/, "");
  if (!cleanHost) return henryWebRoot(path);
  return `https://${cleanHost}.${COMPANY.group.baseDomain}${normalizePath(path)}`;
}

/**
 * Bare host (no protocol, no path) for the division — useful when callers
 * need just `care.henrycogroup.com` for display or for a JSON-LD `url`
 * field that already concatenates `https://`.
 */
export function henryDomainHost(division: HenryDivision): string {
  const config = COMPANY.divisions[division];
  if (!config?.subdomain) return COMPANY.group.baseDomain;
  return `${config.subdomain}.${COMPANY.group.baseDomain}`;
}
