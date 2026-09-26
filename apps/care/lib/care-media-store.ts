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
 *
 * Signing runs on the service role, which bypasses storage RLS, and a ref names
 * its own bucket and key. So the signers here only ever sign refs this module
 * could have minted (V3-CARE-JOBS-PREAPPLY-FIX-01):
 *  - claim evidence is signed only by {@link signCareClaimEvidenceForOwner},
 *    and only for the user whose id the object key is bound to;
 *  - {@link signCareMediaUrl} signs payment and expense receipts only, and only
 *    in the care-documents bucket under a traversal-safe key.
 */

let bucketsEnsured = false;

/**
 * Claim evidence lives under `claims/<claimant user id>/`. The id segment is
 * the full auth user id from the session at upload time, never a request value;
 * it is the ownership proof the evidence signer checks.
 */
const CLAIM_EVIDENCE_PREFIX = "claims";

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A claim-evidence ref exactly as {@link uploadCareClaimEvidence} mints it:
 * `media://private/care-documents/claims/<user id>/<object>`. The object name
 * follows the grammar of `@henryco/media`'s `buildObjectKey` (a UUID fragment,
 * then the sanitized file name with an optional extension), so a matching ref
 * cannot carry another `/`, a dot segment, whitespace or an escape sequence.
 */
const CLAIM_EVIDENCE_REF = new RegExp(
  `^media://private/${escapeRegExp(CARE_DOCUMENT_BUCKET)}/${CLAIM_EVIDENCE_PREFIX}/` +
    "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/" +
    "[a-z0-9-]{1,12}-[a-z0-9-]{1,48}(?:\\.[a-z0-9]{1,8})?$",
);

/**
 * Top-level key prefixes {@link signCareMediaUrl} may sign in the private
 * bucket. Claim evidence is deliberately absent: it is signed only through the
 * owner-bound {@link signCareClaimEvidenceForOwner}.
 */
const RECEIPT_KEY_PREFIXES = new Set(["payment-receipts", "expenses"]);

/**
 * The owner id a stored claim-evidence value is bound to, or null when the
 * value is not a well-formed claim-evidence ref.
 */
export function claimEvidenceOwner(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = CLAIM_EVIDENCE_REF.exec(value);
  return match ? match[1] : null;
}

/**
 * True when every segment of an object key is a plain name. URL parsing inside
 * the storage client collapses `.` / `..` segments (percent-encoded ones too),
 * drops tabs and newlines, treats `\` as `/` and cuts the path at `?` or `#`,
 * so any of those could move a signed read outside the key it names.
 */
function isTraversalSafeKey(key: string): boolean {
  if (!/^[\x20-\x7e]+$/.test(key) || /[\\%?#]/.test(key)) return false;
  return key.split("/").every((segment) => !/^[\s.]*$/.test(segment));
}

/**
 * True for a private ref this module could have minted as a payment or expense
 * receipt: the canonical scheme, the care-documents bucket, a receipt prefix
 * and a traversal-safe key.
 */
function isSignableReceiptRef(raw: string): boolean {
  if (!raw.startsWith(`media://private/${CARE_DOCUMENT_BUCKET}/`)) return false;
  let key: string;
  try {
    const parsed = parseMediaRef(raw);
    if (parsed.visibility !== "private" || parsed.bucket !== CARE_DOCUMENT_BUCKET) {
      return false;
    }
    key = parsed.key;
  } catch {
    return false;
  }
  return isTraversalSafeKey(key) && RECEIPT_KEY_PREFIXES.has(key.split("/")[0]);
}

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
 * a `media://private/...` reference bound to `ownerUserId` (the claimant's
 * session user id). Enforces the same JPG/PNG/WebP + 8MB cap the legacy image
 * helper applied.
 */
export async function uploadCareClaimEvidence(
  file: File,
  ownerUserId: string,
): Promise<string> {
  const owner = String(ownerUserId ?? "").toLowerCase();
  if (!USER_ID_PATTERN.test(owner)) {
    throw new Error("Claim evidence requires the claimant's user id.");
  }

  await ensureCareMediaBuckets();
  const ref = await getCareMediaStore().upload({
    file,
    visibility: "private",
    bucket: CARE_DOCUMENT_BUCKET,
    pathPrefix: `${CLAIM_EVIDENCE_PREFIX}/${owner}`,
    rule: CARE_IMAGE_RULE,
  });

  // Fail at write time if the key grammar ever drifts from what the evidence
  // signer accepts, rather than filing a claim whose evidence can never render.
  if (claimEvidenceOwner(ref) !== owner) {
    throw new Error("Claim evidence was stored under an unexpected key.");
  }
  return ref;
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
 * Resolve a stored payment- or expense-receipt value to a renderable delivery
 * URL for SENSITIVE reads. Backward compatible:
 *  - a `media://private/...` receipt ref -> a short-lived signed URL (server-side)
 *  - a legacy absolute URL               -> passthrough (unchanged)
 *  - anything else (incl. a `media://public/...` ref) -> resolved/empty
 *
 * A private ref is signed only when it is a receipt ref this module mints (see
 * isSignableReceiptRef); claim evidence, other buckets and traversal-shaped
 * keys resolve to "". Claim evidence goes through
 * {@link signCareClaimEvidenceForOwner}.
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
        if (!isSignableReceiptRef(raw)) return "";
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

/**
 * Sign a claim's stored evidence for `ownerUserId`. Only refs bound to that
 * user id, i.e. evidence they uploaded themselves, are signed. Anything else
 * is dropped: another user's evidence, another bucket or prefix, a
 * traversal-shaped key, a public ref or a raw URL. Evidence is always a private
 * ref minted by {@link uploadCareClaimEvidence}; `care_claims` has no legacy
 * URL rows to pass through.
 *
 * Customer routes pass the session user id. A staff triage surface must pass
 * the claim's `opened_by_user_id`, and only after its own staff authorization.
 */
export async function signCareClaimEvidenceForOwner(
  values: unknown,
  ownerUserId: string,
): Promise<string[]> {
  if (!Array.isArray(values) || values.length === 0) return [];
  const owner = String(ownerUserId ?? "").toLowerCase();
  if (!USER_ID_PATTERN.test(owner)) return [];

  const store = getCareMediaStore();
  const signed = await Promise.all(
    values.map(async (value) => {
      if (claimEvidenceOwner(value) !== owner) return "";
      try {
        return await store.signedUrl(value as string);
      } catch {
        return "";
      }
    }),
  );
  return signed.filter((url) => url.length > 0);
}
