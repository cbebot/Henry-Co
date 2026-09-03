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
import { MARKETPLACE_IMAGE_BUCKET, MARKETPLACE_IMAGE_RULE } from "@/lib/marketplace/media-image";

/**
 * Marketplace media adapter over @henryco/media (Supabase-first, vendor-swappable).
 *
 * Sensitive seller-application documents (founder/KYC identity, business
 * registration, payout-account proof) are persisted as backend-neutral
 * `media://private/<bucket>/<key>` references in the EXISTING columns/fields
 * (customer_documents.file_url and the marketplace_vendor_applications
 * documents_json/draft_payload `fileUrl`) — never a raw, publicly-dereferenceable
 * CDN URL. They live in an RLS-PRIVATE bucket and are read ONLY through
 * short-lived signed URLs ({@link signMarketplaceMediaUrl}, server-only). This
 * closes the prior default-public-Cloudinary exposure (V3-MEDIA-SWEEP-01)
 * without changing any data shape: the column/field types are unchanged, and
 * legacy absolute URLs already in the table pass through untouched, so the
 * change is backward-compatible.
 *
 * Scope note: the marketplace checkout bank-transfer payment-proof flow is the
 * FROZEN money path and is deliberately NOT touched here.
 */

/** RLS-PRIVATE bucket for sensitive marketplace documents (signed-URL only). */
export const MARKETPLACE_DOCUMENT_BUCKET = "marketplace-documents";

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
export async function ensureMarketplaceBuckets() {
  if (bucketsEnsured) return;
  try {
    await ensureBucket(MARKETPLACE_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "10MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient; the upload call surfaces any real failure.
  }
}

/** Validation for sensitive seller-application documents. */
export const MARKETPLACE_DOCUMENT_RULE: MediaValidationRule = {
  maxBytes: 10 * 1024 * 1024,
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  invalidTypeMessage: "Upload a JPG, PNG, WebP, or PDF file.",
};

function getMarketplaceMediaStore(): MediaStore {
  // Fresh service-role client per call (repo convention: admin clients are not
  // module-cached), injected so the media layer never reads credentials itself.
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

let imageBucketEnsured = false;

/** Idempotently ensure the PUBLIC image bucket exists (product photos, store branding). */
export async function ensureMarketplaceImageBucket() {
  if (imageBucketEnsured) return;
  try {
    await ensureBucket(MARKETPLACE_IMAGE_BUCKET, { public: true, fileSizeLimit: "8MB" });
    imageBucketEnsured = true;
  } catch {
    // Keep runtime resilient; the upload call surfaces any real failure.
  }
}

/**
 * Upload a buyer-visible image (product photo, store hero/logo) to the PUBLIC bucket and
 * return its `media://public/...` reference — it drops into the existing string url
 * columns unchanged, and `resolveMarketplaceImageUrl` renders it at the read boundary.
 */
export async function uploadMarketplaceImage(pathPrefix: string, file: File): Promise<string> {
  await ensureMarketplaceImageBucket();
  return getMarketplaceMediaStore().upload({
    file,
    visibility: "public",
    bucket: MARKETPLACE_IMAGE_BUCKET,
    pathPrefix,
    rule: MARKETPLACE_IMAGE_RULE,
  });
}

/**
 * Upload a sensitive seller-application document to the RLS-private bucket and
 * return its `media://private/...` reference (persist this in place of a raw URL).
 */
export async function uploadMarketplaceDocument(
  pathPrefix: string,
  file: File,
  rule: MediaValidationRule = MARKETPLACE_DOCUMENT_RULE,
): Promise<string> {
  await ensureMarketplaceBuckets();
  return getMarketplaceMediaStore().upload({
    file,
    visibility: "private",
    bucket: MARKETPLACE_DOCUMENT_BUCKET,
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
export async function signMarketplaceMediaUrl(value: string, ttlSeconds = 3600): Promise<string> {
  if (!value) return "";
  if (isMediaRef(value)) {
    try {
      if (parseMediaRef(value).visibility === "private") {
        return await getMarketplaceMediaStore().signedUrl(value, ttlSeconds);
      }
      return resolveMediaUrl(value);
    } catch {
      return "";
    }
  }
  return isAbsoluteUrl(value) ? value : "";
}

/** True when the stored value is a private `media://` reference (needs signing). */
export function isPrivateMarketplaceMediaRef(value: string): boolean {
  return isMediaRef(value) && (() => {
    try {
      return parseMediaRef(value).visibility === "private";
    } catch {
      return false;
    }
  })();
}
