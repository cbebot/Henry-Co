/**
 * V3-73 — Studio Project Suite: short-lived signed asset grant.
 *
 * Token = `base64url(JSON payload) . hmac-sha256(payload)`. The payment-gated
 * issuance boundary mints a grant bound to (deliverableId, userId, exp); the gated
 * download proxy verifies HMAC + expiry + viewer before streaming the final file.
 * The raw Cloudinary URL is never exposed to the client — no valid grant, no file.
 *
 * The secret reuses STUDIO_APPROVAL_SIGNATURE_SECRET (server-side, never shipped).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type AssetGrant = {
  deliverableId: string;
  userId: string;
  /** absolute expiry, epoch seconds */
  exp: number;
};

/** default grant lifetime — short-lived */
export const ASSET_GRANT_TTL_SECONDS = 300;

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signAssetGrant(grant: AssetGrant, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      deliverableId: grant.deliverableId,
      userId: grant.userId,
      exp: Math.floor(grant.exp),
    }),
  ).toString("base64url");
  return `${payload}.${hmac(payload, secret)}`;
}

export function verifyAssetGrant(
  token: string,
  secret: string,
  nowSeconds: number,
): AssetGrant | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = hmac(payload, secret);
  if (sig.length !== expected.length) return null;
  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return null;
  }
  if (!ok) return null;

  let grant: AssetGrant;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AssetGrant;
    if (
      !decoded ||
      typeof decoded.deliverableId !== "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }
    grant = decoded;
  } catch {
    return null;
  }

  if (!Number.isFinite(grant.exp) || grant.exp <= nowSeconds) return null;
  return grant;
}
