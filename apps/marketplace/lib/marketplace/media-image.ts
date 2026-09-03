// Buyer-visible marketplace images (product photos, store hero/logo) — the PURE, client-safe
// half of the pipeline. Uploads happen server-side (media.ts / the images route); this module
// owns the bucket name, the validation rule, and the read-boundary resolver so both server
// pages and client components render stored values the same way.
import { isAbsoluteUrl, isMediaRef, resolveMediaUrl, type MediaValidationRule } from "@henryco/media";

/** PUBLIC bucket — product photos are catalog content, deliverable by plain URL. */
export const MARKETPLACE_IMAGE_BUCKET = "marketplace-images";

export const MARKETPLACE_IMAGE_RULE: MediaValidationRule = {
  maxBytes: 8 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  invalidTypeMessage: "Use a JPG, PNG, or WebP image up to 8MB.",
};

/**
 * Read-boundary resolver: `media://public/...` refs → the deterministic public URL;
 * legacy absolute URLs (existing rows) pass through; anything else → null so callers
 * fall back to their placeholder instead of rendering a broken src.
 */
export function resolveMarketplaceImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isMediaRef(value)) {
    try {
      return resolveMediaUrl(value);
    } catch {
      return null;
    }
  }
  return isAbsoluteUrl(value) ? value : null;
}
