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

/** One base URL, or several: the storage origin and, when configured, the CDN in front of it. */
export type PublicMediaBases = string | ReadonlyArray<string | null | undefined> | null | undefined;

/**
 * The bases a first-party picture can be served from: the storage origin and the
 * optional delivery base in front of it. The edit form posts the RESOLVED public
 * URL, so both spellings of the same object must fold to the same ref.
 */
export function firstPartyMediaBases(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string[] {
  return [env.NEXT_PUBLIC_SUPABASE_URL, env.MEDIA_PUBLIC_BASE_URL]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
}

function originsOf(bases: PublicMediaBases): Array<{ host: string; prefix: string }> {
  const list = Array.isArray(bases) ? bases : [bases];
  const origins: Array<{ host: string; prefix: string }> = [];
  for (const base of list) {
    const value = String(base ?? "").trim();
    if (!value) continue;
    try {
      const parsed = new URL(value);
      origins.push({ host: parsed.host.toLowerCase(), prefix: parsed.pathname.replace(/\/+$/, "") });
    } catch {
      // not a URL: ignored
    }
  }
  return origins;
}

/** Either prefix the upload route writes: `product/<uploader>/…` or `store/<uploader>/…`. */
const OWN_UPLOAD_KEY_RE = /^(?:product|store)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[^/]+$/i;

/**
 * Fold one posted image value to a canonical ref.
 * `publicBaseUrl` is this deployment's public media base (or bases); an absolute
 * URL only counts as first-party when it points at one of them.
 */
export function classifyImage(input: string, publicBaseUrl: PublicMediaBases): ClassifiedImage {
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
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return none;
    }
    // https only, no credentials in the URL, and one of our own origins.
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return none;
    if (parsed.username || parsed.password) return none;
    const host = parsed.host.toLowerCase();
    const origin = originsOf(publicBaseUrl).find(
      (candidate) => candidate.host === host && parsed.pathname.startsWith(`${candidate.prefix}${PUBLIC_OBJECT_PATH}`),
    );
    if (!origin) return none;
    try {
      key = decodeURIComponent(parsed.pathname.slice(origin.prefix.length + PUBLIC_OBJECT_PATH.length));
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
  publicBaseUrl: PublicMediaBases;
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

/**
 * True when `value` is a first-party object this user uploaded — under either
 * prefix the upload route writes. For a store's hero picture: any object in the
 * bucket is not enough, it must be the store's own upload.
 */
export function isOwnUpload(value: string, userId: string | null | undefined, publicBaseUrl: PublicMediaBases): boolean {
  const image = classifyImage(value, publicBaseUrl);
  if (image.ref === null || !userId) return false;
  try {
    const match = OWN_UPLOAD_KEY_RE.exec(parseMediaRef(image.ref).key);
    return match !== null && match[1].toLowerCase() === userId.toLowerCase();
  } catch {
    return false;
  }
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
