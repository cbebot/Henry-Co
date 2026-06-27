/**
 * STU-b — the portal download proxy must pin EXACT remote hosts. The old
 * broad suffix branch (`.cloudinary.com` / `.supabase.co`) let an
 * attacker-controlled subdomain (or a look-alike apex) through the SSRF
 * guard. These tests lock the allowlist to the two pinned hosts and prove
 * the classic suffix-bypass shapes are rejected.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { isAllowedRemoteUrl, ALLOWED_DOWNLOAD_HOSTS } from "./download-allowlist";

test("exact pinned hosts over https are allowed", () => {
  assert.equal(
    isAllowedRemoteUrl("https://res.cloudinary.com/demo/image/upload/x.png").ok,
    true,
  );
  assert.equal(
    isAllowedRemoteUrl(
      "https://rzkbgwuznmdxnnhmjazy.supabase.co/storage/v1/object/x.pdf",
    ).ok,
    true,
  );
});

test("a non-pinned cloudinary subdomain is rejected (no suffix matching)", () => {
  const r = isAllowedRemoteUrl("https://evil.cloudinary.com/x");
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.reason, "host_not_allowed");
});

test("a non-pinned supabase subdomain is rejected (no suffix matching)", () => {
  const r = isAllowedRemoteUrl("https://attacker.supabase.co/x");
  assert.ok(!r.ok);
});

test("a look-alike apex that merely ends with an allowed label is rejected", () => {
  assert.ok(!isAllowedRemoteUrl("https://res.cloudinary.com.evil.com/x").ok);
  assert.ok(!isAllowedRemoteUrl("https://evilcloudinary.com/x").ok);
  assert.ok(!isAllowedRemoteUrl("https://notres.supabase.co.evil.com/x").ok);
});

test("non-https is rejected even for a pinned host", () => {
  const r = isAllowedRemoteUrl("http://res.cloudinary.com/x");
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.reason, "non_https");
});

test("garbage input is rejected as invalid_url", () => {
  const r = isAllowedRemoteUrl("not a url");
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.reason, "invalid_url");
});

test("the allowlist is exactly the two pinned hosts", () => {
  assert.deepEqual(
    [...ALLOWED_DOWNLOAD_HOSTS].sort(),
    ["res.cloudinary.com", "rzkbgwuznmdxnnhmjazy.supabase.co"],
  );
});
