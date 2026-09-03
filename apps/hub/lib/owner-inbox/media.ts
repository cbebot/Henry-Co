import "server-only";

import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";
import { createAdminSupabase } from "@/lib/supabase";
import { ATTACHMENT_SIGNED_URL_TTL, OWNER_INBOX_ATTACHMENT_BUCKET } from "./constants";

/**
 * Server-only media helper for owner-inbox attachments. Uploads go to the
 * RLS-PRIVATE `owner-inbox-attachments` bucket and are read only via
 * short-lived signed URLs (service-role). Mirrors the property/care pattern:
 * the package never reads credentials; we inject a fresh service-role client.
 */

function getStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

// Content types the browser would RENDER inline (active content). A malicious
// sender could attach .html/.svg to phish from the trusted storage origin, so we
// store these as octet-stream — the browser downloads rather than executes them.
const ACTIVE_RENDERABLE = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/xml",
  "text/xml",
  "application/xslt+xml",
]);

function safeStoredContentType(contentType: string | null): string {
  const v = (contentType ?? "").toLowerCase().split(";")[0]?.trim() ?? "";
  if (!v) return "application/octet-stream";
  return ACTIVE_RENDERABLE.has(v) ? "application/octet-stream" : v;
}

let bucketEnsured = false;

/** Idempotently ensure the private attachments bucket exists (runtime fallback
 *  for environments where the migration's bucket insert has not been applied). */
export async function ensureInboxBucket(): Promise<void> {
  if (bucketEnsured) return;
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((b) => b.name === OWNER_INBOX_ATTACHMENT_BUCKET);
  if (!exists) {
    await admin.storage.createBucket(OWNER_INBOX_ATTACHMENT_BUCKET, {
      public: false,
      fileSizeLimit: 26214400, // 25 MiB — parity with the migration's bucket config
    });
  }
  bucketEnsured = true;
}

export async function uploadInboxAttachment(input: {
  emailId: string;
  filename: string;
  contentType: string | null;
  bytes: Uint8Array;
}): Promise<string> {
  await ensureInboxBucket();
  // Copy into a fresh ArrayBuffer-backed view so the File constructor accepts it
  // (Buffer is Uint8Array<ArrayBufferLike>, not the BlobPart-compatible variant).
  const file = new File([new Uint8Array(input.bytes)], input.filename || "attachment", {
    type: safeStoredContentType(input.contentType),
  });
  return getStore().upload({
    file,
    visibility: "private",
    bucket: OWNER_INBOX_ATTACHMENT_BUCKET,
    pathPrefix: `messages/${input.emailId}`,
  });
}

/** Sign a private attachment ref for owner viewing. Never throws into render. */
export async function signInboxAttachment(ref: string | null | undefined): Promise<string | null> {
  const raw = String(ref ?? "").trim();
  if (!raw) return null;
  try {
    return await getStore().signedUrl(raw, ATTACHMENT_SIGNED_URL_TTL);
  } catch {
    return null;
  }
}
