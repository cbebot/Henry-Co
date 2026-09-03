import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseProductImageRefs, buildProductMediaRows, MAX_PRODUCT_IMAGES } from "../product-images";

describe("parseProductImageRefs", () => {
  it("parses the ordered JSON array (first = cover)", () => {
    assert.deepEqual(
      parseProductImageRefs('["media://public/a","media://public/b","media://public/c"]', ""),
      ["media://public/a", "media://public/b", "media://public/c"],
    );
  });

  it("falls back to the legacy single image_url when no array", () => {
    assert.deepEqual(parseProductImageRefs("", "media://public/only"), ["media://public/only"]);
  });

  it("falls back to the legacy single when the array is malformed JSON", () => {
    assert.deepEqual(parseProductImageRefs("{not json", "media://public/only"), ["media://public/only"]);
  });

  it("prefers the array over the legacy single when both are present", () => {
    assert.deepEqual(parseProductImageRefs('["media://public/a"]', "media://public/legacy"), ["media://public/a"]);
  });

  it("drops blanks and non-strings, trims, and dedupes preserving order", () => {
    assert.deepEqual(
      parseProductImageRefs('[" media://public/a ","","media://public/a",42,null,"media://public/b"]', ""),
      ["media://public/a", "media://public/b"],
    );
  });

  it("caps at MAX_PRODUCT_IMAGES", () => {
    const many = Array.from({ length: MAX_PRODUCT_IMAGES + 5 }, (_, i) => `media://public/${i}`);
    const out = parseProductImageRefs(JSON.stringify(many), "");
    assert.equal(out.length, MAX_PRODUCT_IMAGES);
    assert.equal(out[0], "media://public/0");
  });

  it("returns an empty array when nothing usable is provided", () => {
    assert.deepEqual(parseProductImageRefs("", ""), []);
    assert.deepEqual(parseProductImageRefs("[]", ""), []);
    assert.deepEqual(parseProductImageRefs('["   ", ""]', ""), []);
  });
});

describe("buildProductMediaRows", () => {
  it("marks only the first as cover, numbers sort_order in order", () => {
    const rows = buildProductMediaRows("prod-1", ["a", "b", "c"]);
    assert.deepEqual(rows, [
      { product_id: "prod-1", url: "a", kind: "image", is_primary: true, sort_order: 0 },
      { product_id: "prod-1", url: "b", kind: "image", is_primary: false, sort_order: 1 },
      { product_id: "prod-1", url: "c", kind: "image", is_primary: false, sort_order: 2 },
    ]);
  });

  it("is empty for an empty gallery", () => {
    assert.deepEqual(buildProductMediaRows("prod-1", []), []);
  });
});
