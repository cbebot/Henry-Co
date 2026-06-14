/**
 * @henryco/media — delivery-URL resolution (pure, client-safe).
 *
 * The single point that turns a persisted value into something renderable:
 *  - absolute `http(s)` URL  -> passed through unchanged (legacy/curated assets)
 *  - `media://public/...`     -> deterministic public delivery URL
 *  - `media://private/...`    -> THROWS (private media must be signed server-side)
 *
 * Because this is the one resolver, JSX never embeds a raw storage URL, and the
 * storage vendor can be swapped by changing how public refs are built here.
 */

import { getPublicMediaBaseUrl } from "./config";
import { isAbsoluteUrl, isMediaRef, parseMediaRef } from "./ref";

export class MediaResolveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaResolveError";
  }
}

export type ResolveOptions = {
  /** Override the public delivery base (else read from env). */
  publicBaseUrl?: string;
};

/** Encode each path segment but keep the slashes that separate folders. */
function encodeKeyPath(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function resolveMediaUrl(refOrUrl: string, opts: ResolveOptions = {}): string {
  const value = String(refOrUrl ?? "").trim();
  if (!value) return "";
  if (isAbsoluteUrl(value)) return value;

  if (!isMediaRef(value)) {
    throw new MediaResolveError(`Unrecognized media value: ${value.slice(0, 64)}`);
  }

  const { visibility, bucket, key } = parseMediaRef(value);
  if (visibility === "private") {
    throw new MediaResolveError(
      "Private media must be resolved via MediaStore.signedUrl(), not resolveMediaUrl().",
    );
  }

  const base = (opts.publicBaseUrl ?? getPublicMediaBaseUrl()).replace(/\/+$/, "");
  if (!base) {
    throw new MediaResolveError(
      "No public media base URL configured (MEDIA_PUBLIC_BASE_URL / NEXT_PUBLIC_SUPABASE_URL).",
    );
  }
  return `${base}/storage/v1/object/public/${bucket}/${encodeKeyPath(key)}`;
}
