import { test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeFileName, buildObjectKey } from "../src/key.ts";

test("sanitizeFileName lowercases and path-safes, keeps extension", () => {
  assert.equal(sanitizeFileName("My Photo (1).JPG"), "my-photo-1.jpg");
  assert.equal(sanitizeFileName("..weird..name..png"), "weird-name.png");
  assert.equal(sanitizeFileName(""), "asset");
  assert.equal(sanitizeFileName("noext"), "noext");
});

test("buildObjectKey joins prefix + id + sanitized name", () => {
  assert.equal(
    buildObjectKey({ pathPrefix: "listings/abc", fileName: "Hero.png", id: "abcd1234efgh" }),
    "listings/abc/abcd1234efgh-hero.png",
  );
  assert.equal(buildObjectKey({ fileName: "x.jpg", id: "id1" }), "id1-x.jpg");
});

test("buildObjectKey trims stray slashes in prefix", () => {
  assert.equal(
    buildObjectKey({ pathPrefix: "/listings/abc/", fileName: "p.webp", id: "zz" }),
    "listings/abc/zz-p.webp",
  );
});
