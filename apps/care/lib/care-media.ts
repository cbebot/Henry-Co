/**
 * Care media adapter over @henryco/media (client-safe surface).
 *
 * Mirrors `apps/property/lib/property/media.ts`. Only delivery-URL resolution
 * and validation rules live here — the privileged upload + signed-URL path
 * lives in `care-media-store.ts` (server-only), which injects the care
 * service-role client into the media store.
 *
 * Persisted values are backend-neutral `media://` references (NOT raw storage
 * URLs), so swapping the storage vendor stays a resolver change rather than a
 * data migration. Existing rows hold legacy absolute (Cloudinary) URLs and are
 * passed through unchanged; new sensitive uploads are written as
 * `media://private/...` refs and signed at the read boundary.
 */

import { resolveMediaUrl, isAbsoluteUrl, type MediaValidationRule } from "@henryco/media";

/**
 * RLS-private bucket for SENSITIVE care media (claim evidence, customer
 * payment-proof receipts, staff/owner expense receipts). Never publicly
 * dereferenceable — read only via short-lived signed URLs.
 */
export const CARE_DOCUMENT_BUCKET = "care-documents";

/**
 * Public bucket for non-sensitive care media (review/testimonial photos, owner
 * brand/marketing assets). Defined for parity with the property pattern; the
 * public flows currently remain on the existing CDN and are unaffected by this
 * migration.
 */
export const CARE_MEDIA_BUCKET = "care-media";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

/** Validation for sensitive image evidence (claim photos, image receipts). */
export const CARE_IMAGE_RULE: MediaValidationRule = {
  maxBytes: MAX_IMAGE_BYTES,
  allowedTypes: [...ALLOWED_IMAGE_TYPES],
  invalidTypeMessage: "Please upload a JPG, PNG, or WebP image.",
};

/** Validation for payment-proof receipts (images + PDF). */
export const CARE_RECEIPT_RULE: MediaValidationRule = {
  maxBytes: MAX_RECEIPT_BYTES,
  allowedTypes: [...ALLOWED_IMAGE_TYPES, "application/pdf"],
  invalidTypeMessage: "Please upload a JPG, PNG, WebP image, or PDF receipt.",
};

/**
 * Resolve a stored PUBLIC media value (a `media://public/...` reference or a
 * legacy absolute URL) to a renderable delivery URL. Defensive by design: a
 * stray/malformed value (including a PRIVATE ref, which `resolveMediaUrl`
 * throws on) must never crash a render, so it degrades to the passthrough URL
 * (if absolute) or an empty string. PRIVATE refs must instead be signed
 * server-side via `signCareMediaUrl` in `care-media-store.ts`.
 */
export function resolveCareMediaUrl(value: string | null | undefined): string {
  const raw = String(value ?? "");
  if (!raw) return "";
  try {
    return resolveMediaUrl(raw);
  } catch {
    return isAbsoluteUrl(raw) ? raw : "";
  }
}
