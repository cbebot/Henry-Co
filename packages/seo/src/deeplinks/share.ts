/**
 * V3-04 (S5) — Share-link attribution.
 *
 * Shareable surfaces (property listing, marketplace product, jobs role,
 * learn course) carry a Share button (`@henryco/ui` ShareButton) whose URL
 * is tagged `?ref=share&from=<hashed-sharer-id>`. The hash is a
 * non-reversible HMAC of the sharer's user-id with a server-known salt, so
 * the receiving page can credit the sharer in `customer_referrals` without
 * the raw user-id ever appearing in a URL.
 *
 * This module is split so the URL shaping (`withShareAttribution`,
 * `parseShareAttribution`) is client-safe (pure string work), while the
 * HMAC (`hashSharerId`, `verifySharerHash`) is server-only — it uses the
 * runtime-global Web Crypto API (`crypto.subtle`) behind an `assertServer()`
 * guard, so the salt is never read in the browser and the module bundles
 * cleanly into the client, Node, and Edge runtimes alike.
 *
 * Security (per S5 + trust/safety): the token is a one-way fingerprint.
 * It is NOT a bearer credential — a tampered `from=` simply fails to match
 * any known sharer hash and attribution is skipped (logged via the S8
 * `henry.share.attributed_install` failure path). We never trust it to
 * grant anything.
 */

export const SHARE_REF_VALUE = "share";
export const SHARE_REF_PARAM = "ref";
export const SHARE_FROM_PARAM = "from";

/** Versioned prefix so the salt/algorithm can rotate without ambiguity. */
const SHARE_HASH_VERSION = "s1";

export type ShareAttribution = {
  /** Always "share" when present. */
  ref: typeof SHARE_REF_VALUE;
  /** The opaque hashed sharer fingerprint (version-prefixed). */
  from: string | null;
};

/**
 * Append `?ref=share&from=<hash>` to a canonical absolute deep-link URL.
 * `fromHash` is the output of `hashSharerId` (or null for an anonymous
 * share with no attribution). Returns the URL unchanged if not parseable.
 */
export function withShareAttribution(
  url: string,
  fromHash: string | null,
): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(SHARE_REF_PARAM, SHARE_REF_VALUE);
    if (fromHash) {
      parsed.searchParams.set(SHARE_FROM_PARAM, fromHash);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Read share attribution off an arriving URL's query string. Returns null
 * when the URL is not a share arrival (`ref` !== "share").
 */
export function parseShareAttribution(
  search: string | URLSearchParams,
): ShareAttribution | null {
  const params =
    typeof search === "string"
      ? new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : search,
        )
      : search;
  if (params.get(SHARE_REF_PARAM) !== SHARE_REF_VALUE) return null;
  const from = params.get(SHARE_FROM_PARAM);
  return {
    ref: SHARE_REF_VALUE,
    from: from && isShareHashShape(from) ? from : null,
  };
}

/** Cheap shape check before trusting a `from=` value enough to look it up. */
export function isShareHashShape(value: string): boolean {
  return /^s1\.[A-Za-z0-9_-]{16,64}$/.test(String(value || "").trim());
}

// ─────────────────────────────────────────────────────────────────────
// Server-only HMAC. Built on the runtime-global Web Crypto API
// (`crypto.subtle`) rather than the Node crypto built-in, so this module is
// bundlable into EVERY runtime the deeplinks barrel reaches: the client (the
// ShareButton imports `withShareAttribution`), the Node server, AND the
// Edge runtime. The barrel is pulled into the `.well-known/*` edge routes,
// where a static Node-crypto import fails the Turbopack edge build even when
// imported lazily — Web Crypto sidesteps that entirely. The `assertServer()`
// guard still keeps the salt-reading paths off the browser. The digest is
// byte-identical to the prior `.digest("base64url")` output, so share links
// minted before this change keep verifying.
// ─────────────────────────────────────────────────────────────────────

function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "@henryco/seo/deeplinks hashSharerId/verifySharerHash are server-only",
    );
  }
}

/**
 * RFC 4648 §5 base64url WITHOUT padding — matches the prior
 * `.digest("base64url")` output so the fingerprint is stable across the
 * Web Crypto migration.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** HMAC-SHA256(secret, message) → base64url, via the global Web Crypto API. */
async function hmacSha256Base64Url(
  secret: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

/**
 * Constant-time comparison of two equal-length ASCII strings (the share
 * fingerprints are version-prefixed base64url, so byte === char-code).
 * Returns false on a length mismatch, mirroring the prior
 * `timingSafeEqual` guard.
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Non-reversible HMAC-SHA256 fingerprint of a sharer user-id. The salt is
 * a server-known secret (`HENRYCO_SHARE_SALT`, falling back to the
 * generic `HENRYCO_TOKEN_SALT`). Returns null when no secret is
 * configured so callers degrade to an un-attributed share rather than
 * leaking a weak hash.
 */
export async function hashSharerId(
  userId: string,
  secret?: string | null,
): Promise<string | null> {
  assertServer();
  const resolvedSecret =
    secret ||
    process.env.HENRYCO_SHARE_SALT ||
    process.env.HENRYCO_TOKEN_SALT ||
    null;
  if (!resolvedSecret || resolvedSecret.length < 16) return null;
  const cleanId = String(userId || "").trim();
  if (!cleanId) return null;

  const digest = (
    await hmacSha256Base64Url(resolvedSecret, `${SHARE_HASH_VERSION}:${cleanId}`)
  )
    // Keep it short + URL-clean; 24 chars of base64url ≈ 144 bits, ample
    // collision resistance for attribution while keeping URLs tidy.
    .slice(0, 24);
  return `${SHARE_HASH_VERSION}.${digest}`;
}

/**
 * Constant-time check that `candidateHash` is the fingerprint of
 * `userId`. Used by the share-arrival attribution path to confirm a
 * `from=` token actually belongs to the resolved sharer before crediting
 * the referral.
 */
export async function verifySharerHash(
  userId: string,
  candidateHash: string,
  secret?: string | null,
): Promise<boolean> {
  assertServer();
  if (!isShareHashShape(candidateHash)) return false;
  const expected = await hashSharerId(userId, secret);
  if (!expected) return false;
  return timingSafeEqualStrings(expected, candidateHash);
}
