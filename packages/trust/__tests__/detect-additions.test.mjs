import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForDetection } from "../detect.ts";
import { detectExternalLinks } from "../detect.ts";

test("normalizeForDetection collapses spoken/obfuscated contact details", () => {
  assert.equal(normalizeForDetection("call me on zero eight zero one"), "call me on 0801");
  assert.equal(normalizeForDetection("0 8 0 - 1 2 3"), "0801 23".replace(" ", "")); // digits collapse
  assert.equal(normalizeForDetection("name at gmail dot com"), "name@gmail.com");
});

test("detectExternalLinks catches shortener + generic URLs the base detector misses", () => {
  const a = detectExternalLinks("ping me wa.me/2348012345678");
  assert.equal(a.detected, true);
  assert.equal(a.severity, "medium");
  const b = detectExternalLinks("see https://my-personal-site.example/contact");
  assert.equal(b.detected, true);
  const c = detectExternalLinks("is the blue one available?");
  assert.equal(c.detected, false);
});

import { maskContactsForDisplay, detectOffPlatformContact, sanitizeForDisplay } from "../detect.ts";

test("maskContactsForDisplay masks handles, app names, and links beyond phone/email", () => {
  const out = maskContactsForDisplay("dm me @jane_doe on whatsapp or bit.ly/x");
  assert.ok(!out.includes("@jane_doe"));
  assert.ok(!/whatsapp/i.test(out));
  assert.ok(!out.includes("bit.ly/x"));
});

test("REGRESSION: existing detectOffPlatformContact + sanitizeForDisplay behavior is unchanged", () => {
  // phone + email still HIGH
  const r = detectOffPlatformContact("call 08012345678 or me@x.com");
  assert.equal(r.severity, "high");
  // base sanitizer still masks phone to last-4 and email to first-2
  const s = sanitizeForDisplay("call 08012345678 or me@x.com");
  assert.ok(s.includes("***-5678"));
  assert.ok(s.includes("me***@x.com"));
});
