// V3-MKT-TRUST-01 — which images a listing may carry. PURE.
//
// Under instant publish an image must be a first-party upload: an object in the
// marketplace image bucket. An externally hosted URL is refused, because its
// bytes can be swapped after the verdict and it cannot be fingerprinted. The
// edit form posts the resolved public URL of an upload rather than its ref, so
// both spellings are folded to one canonical `media://` ref — the string the
// verdict covers and the media guard later checks.

import { buildMediaRef, isAbsoluteUrl, isMediaRef, parseMediaRef } from "@henryco/media";
import { MARKETPLACE_IMAGE_BUCKET } from "../media-image";

const PUBLIC_OBJECT_PATH = `/storage/v1/object/public/${MARKETPLACE_IMAGE_BUCKET}/`;

/** `product/<uploader uuid>/<file>` — the key shape the upload route writes. */
const PRODUCT_KEY_RE = /^product\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[^/]+$/i;

export interface ClassifiedImage {
  /** What the seller posted. */
  input: string;
  /** Canonical first-party ref, or null when the image is not a first-party upload. */
  ref: string | null;
  /** The uploader encoded in the object key, when the key has the upload-route shape. */
  uploaderId: string | null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Fold one posted image value to a canonical ref.
 * `publicBaseUrl` is this deployment's public media base (the Supabase URL); an
 * absolute URL only counts as first-party when it points at that host.
 */
export function classifyImage(input: string, publicBaseUrl: string | null | undefined): ClassifiedImage {
  const value = String(input ?? "").trim();
  const none: ClassifiedImage = { input: value, ref: null, uploaderId: null };
  if (!value) return none;

  let key: string | null = null;

  if (isMediaRef(value)) {
    try {
      const parsed = parseMediaRef(value);
      if (parsed.visibility !== "public" || parsed.bucket !== MARKETPLACE_IMAGE_BUCKET) return none;
      key = parsed.key;
    } catch {
      return none;
    }
  } else if (isAbsoluteUrl(value)) {
    const base = String(publicBaseUrl ?? "").trim();
    const baseHost = base ? hostOf(base) : null;
    const valueHost = hostOf(value);
    if (!baseHost || !valueHost || baseHost !== valueHost) return none;
    let pathname: string;
    try {
      pathname = new URL(value).pathname;
    } catch {
      return none;
    }
    if (!pathname.startsWith(PUBLIC_OBJECT_PATH)) return none;
    try {
      key = decodeURIComponent(pathname.slice(PUBLIC_OBJECT_PATH.length));
    } catch {
      return none;
    }
  } else {
    return none;
  }

  // No traversal, no empty segments, nothing that could address another object.
  if (!key || key.includes("..") || key.includes("//") || key.startsWith("/") || /[\\?#]/.test(key)) return none;

  const match = PRODUCT_KEY_RE.exec(key);
  return {
    input: value,
    ref: buildMediaRef({ visibility: "public", bucket: MARKETPLACE_IMAGE_BUCKET, key }),
    uploaderId: match ? match[1].toLowerCase() : null,
  };
}

export interface ImageSetClassification {
  /** Canonical refs, in the seller's order, de-duplicated. */
  refs: string[];
  /** Posted values that are not first-party uploads. */
  notFirstParty: string[];
  /** First-party refs uploaded by someone who is not allowed to supply this store's images. */
  foreignRefs: string[];
}

/**
 * Classify a posted gallery. `allowedUploaders` are the user ids whose uploads
 * this store may use (the acting user and the store owner). `grandfathered` are
 * values already attached to the listing before this write — a legacy absolute
 * URL the seller is merely keeping is not a new external image.
 */
export function classifyImageSet(input: {
  values: ReadonlyArray<string>;
  publicBaseUrl: string | null | undefined;
  allowedUploaders: ReadonlyArray<string | null | undefined>;
  grandfathered?: ReadonlyArray<string>;
}): ImageSetClassification {
  const allowed = new Set(
    input.allowedUploaders.filter((id): id is string => typeof id === "string" && id.length > 0).map((id) => id.toLowerCase()),
  );
  const kept = new Set((input.grandfathered ?? []).map((value) => String(value).trim()));
  const refs: string[] = [];
  const notFirstParty: string[] = [];
  const foreignRefs: string[] = [];

  for (const raw of input.values) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    const image = classifyImage(value, input.publicBaseUrl);
    if (image.ref === null) {
      if (kept.has(value)) {
        if (!refs.includes(value)) refs.push(value);
      } else {
        notFirstParty.push(value);
      }
      continue;
    }
    if (!refs.includes(image.ref)) refs.push(image.ref);
    if (image.uploaderId === null || !allowed.has(image.uploaderId)) {
      if (!kept.has(value) && !kept.has(image.ref)) foreignRefs.push(image.ref);
    }
  }

  return { refs, notFirstParty, foreignRefs };
}

/** The storage key of a canonical ref (for a first-party download). Null for anything else. */
export function storageKeyOf(ref: string): string | null {
  const image = classifyImage(ref, null);
  if (image.ref === null) return null;
  try {
    return parseMediaRef(image.ref).key;
  } catch {
    return null;
  }
}
