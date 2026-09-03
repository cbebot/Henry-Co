/**
 * @henryco/media — `media://` reference encoding/decoding (pure, client-safe).
 */

import { MEDIA_REF_SCHEME } from "./config";
import type { MediaRef, MediaVisibility, ParsedMediaRef } from "./types";

const VISIBILITIES: readonly MediaVisibility[] = ["public", "private"];

/** True for `http://` / `https://` absolute URLs (passed through unchanged). */
export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value ?? "").trim());
}

/** True for a `media://...` reference. */
export function isMediaRef(value: string): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .startsWith(MEDIA_REF_SCHEME);
}

/** Build a `media://<visibility>/<bucket>/<key>` reference. Validates structure. */
export function buildMediaRef(input: {
  visibility: MediaVisibility;
  bucket: string;
  key: string;
}): MediaRef {
  const { visibility } = input;
  if (!VISIBILITIES.includes(visibility)) {
    throw new Error(`Invalid media visibility: ${String(visibility)}`);
  }
  const bucket = String(input.bucket ?? "").trim();
  if (!bucket || bucket.includes("/")) {
    throw new Error(`Invalid media bucket: ${String(input.bucket)}`);
  }
  const key = String(input.key ?? "")
    .trim()
    .replace(/^\/+/, "");
  if (!key) {
    throw new Error("Media key is required.");
  }
  return `${MEDIA_REF_SCHEME}${visibility}/${bucket}/${key}`;
}

/** Parse a `media://` reference into its parts. Throws on a malformed ref. */
export function parseMediaRef(ref: string): ParsedMediaRef {
  const value = String(ref ?? "").trim();
  if (!isMediaRef(value)) {
    throw new Error(`Not a media ref: ${value.slice(0, 64)}`);
  }
  const body = value.slice(MEDIA_REF_SCHEME.length);
  const firstSlash = body.indexOf("/");
  const secondSlash = firstSlash >= 0 ? body.indexOf("/", firstSlash + 1) : -1;
  if (firstSlash < 0 || secondSlash < 0) {
    throw new Error(`Malformed media ref: ${value.slice(0, 64)}`);
  }
  const visibility = body.slice(0, firstSlash) as MediaVisibility;
  const bucket = body.slice(firstSlash + 1, secondSlash);
  const key = body.slice(secondSlash + 1);
  if (!VISIBILITIES.includes(visibility)) {
    throw new Error(`Invalid media visibility in ref: ${visibility}`);
  }
  if (!bucket) {
    throw new Error(`Missing bucket in media ref: ${value.slice(0, 64)}`);
  }
  if (!key) {
    throw new Error(`Missing key in media ref: ${value.slice(0, 64)}`);
  }
  return { visibility, bucket, key };
}
