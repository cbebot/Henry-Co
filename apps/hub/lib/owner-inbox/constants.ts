/** Owner inbox shared constants. */

/** Private Supabase storage bucket for inbound attachments (RLS-private). */
export const OWNER_INBOX_ATTACHMENT_BUCKET = "owner-inbox-attachments";

/** Env var holding the shared HMAC secret (must match the Cloudflare Worker). */
export const INBOUND_EMAIL_WEBHOOK_SECRET_ENV = "INBOUND_EMAIL_WEBHOOK_SECRET";

/** Signed-URL lifetime for attachment downloads in the owner UI (seconds). */
export const ATTACHMENT_SIGNED_URL_TTL = 60 * 10;
