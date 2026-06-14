/**
 * @henryco/media — delivery configuration (client-safe, no secrets).
 */

// Local ambient so the package typechecks in isolation (types: []) without
// pulling @types/node, which would clash with the DOM lib's global File/crypto.
declare const process: { env: Record<string, string | undefined> };

export const MEDIA_REF_SCHEME = "media://";

/**
 * Public delivery base URL for PUBLIC objects.
 *
 * Defaults to the Supabase project URL (`NEXT_PUBLIC_SUPABASE_URL`), but can be
 * overridden by `MEDIA_PUBLIC_BASE_URL` to front the public bucket behind a CDN
 * (e.g. Cloudflare) without changing any persisted reference. Returns "" when
 * nothing is configured; callers surface that rather than inventing a host.
 */
export function getPublicMediaBaseUrl(): string {
  const explicit = (process.env.MEDIA_PUBLIC_BASE_URL ?? "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  return supabase.replace(/\/+$/, "");
}
