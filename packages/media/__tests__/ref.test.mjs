import { test } from "node:test";
import assert from "node:assert/strict";

import { isAbsoluteUrl, isMediaRef, buildMediaRef, parseMediaRef } from "../src/ref.ts";

test("isAbsoluteUrl recognizes http(s) only", () => {
  assert.equal(isAbsoluteUrl("https://images.unsplash.com/x.jpg"), true);
  assert.equal(isAbsoluteUrl("http://a.b/c"), true);
  assert.equal(isAbsoluteUrl("media://public/b/k"), false);
  assert.equal(isAbsoluteUrl("listings/x.jpg"), false);
  assert.equal(isAbsoluteUrl(""), false);
});

test("build + parse round-trip (public, nested key)", () => {
  const ref = buildMediaRef({
    visibility: "public",
    bucket: "property-media",
    key: "listings/abc/uuid-photo.jpg",
  });
  assert.equal(ref, "media://public/property-media/listings/abc/uuid-photo.jpg");
  assert.equal(isMediaRef(ref), true);
  assert.deepEqual(parseMediaRef(ref), {
    visibility: "public",
    bucket: "property-media",
    key: "listings/abc/uuid-photo.jpg",
  });
});

test("private ref parses with visibility preserved", () => {
  const ref = buildMediaRef({
    visibility: "private",
    bucket: "property-documents",
    key: "documents/listing-1/proof.pdf",
  });
  assert.equal(parseMediaRef(ref).visibility, "private");
  assert.equal(parseMediaRef(ref).key, "documents/listing-1/proof.pdf");
});

test("buildMediaRef rejects bad inputs", () => {
  // @ts-expect-error invalid visibility
  assert.throws(() => buildMediaRef({ visibility: "secret", bucket: "b", key: "k" }));
  assert.throws(() => buildMediaRef({ visibility: "public", bucket: "a/b", key: "k" }));
  assert.throws(() => buildMediaRef({ visibility: "public", bucket: "b", key: "" }));
});

test("parseMediaRef rejects malformed refs", () => {
  assert.throws(() => parseMediaRef("media://public/onlybucket"));
  assert.throws(() => parseMediaRef("https://example.com/x.jpg"));
  assert.throws(() => parseMediaRef("media://weird/b/k"));
});
