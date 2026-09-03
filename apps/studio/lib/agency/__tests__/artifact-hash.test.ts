import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hashBundle, verifyArtifactHash, canonicalizeJson } from "@/lib/agency/artifact-hash";

const bundle = {
  siteName: "River Oak",
  sections: [{ kind: "hero", heading: "Hi", body: "there", items: [] }],
  theme: { accent: "#0f766e", surface: "#ffffff", ink: "#0b0f14", fontFamily: "sans" },
};

describe("artifact hash pinning — what was reviewed is what deploys", () => {
  it("hashes identically regardless of key order (canonical)", () => {
    const reordered = {
      theme: { fontFamily: "sans", ink: "#0b0f14", surface: "#ffffff", accent: "#0f766e" },
      sections: [{ items: [], body: "there", heading: "Hi", kind: "hero" }],
      siteName: "River Oak",
    };
    assert.equal(hashBundle(bundle), hashBundle(reordered));
    assert.equal(canonicalizeJson(bundle), canonicalizeJson(reordered));
  });

  it("a one-byte tamper diverges the hash", () => {
    const tampered = { ...bundle, siteName: "River 0ak" };
    assert.notEqual(hashBundle(bundle), hashBundle(tampered));
  });

  it("verifyArtifactHash accepts the matching bundle", () => {
    const h = hashBundle(bundle);
    assert.equal(verifyArtifactHash(h, bundle), true);
  });

  it("verifyArtifactHash REFUSES a post-approval swap", () => {
    const approvedHash = hashBundle(bundle);
    const swapped = { ...bundle, siteName: "Evil Corp" };
    // The deploy step re-hashes the (swapped) stored bundle against the approved
    // hash — it must refuse.
    assert.equal(verifyArtifactHash(approvedHash, swapped), false);
  });

  it("rejects a malformed recorded hash rather than throwing", () => {
    assert.equal(verifyArtifactHash("not-a-hash", bundle), false);
    assert.equal(verifyArtifactHash("", bundle), false);
  });
});
