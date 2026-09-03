import "server-only";

/**
 * Studio media adapter over @henryco/media (Supabase-first, a swappable seam).
 *
 * Sensitive studio files (brief references, project/portal message
 * attachments, support-ticket attachments) used to be DEFAULT (public)
 * Cloudinary uploads whose `secure_url` was persisted raw — publicly
 * dereferenceable by anyone holding the URL (an NDPA exposure). They now ride
 * the studio service-role client into the RLS-PRIVATE `studio-documents`
 * bucket and persist a backend-neutral `media://private/...` reference in place
 * of the URL. Reads are SIGNED server-side ({@link signStudioMediaUrl}); the
 * raw ref never reaches a client, and the storage vendor stays swappable.
 *
 * Backward compatible: rows written before this change hold absolute Cloudinary
 * URLs — {@link signStudioMediaUrl} passes those through unchanged, while new
 * rows (media:// private refs) are signed on demand.
 */

import {
  buildMediaRef,
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  type MediaValidationRule,
} from "@henryco/media";
import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * RLS-PRIVATE bucket for every sensitive studio file. There is no PUBLIC
 * studio bucket: brief references, message attachments, and support-ticket
 * attachments are all confidential/PII and must be signed-URL only.
 */
export const STUDIO_DOCUMENT_BUCKET = "studio-documents";

const MAX_DOCUMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB (matches the prior caps)

/**
 * Validation for general studio attachments (support tickets + project/portal
 * message files). Mirrors the prior ALLOWED_ATTACHMENT_TYPES / size cap.
 */
export const STUDIO_ATTACHMENT_RULE: MediaValidationRule = {
  maxBytes: MAX_DOCUMENT_FILE_BYTES,
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  invalidTypeMessage: "Upload images, PDF, TXT, or Word documents only.",
};

/**
 * Validation for brief reference files (intake). The legacy uploader accepted
 * any type; keep a generous superset but still cap the size so a private bucket
 * write is always bounded.
 */
export const STUDIO_REFERENCE_RULE: MediaValidationRule = {
  maxBytes: MAX_DOCUMENT_FILE_BYTES,
  invalidTypeMessage: "That file type can't be uploaded here.",
};

let bucketsEnsured = false;

async function ensureBucket(
  name: string,
  options: { public: boolean; fileSizeLimit?: string },
) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === name);

  if (!exists) {
    await admin.storage.createBucket(name, options);
  }
}

/**
 * Ensure the private studio-documents bucket exists. Cheap + idempotent; safe
 * to call before any sensitive upload. Swallows failures so local/dev setups
 * without a service-role key stay resilient (the upload itself then no-ops).
 */
export async function ensureStudioBuckets() {
  if (bucketsEnsured) return;
  try {
    await ensureBucket(STUDIO_DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: "10MB",
    });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup.
  }
}

/**
 * Fresh service-role client per call (repo convention: admin clients are not
 * module-cached), injected so the media layer never reads credentials itself.
 */
function getStudioMediaStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

function sanitizePathSegment(value: string): string {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "scoped"
  );
}

/**
 * Upload a sensitive studio file to the RLS-private bucket and return its
 * persisted `media://private/...` reference (stored in place of the old public
 * URL). `scope` becomes the folder prefix (lead/project/user id), keeping the
 * object key namespaced exactly as the old Cloudinary folder layout did.
 */
export async function uploadStudioDocument(
  scope: string,
  file: File,
  options?: { folder?: string; rule?: MediaValidationRule },
): Promise<string> {
  await ensureStudioBuckets();
  const folder = sanitizePathSegment(options?.folder ?? "documents");
  return getStudioMediaStore().upload({
    file,
    visibility: "private",
    bucket: STUDIO_DOCUMENT_BUCKET,
    pathPrefix: `${folder}/${sanitizePathSegment(scope)}`,
    rule: options?.rule ?? STUDIO_ATTACHMENT_RULE,
  });
}

/**
 * Resolve a stored media value for delivery to a client.
 *
 *  - `media://private/...` ref  -> a short-lived SIGNED Supabase URL.
 *  - absolute http(s) URL       -> passed through unchanged (legacy Cloudinary
 *                                  rows written before the migration).
 *  - anything else / failure    -> "" (filtered out by callers).
 *
 * MUST be called server-side (it can mint a signed URL); the raw private ref
 * is never sent to the browser. A signed Supabase URL is itself a normal
 * https URL, so it renders directly in <img src> / <a href> and passes the
 * /api/portal/download proxy's `.supabase.co` host allowlist.
 */
export async function signStudioMediaUrl(value: string): Promise<string> {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (isMediaRef(raw)) {
    try {
      const parsed = parseMediaRef(raw);
      if (parsed.visibility === "private") {
        return await getStudioMediaStore().signedUrl(raw);
      }
      // A public ref shouldn't occur in studio today, but resolve defensively.
      return await getStudioMediaStore().signedUrl(
        buildMediaRef({
          visibility: "private",
          bucket: parsed.bucket,
          key: parsed.key,
        }),
      );
    } catch {
      return "";
    }
  }

  // Legacy absolute URL (existing Cloudinary rows) — passthrough unchanged.
  return isAbsoluteUrl(raw) ? raw : "";
}

/** Batch helper: sign each `{ url }` attachment, dropping any that fail. */
export async function signStudioAttachments<
  T extends { url: string },
>(attachments: T[]): Promise<T[]> {
  return Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      url: await signStudioMediaUrl(attachment.url),
    })),
  );
}
