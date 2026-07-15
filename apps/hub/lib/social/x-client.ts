import "server-only";

import { createHmac, randomBytes } from "node:crypto";

/**
 * X (Twitter) publisher — OAuth 1.0a user context, POST /2/tweets.
 *
 * OAuth 1.0a is deliberately chosen over OAuth 2.0 for the company bot:
 * 1.0a access tokens do NOT expire and do NOT rotate, so posting needs no
 * token-vault state and can never burn a single-use refresh token (X's
 * OAuth 2.0 refresh tokens rotate on every use — a stateless refresher
 * locks the account out). Signing is plain HMAC-SHA1 over the RFC 5849
 * base string — node:crypto only, no new dependency.
 *
 * Secrets come from env (X_CONSUMER_KEY/SECRET + X_ACCESS_TOKEN_OAUTH1/
 * X_ACCESS_SECRET_OAUTH1) and never leave this module.
 */

const TWEET_ENDPOINT = "https://api.twitter.com/2/tweets";

/** RFC 3986 percent-encoding (encodeURIComponent misses !'()*). */
function pct(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

type XCreds = {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessSecret: string;
};

export function readXCreds(): XCreds | null {
  const consumerKey = process.env.X_CONSUMER_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN_OAUTH1;
  const accessSecret = process.env.X_ACCESS_SECRET_OAUTH1;
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) return null;
  return { consumerKey, consumerSecret, accessToken, accessSecret };
}

/** Build the OAuth 1.0a Authorization header for a request with NO query/body
 *  form params (the tweet payload is JSON, which 1.0a excludes from signing). */
function oauth1Header(method: "POST", url: string, creds: XCreds): string {
  const params: Record<string, string> = {
    oauth_consumer_key: creds.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${pct(k)}=${pct(params[k])}`)
    .join("&");
  const baseString = [method, pct(url), pct(paramString)].join("&");
  const signingKey = `${pct(creds.consumerSecret)}&${pct(creds.accessSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");
  const all = { ...params, oauth_signature: signature };
  return (
    "OAuth " +
    Object.keys(all)
      .sort()
      .map((k) => `${pct(k)}="${pct(all[k as keyof typeof all] as string)}"`)
      .join(", ")
  );
}

export async function postToX(
  text: string,
): Promise<{ ok: true; tweetId: string } | { ok: false; error: string }> {
  const body = text.trim();
  if (!body) return { ok: false, error: "Write the post first." };
  if (body.length > 280) return { ok: false, error: "Keep the post under 280 characters." };

  const creds = readXCreds();
  if (!creds) return { ok: false, error: "X isn't connected yet (missing API credentials)." };

  try {
    const res = await fetch(TWEET_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: oauth1Header("POST", TWEET_ENDPOINT, creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: body }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as
      | { data?: { id?: string }; title?: string; detail?: string }
      | null;
    if (res.ok && data?.data?.id) {
      return { ok: true, tweetId: data.data.id };
    }
    // Never echo provider internals to the card — log for ops, calm copy out.
    console.error("[x-client] post failed", res.status, data?.title, data?.detail);
    if (res.status === 429) return { ok: false, error: "X is rate-limiting us. Try again shortly." };
    if (res.status === 401 || res.status === 403)
      return { ok: false, error: "X rejected our credentials. Check the connection." };
    return { ok: false, error: "The post didn't go through. Nothing was published." };
  } catch {
    return { ok: false, error: "We couldn't reach X. Nothing was published." };
  }
}
