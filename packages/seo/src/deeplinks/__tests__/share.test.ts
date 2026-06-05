/**
 * Share-link attribution HMAC — guards the node:crypto → Web Crypto
 * migration (the `apple-app-site-association` Edge route pulls the deeplinks
 * barrel into the Edge bundle, where `node:crypto` is unavailable).
 *
 * The load-bearing invariant is OUTPUT PARITY: a fingerprint minted by the
 * previous `createHmac("sha256", …).digest("base64url").slice(0, 24)`
 * implementation must still verify, so `?from=s1.<hash>` share links minted
 * before this change keep crediting the right sharer.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  hashSharerId,
  verifySharerHash,
  isShareHashShape,
  withShareAttribution,
  parseShareAttribution,
  SHARE_REF_VALUE,
} from "../share";

// Keep the env clean so the "no usable secret" cases are deterministic
// regardless of the shell the runner inherits.
delete process.env.HENRYCO_SHARE_SALT;
delete process.env.HENRYCO_TOKEN_SALT;

const SECRET = "test-share-salt-0123456789abcdef"; // ≥ 16 chars
const USER = "11111111-2222-3333-4444-555555555555";

/** The exact algorithm the previous node:crypto implementation produced. */
function legacyHash(userId: string, secret: string): string {
  const digest = createHmac("sha256", secret)
    .update(`s1:${String(userId).trim()}`)
    .digest("base64url")
    .slice(0, 24);
  return `s1.${digest}`;
}

test("hashSharerId is byte-identical to the legacy node:crypto digest", async () => {
  for (const id of [USER, "abc", "  spaced-id  ", "rené-名-😀"]) {
    assert.equal(await hashSharerId(id, SECRET), legacyHash(id, SECRET));
  }
});

test("hashSharerId output passes the on-wire shape check", async () => {
  const hash = await hashSharerId(USER, SECRET);
  assert.ok(hash);
  assert.ok(isShareHashShape(hash));
  assert.match(hash, /^s1\.[A-Za-z0-9_-]{24}$/);
});

test("verifySharerHash round-trips a freshly minted fingerprint", async () => {
  const hash = await hashSharerId(USER, SECRET);
  assert.ok(hash);
  assert.equal(await verifySharerHash(USER, hash, SECRET), true);
});

test("verifySharerHash rejects tampered, foreign, or malformed tokens", async () => {
  const hash = await hashSharerId(USER, SECRET);
  assert.ok(hash);
  assert.equal(await verifySharerHash(USER, `s1.${"A".repeat(24)}`, SECRET), false);
  assert.equal(
    await verifySharerHash("99999999-0000-0000-0000-000000000000", hash, SECRET),
    false,
  );
  assert.equal(await verifySharerHash(USER, "not-a-hash", SECRET), false);
});

test("hashSharerId degrades to null without a usable secret", async () => {
  assert.equal(await hashSharerId(USER, null), null); // no secret + clean env
  assert.equal(await hashSharerId(USER, "tooshort"), null); // < 16 chars
  assert.equal(await hashSharerId("", SECRET), null); // empty id
});

test("share URL shaping round-trips through attribution params", async () => {
  const hash = await hashSharerId(USER, SECRET);
  assert.ok(hash);
  const url = withShareAttribution("https://jobs.henryonyx.com/roles/abc", hash);
  const parsed = parseShareAttribution(new URL(url).search);
  assert.equal(parsed?.ref, SHARE_REF_VALUE);
  assert.equal(parsed?.from, hash);
});

test("share.ts carries no Edge-incompatible Node-only APIs", () => {
  const src = readFileSync(
    fileURLToPath(new URL("../share.ts", import.meta.url)),
    "utf8",
  );
  assert.ok(!/node:crypto/.test(src), "node:crypto must not appear in share.ts");
  assert.ok(!/\bBuffer\b/.test(src), "node-only Buffer must not appear in share.ts");
});
