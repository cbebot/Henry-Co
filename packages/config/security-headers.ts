// Shared security headers for HenryCo apps.
//
// Wired into each app via next.config.ts headers().
// CSP is intentionally DEFERRED until a report-only pass can be soaked
// against Vercel/Supabase/Cloudinary/Brevo/Sentry without breakage.

export type SecurityHeader = { key: string; value: string };

export type SecurityHeaderOptions = {
  /**
   * Apps that intentionally allow embedding (none today). When omitted, the
   * response sets X-Frame-Options: DENY and frame-ancestors 'none'.
   */
  allowFraming?: boolean;
  /**
   * Per-app Permissions-Policy delta. Keys map to the policy directive,
   * values to the allowlist string. The defaults are camera=(), microphone=(),
   * geolocation=(), interest-cohort=(), browsing-topics=(), payment=().
   * Pass `geolocation: "(self)"` to enable a feature in a specific app.
   */
  permissions?: Record<string, string>;
};

const DEFAULT_PERMISSIONS: Record<string, string> = {
  camera: "()",
  microphone: "()",
  geolocation: "()",
  "interest-cohort": "()",
  "browsing-topics": "()",
  payment: "()",
};

export function buildSecurityHeaders(options: SecurityHeaderOptions = {}): SecurityHeader[] {
  const allowFraming = Boolean(options.allowFraming);
  const permissions = { ...DEFAULT_PERMISSIONS, ...(options.permissions ?? {}) };

  const permissionsPolicy = Object.entries(permissions)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  const headers: SecurityHeader[] = [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Permissions-Policy",
      value: permissionsPolicy,
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
  ];

  if (!allowFraming) {
    headers.push(
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    );
  }

  return headers;
}

/**
 * Convenience for next.config.ts:
 *
 *   async headers() {
 *     return [{ source: "/:path*", headers: buildSecurityHeaders() }];
 *   }
 */
export function defaultSecurityHeadersConfig(options?: SecurityHeaderOptions) {
  return [
    {
      source: "/:path*",
      headers: buildSecurityHeaders(options),
    },
  ];
}
