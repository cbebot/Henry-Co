import "server-only";

import {
  createSupabaseMediaStore,
  type MediaStore,
} from "@henryco/media/server";
import { isAbsoluteUrl, isMediaRef, parseMediaRef } from "@henryco/media";

import { createAdminSupabase } from "@/lib/supabase";
import {
  CARE_DOCUMENT_BUCKET,
  CARE_IMAGE_RULE,
  CARE_MEDIA_BUCKET,
  CARE_RECEIPT_RULE,
} from "@/lib/care-media";

/**
 * Care media store (server-only).
 *
 * Mirrors `apps/property/lib/property/store.ts`. Sensitive care media moves OFF
 * the public CDN onto @henryco/media RLS-private signed-URL storage:
 *  - claim evidence photos       -> care_claims.evidence_urls
 *  - customer payment-proof       -> care_payment_requests payload receipt
 *                                    submissions[].attachments[].url
 *  - staff/owner expense receipts -> care_expenses.receipt_url
 *
 * Each upload returns a backend-neutral `media://private/<bucket>/<key>`
 * reference persisted in place of the old public URL. Reads resolve the ref to
 * a short-lived signed URL via {@link signCareMediaUrl}. Legacy rows hold
 * absolute (Cloudinary) URLs and pass through the signer unchanged, so this is
 * fully backward compatible.
 */

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
 * Ensure the care media buckets exist. The PRIVATE `care-documents` bucket
 * backs every sensitive flow; the PUBLIC `care-media` bucket is provisioned for
 * parity with the property pattern (public flows are unaffected today).
 */
export async function ensureCareMediaBuckets() {
  if (bucketsEnsured) return;

  try {
    await ensureBucket(CARE_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "50MB" });
    await ensureBucket(CARE_MEDIA_BUCKET, { public: true, fileSizeLimit: "50MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup / when storage is unavailable.
  }
}

/**
 * Fresh service-role client per call (repo convention: admin clients are not
 * module-cached), injected so the media layer never reads credentials itself.
 */
function getCareMediaStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

/**
 * Upload a SENSITIVE claim-evidence image to the RLS-private bucket and return
 * a `media://private/...` reference. Enforces the same JPG/PNG/WebP + 8MB cap
 * the legacy image helper applied.
 */
export async function uploadCareClaimEvidence(
  file: File,
  pathPrefix: string,
): Promise<string> {
  await ensureCareMediaBuckets();
  return getCareMediaStore().upload({
    file,
    visibility: "private",
    bucket: CARE_DOCUMENT_BUCKET,
    pathPrefix: `claims/${pathPrefix || "claim"}`,
    rule: CARE_IMAGE_RULE,
  });
}

/**
 * Upload a SENSITIVE payment-proof receipt (image or PDF) to the RLS-private
 * bucket and return a `media://private/...` reference. Enforces the same
 * image/PDF + 10MB cap the legacy receipt helper applied.
 */
export async function uploadCarePaymentReceipt(
  file: File,
  pathPrefix: string,
): Promise<string> {
  await ensureCareMediaBuckets();
  return getCareMediaStore().upload({
    file,
    visibility: "private",
    bucket: CARE_DOCUMENT_BUCKET,
    pathPrefix: `payment-receipts/${pathPrefix || "receipt"}`,
    rule: CARE_RECEIPT_RULE,
  });
}

/**
 * Upload a SENSITIVE staff/owner expense receipt image to the RLS-private
 * bucket and return a `media://private/...` reference. Enforces the same
 * JPG/PNG/WebP + 8MB cap the legacy image helper applied.
 */
export async function uploadCareExpenseReceipt(
  file: File,
  pathPrefix: string,
): Promise<string> {
  await ensureCareMediaBuckets();
  return getCareMediaStore().upload({
    file,
    visibility: "private",
    bucket: CARE_DOCUMENT_BUCKET,
    pathPrefix: `expenses/${pathPrefix || "expense"}`,
    rule: CARE_IMAGE_RULE,
  });
}

/**
 * Resolve a stored media value to a renderable delivery URL for SENSITIVE
 * reads. Backward compatible:
 *  - a `media://private/...` ref  -> a short-lived signed URL (must be server-side)
 *  - a legacy absolute URL        -> passthrough (unchanged)
 *  - anything else (incl. a `media://public/...` ref) -> resolved/empty
 *
 * Never throws into a render: signing failures degrade to "" so a missing
 * object renders as an empty source rather than a 500.
 */
export async function signCareMediaUrl(
  value: string | null | undefined,
): Promise<string> {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (isMediaRef(raw)) {
    try {
      const { visibility } = parseMediaRef(raw);
      if (visibility === "private") {
        return await getCareMediaStore().signedUrl(raw);
      }
      // A public ref can be resolved without signing.
      const { resolveMediaUrl } = await import("@henryco/media");
      return resolveMediaUrl(raw);
    } catch {
      return "";
    }
  }

  // Legacy absolute (e.g. Cloudinary) URL — passthrough unchanged.
  return isAbsoluteUrl(raw) ? raw : "";
}
