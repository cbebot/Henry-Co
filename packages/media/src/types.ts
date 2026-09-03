/**
 * @henryco/media — types
 *
 * A thin, vendor-swappable media layer. Persisted values are backend-neutral
 * `media://` references, NOT raw storage URLs, so swapping the storage vendor
 * (Supabase today -> Cloudinary later) is a config/resolver change, not a data
 * migration. This mirrors the payment-router seam already used in the repo.
 */

export type MediaVisibility = "public" | "private";

/**
 * Backend-neutral reference persisted in place of a raw storage URL.
 * Wire format: `media://<visibility>/<bucket>/<key>`.
 *
 * It is a plain `string` (assignable into existing `string[]` gallery fields),
 * but always produced via {@link buildMediaRef} and read via {@link parseMediaRef}.
 */
export type MediaRef = string;

export type ParsedMediaRef = {
  visibility: MediaVisibility;
  bucket: string;
  key: string;
};

export type MediaValidationRule = {
  /** Maximum allowed size, in bytes. */
  maxBytes?: number;
  /** Lowercased allowed MIME types; empty/undefined allows any. */
  allowedTypes?: readonly string[];
  /** User-facing message thrown when the MIME type is not allowed. */
  invalidTypeMessage?: string;
};

export type MediaUploadInput = {
  file: File;
  visibility: MediaVisibility;
  /** Storage bucket (Supabase) / vendor folder root. */
  bucket: string;
  /** Folder/key prefix within the bucket. */
  pathPrefix?: string;
  /** Validation applied before the object is written. */
  rule?: MediaValidationRule;
};

/**
 * The swappable surface. Today this is backed by Supabase Storage
 * ({@link createSupabaseMediaStore}); a Cloudinary-backed implementation can be
 * dropped in behind the same contract without touching any caller.
 */
export type MediaStore = {
  /** Validate + write a binary; returns a persisted `media://` reference. */
  upload(input: MediaUploadInput): Promise<MediaRef>;
  /** Resolve a PRIVATE ref to a short-lived signed delivery URL. */
  signedUrl(ref: MediaRef, ttlSeconds?: number): Promise<string>;
  /** Delete the underlying object for a ref. */
  remove(ref: MediaRef): Promise<void>;
};
