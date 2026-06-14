import "server-only";

import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";
import {
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  resolveMediaUrl,
  type MediaValidationRule,
} from "@henryco/media";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Account media adapter over @henryco/media (Supabase-first, vendor-swappable).
 *
 * Sensitive account documents (KYC identity docs, support-ticket attachments)
 * are persisted as backend-neutral `media://private/<bucket>/<key>` references
 * in the EXISTING url columns (customer_documents.file_url, the support
 * attachment `url` fields) — never a raw, publicly-dereferenceable URL. They
 * live in an RLS-PRIVATE bucket and are read ONLY through short-lived signed
 * URLs ({@link signAccountMediaUrl}, server-only). This closes the prior
 * default-public-Cloudinary exposure (V3-MEDIA-SWEEP-01) without changing any
 * data shape: the column type is unchanged, and legacy absolute URLs already in
 * the table pass through untouched, so the change is backward-compatible.
 */

/** RLS-PRIVATE bucket for sensitive account documents (signed-URL only). */
export const ACCOUNT_DOCUMENT_BUCKET = "account-documents";

let bucketsEnsured = false;

async function ensureBucket(name: string, options: { public: boolean; fileSizeLimit?: string }) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === name);
  if (!exists) {
    await admin.storage.createBucket(name, options);
  }
}

/**
 * Idempotently ensure the private document bucket exists. Mirrors property's
 * runtime bucket bootstrap (the privileged client owns creation); kept
 * resilient so a transient storage hiccup never blocks an upload attempt from
 * surfacing its real error.
 */
export async function ensureAccountBuckets() {
  if (bucketsEnsured) return;
  try {
    await ensureBucket(ACCOUNT_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "10MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient; the upload call surfaces any real failure.
  }
}

/** Validation for sensitive account documents (KYC + support attachments). */
export const ACCOUNT_DOCUMENT_RULE: MediaValidationRule = {
  maxBytes: 10 * 1024 * 1024,
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
  ],
  invalidTypeMessage: "Upload a JPG, PNG, WebP, PDF, or TXT file.",
};

function getAccountMediaStore(): MediaStore {
  // Fresh service-role client per call (repo convention: admin clients are not
  // module-cached), injected so the media layer never reads credentials itself.
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

/**
 * Upload a sensitive account document to the RLS-private bucket and return its
 * `media://private/...` reference (persist this in place of a raw URL).
 */
export async function uploadAccountDocument(
  pathPrefix: string,
  file: File,
  rule: MediaValidationRule = ACCOUNT_DOCUMENT_RULE,
): Promise<string> {
  await ensureAccountBuckets();
  return getAccountMediaStore().upload({
    file,
    visibility: "private",
    bucket: ACCOUNT_DOCUMENT_BUCKET,
    pathPrefix,
    rule,
  });
}

/**
 * Resolve a stored media value to a URL safe to hand to a client.
 *
 * - `media://private/...` → a short-lived SIGNED URL (server-only).
 * - `media://public/...`  → the deterministic public delivery URL.
 * - a legacy absolute URL (existing Cloudinary/Supabase rows) → passed through.
 * - anything malformed/empty → "" (callers filter/guard).
 *
 * Server-only: signing requires the privileged client. Never expose a private
 * `media://` ref directly to a browser — `resolveMediaUrl` throws on it by
 * design, so an un-signed private ref would break the render.
 */
export async function signAccountMediaUrl(value: string, ttlSeconds = 3600): Promise<string> {
  if (!value) return "";
  if (isMediaRef(value)) {
    try {
      if (parseMediaRef(value).visibility === "private") {
        return await getAccountMediaStore().signedUrl(value, ttlSeconds);
      }
      return resolveMediaUrl(value);
    } catch {
      return "";
    }
  }
  return isAbsoluteUrl(value) ? value : "";
}

/** True when the stored value is a private `media://` reference (needs signing). */
export function isPrivateMediaRef(value: string): boolean {
  return isMediaRef(value) && (() => {
    try {
      return parseMediaRef(value).visibility === "private";
    } catch {
      return false;
    }
  })();
}
