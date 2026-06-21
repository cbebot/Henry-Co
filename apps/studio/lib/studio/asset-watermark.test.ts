/**
 * V3-73 — Studio Project Suite: asset watermarking (ANTI-CLONE Principle 5).
 *
 * Previews served before final unlock carry a VISIBLE low-opacity watermark
 * (`${clientIdentity} · ${timestamp}`) and an INVISIBLE HMAC identity tag recorded
 * with the export so a leaked preview is forensically attributable to the viewer.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildIdentityTag,
  buildWatermarkText,
  buildWatermarkedImageUrl,
} from "./asset-watermark";

const SECRET = "wm-secret";

test("buildWatermarkText composes a visible identity + timestamp string", () => {
  const text = buildWatermarkText("ada@studio.test", "2026-06-20T10:00:00.000Z");
  assert.match(text, /ada@studio\.test/);
  assert.match(text, /2026-06-20/);
});

test("buildWatermarkText trims overly long identities and strips control chars", () => {
  const long = "x".repeat(200) + "\n\t";
  const text = buildWatermarkText(long, "2026-06-20T10:00:00.000Z");
  assert.ok(text.length <= 120, `expected <=120, got ${text.length}`);
  assert.ok(!/[\n\t]/.test(text));
});

test("buildIdentityTag is deterministic and attributable per viewer+deliverable+time", () => {
  const input = {
    clientUserId: "u-1",
    deliverableId: "d-1",
    issuedAt: "2026-06-20T10:00:00.000Z",
  };
  const a = buildIdentityTag(input, SECRET);
  const b = buildIdentityTag(input, SECRET);
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{16,}$/);
  // a different viewer => a different tag (forensic attribution)
  const other = buildIdentityTag({ ...input, clientUserId: "u-2" }, SECRET);
  assert.notEqual(a, other);
});

test("buildWatermarkedImageUrl applies a low-opacity Cloudinary text overlay over the asset", () => {
  const url = buildWatermarkedImageUrl({
    cloudName: "demo",
    publicId: "studio/deliverables/logo_v3",
    watermarkText: "ada@studio.test · 2026-06-20",
  });
  assert.ok(url.startsWith("https://res.cloudinary.com/demo/image/upload/"));
  assert.match(url, /l_text:/); // a text layer
  assert.match(url, /o_\d+/); // an opacity transform
  assert.match(url, /studio\/deliverables\/logo_v3$/); // the original asset, last
  // the raw comma/space of the watermark text must be encoded so it doesn't break
  // the transformation segment
  assert.ok(!url.includes("ada@studio.test · 2026"));
});

test("buildWatermarkedImageUrl encodes special characters in the public id safely", () => {
  const url = buildWatermarkedImageUrl({
    cloudName: "demo",
    publicId: "folder/sub asset",
    watermarkText: "tag",
  });
  assert.ok(!url.includes(" ")); // no raw spaces anywhere in the URL
});
