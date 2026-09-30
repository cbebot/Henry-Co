/**
 * V3-STAFF-SELFGRANT-FIX-01 — the ONE server-side HMAC secret for care's owner-authority
 * tokens: the signed owner-action form fields and the sealed impersonation session.
 *
 * Server-only environment variables ONLY. The previous chain fell back to
 * NEXT_PUBLIC_SUPABASE_ANON_KEY — a PUBLIC value shipped in every browser bundle — and
 * then to a hard-coded string, so on any deployment missing the server-only secrets a
 * visitor could have minted a valid owner signature. An empty string means "not
 * configured" and every caller must fail closed on it.
 */
export function careServerSigningSecret(): string {
  return process.env.OWNER_ACTION_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
