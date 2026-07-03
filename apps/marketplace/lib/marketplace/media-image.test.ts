import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveMarketplaceImageUrl, MARKETPLACE_IMAGE_RULE, MARKETPLACE_IMAGE_BUCKET } from "./media-image";

describe("marketplace image pipeline — pure parts", () => {
  it("passes legacy absolute URLs through and rejects junk", () => {
    assert.equal(
      resolveMarketplaceImageUrl("https://cdn.example.com/x.jpg"),
      "https://cdn.example.com/x.jpg",
    );
    assert.equal(resolveMarketplaceImageUrl("not-a-url"), null);
    assert.equal(resolveMarketplaceImageUrl(""), null);
    assert.equal(resolveMarketplaceImageUrl(null), null);
    assert.equal(resolveMarketplaceImageUrl(undefined), null);
  });

  it("image rule allows buyer-visible photo types only, capped at 8MB", () => {
    assert.ok(MARKETPLACE_IMAGE_RULE.allowedTypes.includes("image/webp"));
    assert.ok(MARKETPLACE_IMAGE_RULE.allowedTypes.includes("image/jpeg"));
    assert.ok(!MARKETPLACE_IMAGE_RULE.allowedTypes.includes("application/pdf"));
    assert.equal(MARKETPLACE_IMAGE_RULE.maxBytes, 8 * 1024 * 1024);
  });

  it("names the public bucket", () => {
    assert.equal(MARKETPLACE_IMAGE_BUCKET, "marketplace-images");
  });
});
