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
 * HMAC (`hashSharerId`, `verifySharerHash`) is server-only — `node:crypto`
 * is imported lazily there so this module can be bundled into a client
 * component without dragging Node crypto into the browser bundle.
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
// Server-only HMAC. `node:crypto` is imported lazily so this file stays
// client-bundlable (the ShareButton imports `withShareAttribution`).
// ─────────────────────────────────────────────────────────────────────

function assertServer(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "@henryco/seo/deeplinks hashSharerId/verifySharerHash are server-only",
    );
  }
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

  const { createHmac } = await import("node:crypto");
  const digest = createHmac("sha256", resolvedSecret)
    .update(`${SHARE_HASH_VERSION}:${cleanId}`)
    .digest("base64url")
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
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(expected);
  const b = Buffer.from(candidateHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
