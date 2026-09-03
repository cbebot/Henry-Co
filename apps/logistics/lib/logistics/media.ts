import "server-only";

import {
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  type MediaValidationRule,
} from "@henryco/media";
import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Logistics media adapter over @henryco/media (Supabase-first, a swappable
 * seam). Sensitive proof-of-delivery (POD) photos and claim evidence are
 * persisted as backend-neutral `media://` references — NOT raw public CDN
 * URLs — so the storage vendor stays swappable and the asset never rides a
 * publicly-dereferenceable URL.
 *
 *  - POD photos / signatures + claim evidence -> the RLS-PRIVATE
 *    `logistics-documents` bucket (signed-URL only, never a public CDN).
 *
 * This replaces the previous client-side Cloudinary default (public) upload:
 * a default Cloudinary `secure_url` is dereferenceable by anyone with the URL
 * and bypasses the row-level RLS on logistics_pod_records / logistics_claims.
 * NDPA-sensitive media (recipient face/doorstep, claim photos) now lives
 * behind signed reads.
 */

export const LOGISTICS_DOCUMENT_BUCKET = "logistics-documents";

/**
 * Validation for sensitive POD / claim media (uploaded to the RLS-private
 * bucket). Mirrors the photo/document constraints the prior flow accepted
 * (camera images), with a conservative size ceiling.
 */
export const LOGISTICS_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024; // 25MB
export const LOGISTICS_DOCUMENT_RULE: MediaValidationRule = {
  maxBytes: LOGISTICS_DOCUMENT_MAX_BYTES,
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
  ],
  invalidTypeMessage: "Please upload a JPG, PNG, WebP, HEIC image, or PDF.",
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

export async function ensureLogisticsBuckets() {
  if (bucketsEnsured) return;

  try {
    await ensureBucket(LOGISTICS_DOCUMENT_BUCKET, {
      public: false,
      fileSizeLimit: "25MB",
    });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup / preview envs.
  }
}

/**
 * Fresh service-role client per call (repo convention: admin clients are not
 * module-cached), injected so the media layer never reads credentials itself
 * and always rides the logistics service-role factory path.
 */
function getLogisticsMediaStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

/**
 * Upload a SENSITIVE logistics document (POD photo/signature, claim evidence)
 * to the RLS-private bucket and return a persisted `media://` reference STRING
 * to store in place of a public URL.
 */
export async function uploadLogisticsDocument(
  entityId: string,
  file: File,
  pathSegment = "documents",
): Promise<string> {
  await ensureLogisticsBuckets();
  const safeEntity =
    String(entityId ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "record";
  return getLogisticsMediaStore().upload({
    file,
    visibility: "private",
    bucket: LOGISTICS_DOCUMENT_BUCKET,
    pathPrefix: `${pathSegment}/${safeEntity}`,
    rule: LOGISTICS_DOCUMENT_RULE,
  });
}

/**
 * Resolve a stored sensitive media value to a short-lived signed delivery URL,
 * SERVER-SIDE ONLY, before it is sent to any client.
 *
 * Backward compatible by design:
 *   - new rows are `media://private/...` refs   -> signed URL (TTL-limited)
 *   - legacy rows are absolute Cloudinary URLs   -> passthrough (unchanged)
 *   - anything else / empty                      -> "" (filtered by callers)
 *
 * NEVER call `resolveMediaUrl` on these values: it THROWS on a private ref.
 */
export async function signLogisticsMediaUrl(value: string): Promise<string> {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (isMediaRef(raw)) {
    try {
      const { visibility } = parseMediaRef(raw);
      if (visibility === "private") {
        return await getLogisticsMediaStore().signedUrl(raw);
      }
      // Public refs are not used by logistics today, but resolve defensively
      // to a signed URL too rather than leaking a raw path.
      return await getLogisticsMediaStore().signedUrl(raw);
    } catch {
      return "";
    }
  }
  if (isAbsoluteUrl(raw)) return raw; // legacy Cloudinary URL passthrough
  return "";
}

/**
 * Sign an array of sensitive media values (e.g. claim `evidence_urls`),
 * dropping any that cannot be resolved. Server-only.
 */
export async function signLogisticsMediaUrls(
  values: readonly string[] | null | undefined,
): Promise<string[]> {
  if (!Array.isArray(values) || values.length === 0) return [];
  const signed = await Promise.all(
    values.map((value) => signLogisticsMediaUrl(String(value ?? ""))),
  );
  return signed.filter(Boolean);
}
