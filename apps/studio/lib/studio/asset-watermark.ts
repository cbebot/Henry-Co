/**
 * V3-73 — Studio Project Suite: asset watermarking (ANTI-CLONE Principle 5).
 *
 * Two mechanisms, both forensic:
 *   - VISIBLE: a low-opacity Cloudinary text overlay (`${client} · ${ts}`) burned
 *     into every preview so a screenshot/leak carries the viewer's identity.
 *   - INVISIBLE: an HMAC identity tag (`buildIdentityTag`) recorded alongside the
 *     export in `studio_asset_exports` — server-side, tamper-evident, queryable, so
 *     a leaked file can be traced to the exact viewer + deliverable + issue time.
 *
 * NOTE on the invisible tag: studio deliverables are Cloudinary assets, so we cannot
 * rewrite EXIF on the served bytes. The HMAC tag is therefore persisted as the
 * forensic metadata (export-tracking row) rather than embedded in the image; for
 * @henryco/branded-documents PDFs the same tag is also placed in the PDF Keywords.
 */
import { createHmac } from "node:crypto";

const MAX_WATERMARK_LEN = 120;

/** Visible overlay text: viewer identity + the date the preview was issued. */
export function buildWatermarkText(clientIdentity: string, isoTimestamp: string): string {
  const identity = String(clientIdentity || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const date = String(isoTimestamp || "").slice(0, 10); // YYYY-MM-DD
  const composed = `${identity} · ${date}`;
  return composed.length > MAX_WATERMARK_LEN ? composed.slice(0, MAX_WATERMARK_LEN) : composed;
}

/** Invisible, attributable forensic tag (HMAC over viewer+deliverable+time). */
export function buildIdentityTag(
  input: { clientUserId: string; deliverableId: string; issuedAt: string },
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${input.clientUserId}.${input.deliverableId}.${input.issuedAt}`)
    .digest("hex");
}

/**
 * Cloudinary text-overlay encoding: the overlay text segment cannot contain raw
 * `,` or `/` (they delimit transformations / path), so URL-encode then escape those
 * two to their double-encoded forms per Cloudinary's text-layer rules.
 */
function encodeOverlayText(text: string): string {
  return encodeURIComponent(text).replace(/%2C/gi, "%252C").replace(/%2F/gi, "%252F");
}

export function buildWatermarkedImageUrl(opts: {
  cloudName: string;
  publicId: string;
  watermarkText: string;
  /** opacity 1–100, default 18 (low, legible but non-destructive) */
  opacity?: number;
}): string {
  const opacity = Math.min(100, Math.max(1, Math.floor(opts.opacity ?? 18)));
  const overlay = `l_text:Arial_42_bold:${encodeOverlayText(opts.watermarkText)}`;
  // white text, low opacity, centered — readable on most assets without destroying them
  const transform = `${overlay},co_rgb:ffffff,o_${opacity},g_center`;
  // encode each path segment of the public id (preserve the slashes that are real
  // folder separators, but escape spaces and other unsafe chars within segments)
  const safePublicId = opts.publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://res.cloudinary.com/${opts.cloudName}/image/upload/${transform}/${safePublicId}`;
}
