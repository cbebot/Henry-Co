/**
 * Property media adapter over @henryco/media.
 *
 * Client-safe: only delivery-URL resolution + validation rules live here. The
 * privileged upload path lives in store.ts (server), which injects the property
 * service-role client into the media store. Listing photos render via the
 * resolver below, so JSX never embeds a raw storage URL and the storage vendor
 * stays swappable.
 */

import { resolveMediaUrl, isAbsoluteUrl, type MediaValidationRule } from "@henryco/media";

import {
  PROPERTY_ALLOWED_DOCUMENT_TYPES,
  PROPERTY_ALLOWED_MEDIA_TYPES,
  PROPERTY_MAX_DOCUMENT_FILE_BYTES,
  PROPERTY_MAX_MEDIA_FILE_BYTES,
} from "@/lib/property/submission";

/** Validation for public listing photos (uploaded to the public bucket). */
export const PROPERTY_IMAGE_RULE: MediaValidationRule = {
  maxBytes: PROPERTY_MAX_MEDIA_FILE_BYTES,
  allowedTypes: [...PROPERTY_ALLOWED_MEDIA_TYPES],
  invalidTypeMessage: "Please upload a JPG, PNG, or WebP image.",
};

/** Validation for sensitive documents (uploaded to the RLS-private bucket). */
export const PROPERTY_DOCUMENT_RULE: MediaValidationRule = {
  maxBytes: PROPERTY_MAX_DOCUMENT_FILE_BYTES,
  allowedTypes: [...PROPERTY_ALLOWED_DOCUMENT_TYPES],
  invalidTypeMessage: "Please upload a PDF, Word document, or image.",
};

/** Neutral fallback when a listing has no resolvable hero image. */
export const PROPERTY_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80";

/**
 * Resolve a stored media value (a `media://` reference or a legacy absolute URL)
 * to a renderable delivery URL. Defensive by design: a stray or malformed value
 * must never throw into a public render, so it degrades to the passthrough URL
 * (if absolute) or an empty string (filtered out by callers).
 */
export function resolvePropertyMediaUrl(value: string): string {
  if (!value) return "";
  try {
    return resolveMediaUrl(value);
  } catch {
    return isAbsoluteUrl(value) ? value : "";
  }
}

/**
 * Return a listing with its `heroImage` + `gallery` resolved to renderable URLs.
 * Applied at the public/management read-selector boundary only — the raw
 * snapshot keeps `media://` references intact so write-back paths never persist
 * a resolved URL (which would defeat vendor-swappability).
 */
export function resolveListingMedia<T extends { heroImage: string; gallery: string[] }>(
  listing: T,
): T {
  const gallery = (listing.gallery ?? []).map(resolvePropertyMediaUrl).filter(Boolean);
  const heroImage = resolvePropertyMediaUrl(listing.heroImage) || gallery[0] || "";
  return { ...listing, heroImage, gallery };
}
