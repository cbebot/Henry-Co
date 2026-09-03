/**
 * STU-b — exact-host allowlist for the portal download proxy.
 *
 * The proxy fetches a remote file server-side and re-streams it to the
 * client. To keep it from being used as an open proxy / SSRF primitive,
 * the remote URL must be https and its host must be one of these PINNED
 * hosts. There is deliberately NO broad suffix matching (e.g. matching
 * any `*.cloudinary.com` / `*.supabase.co`): a suffix check lets an
 * attacker-controlled subdomain — or a look-alike apex like
 * `res.cloudinary.com.evil.com` — slip past the guard.
 */
export const ALLOWED_DOWNLOAD_HOSTS = new Set<string>([
  "res.cloudinary.com",
  "rzkbgwuznmdxnnhmjazy.supabase.co",
]);

export function isAllowedRemoteUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "non_https" };
  }
  const host = parsed.hostname.toLowerCase();
  if (ALLOWED_DOWNLOAD_HOSTS.has(host)) {
    return { ok: true, url: parsed };
  }
  return { ok: false, reason: "host_not_allowed" };
}
