import { COMPANY, getTrustedAppHosts } from "./company";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function isTrustedHenryCoHost(hostname: string) {
  const normalizedHost = String(hostname || "").trim().toLowerCase();
  const baseDomain = String(COMPANY.group.baseDomain || "").trim().toLowerCase();

  if (!normalizedHost) return false;
  if (isLocalHost(normalizedHost)) return true;

  // Per-app override + live-Vercel-alias hosts the auth flow may
  // legitimately redirect to. Computed lazily from `company.ts` so a
  // V3-DOMAIN-01 base-domain flip or a Vercel project env var change
  // widens the allowlist automatically without touching this file.
  const appHosts = getTrustedAppHosts();
  if (appHosts.includes(normalizedHost)) return true;

  if (!baseDomain) return false;

  return normalizedHost === baseDomain || normalizedHost.endsWith(`.${baseDomain}`);
}

export function isAbsoluteHttpUrl(value?: string | null) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function normalizeTrustedRedirect(next?: string | null) {
  const value = String(next || "").trim();
  if (!value) return "/";

  /** Legacy / mistaken callers passed bare staff tokens instead of an absolute staff URL. */
  const token = value.toLowerCase();
  if (token === "staffhq" || token === "staff") {
    const base = String(COMPANY.group.baseDomain || "").trim().toLowerCase();
    return base ? `https://staff.${base}/` : "/";
  }

  if (value.startsWith("/")) {
    return value.startsWith("//") ? "/" : value;
  }

  if (!isAbsoluteHttpUrl(value)) {
    return "/";
  }

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "/";
    }

    if (!isTrustedHenryCoHost(url.hostname)) {
      return "/";
    }

    return `${url.origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function resolveTrustedRedirect(origin: string, next?: string | null) {
  const normalized = normalizeTrustedRedirect(next);
  return normalized.startsWith("/") ? new URL(normalized, origin).toString() : normalized;
}

/**
 * Resolve the PUBLIC origin a request actually arrived on, from proxy
 * headers — NOT from `request.url`.
 *
 * On Vercel, `request.url` inside a Route Handler can resolve to the
 * internal deployment URL (e.g. `henryco-account-tau.vercel.app`) rather
 * than the custom domain the user is browsing (`account.henryonyx.com`).
 * Building post-auth redirect targets from that internal origin bounces
 * the user onto the `*.vercel.app` host, where the `.<baseDomain>`-scoped
 * session cookie is NOT sent — so the dashboard sees no session and the
 * authenticated shell collapses into its error/login state.
 *
 * This reads `x-forwarded-host` (Vercel proxy) then `host`, with
 * `x-forwarded-proto` for the scheme, and only trusts a Henry Onyx host
 * (or localhost in dev). Anything untrusted falls back to the canonical
 * `https://<baseDomain>` so a spoofed Host header can never redirect a
 * freshly-authenticated user off-platform.
 */
export function resolveRequestOrigin(
  headerGet: (name: string) => string | null | undefined,
  fallbackOrigin?: string,
): string {
  const rawHost = headerGet("x-forwarded-host") || headerGet("host") || "";
  const host = String(rawHost).split(",")[0]!.trim().toLowerCase();
  const hostNoPort = host.replace(/:\d+$/, "");

  if (host && (isTrustedHenryCoHost(hostNoPort) || isLocalHost(hostNoPort))) {
    // Prefer the forwarded proto; otherwise infer from the fallback origin
    // (so localhost dev stays http) and finally default to https.
    const rawProto = headerGet("x-forwarded-proto");
    let proto = rawProto ? String(rawProto).split(",")[0]!.trim() : "";
    if (!proto && fallbackOrigin) {
      try {
        proto = new URL(fallbackOrigin).protocol.replace(/:$/, "");
      } catch {
        // ignore
      }
    }
    if (!proto) proto = isLocalHost(hostNoPort) ? "http" : "https";
    return `${proto}://${host}`;
  }

  if (fallbackOrigin) {
    try {
      const parsed = new URL(fallbackOrigin);
      if (isTrustedHenryCoHost(parsed.hostname) || isLocalHost(parsed.hostname)) {
        return parsed.origin;
      }
    } catch {
      // fall through to canonical
    }
  }

  const baseDomain = String(COMPANY.group.baseDomain || "").trim().toLowerCase();
  return baseDomain ? `https://${baseDomain}` : "https://henryonyx.com";
}
