/**
 * PROD-READY-01: Domain-agnostic URL helper for the Expo super-app.
 *
 * Mirrors the Next.js-side `henryDomain()` / `henryDomainHost()` API from
 * `@henryco/config` (which Expo cannot import — that package is React/Next-only).
 * Reads `EXPO_PUBLIC_BASE_DOMAIN` so the company can rename the brand TLD
 * without a code change. Falls back to `henrycogroup.com` so the existing
 * staging + production behaviour is preserved when the env var is unset.
 *
 * Caller pattern:
 *
 *   import { henryDivisionUrl, henryWebOrigin, henryAppDomain } from "@/core/domain";
 *
 *   const care = henryDivisionUrl("care");        // https://care.henrycogroup.com
 *   const home = henryWebOrigin();                // https://www.henrycogroup.com
 *   const host = henryAppDomain();                // henrycogroup.com (bare)
 */

const FALLBACK_BASE_DOMAIN = "henrycogroup.com";

function cleanHost(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.+$/, "")
    .replace(/^\.+/, "");
}

/**
 * Bare base domain for HenryCo (e.g. `henrycogroup.com`).
 * Reads `EXPO_PUBLIC_BASE_DOMAIN`, falls back to the canonical TLD.
 */
export function henryAppDomain(): string {
  const raw = process.env.EXPO_PUBLIC_BASE_DOMAIN;
  const clean = cleanHost(raw || "");
  return clean || FALLBACK_BASE_DOMAIN;
}

function normalizePath(path?: string | null): string {
  const value = String(path || "").trim();
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
}

/**
 * Origin (no trailing slash) for the given division subdomain.
 * Pass a `path` to append a route. Empty / unknown slug returns the bare
 * web origin so callers never construct an obviously-broken URL.
 *
 *   henryDivisionUrl("care")          // https://care.henrycogroup.com
 *   henryDivisionUrl("care", "/book") // https://care.henrycogroup.com/book
 */
export function henryDivisionUrl(subdomain: string, path?: string): string {
  const host = cleanHost(subdomain);
  if (!host) return henryWebOrigin(path);
  return `https://${host}.${henryAppDomain()}${normalizePath(path)}`;
}

/**
 * Marketing-facing web origin (`https://www.<basedomain>`).
 * This is what the Expo apps embed as `WEB_ORIGIN` for cross-platform deep
 * linking back to the website.
 */
export function henryWebOrigin(path?: string): string {
  return `https://www.${henryAppDomain()}${normalizePath(path)}`;
}

/**
 * Bare host (no protocol, no path) for the division subdomain.
 * Useful for display copy and JSON-LD shapes.
 */
export function henryDivisionHost(subdomain: string): string {
  const host = cleanHost(subdomain);
  if (!host) return henryAppDomain();
  return `${host}.${henryAppDomain()}`;
}
