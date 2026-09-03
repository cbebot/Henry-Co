import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskPii, buildContentSnapshot } from "../snapshot";

describe("maskPii", () => {
  it("masks email", () => {
    const out = maskPii("contact seller@gmail.com please");
    assert.ok(!out.includes("seller@gmail.com"));
    assert.ok(out.includes("***@gmail.com"));
  });
  it("masks phone keeping last 4", () => {
    const out = maskPii("call 08031234567");
    assert.ok(!out.includes("08031234567"));
    assert.ok(out.includes("4567"));
  });
  it("masks street address", () => {
    const out = maskPii("come to 14 Allen Avenue");
    assert.ok(out.includes("[address]"));
    assert.ok(!out.includes("14 Allen Avenue"));
  });
  it("leaves clean text untouched", () => {
    assert.equal(maskPii("blue sofa for sale"), "blue sofa for sale");
  });
  it("handles empty", () => assert.equal(maskPii(""), ""));
});

describe("buildContentSnapshot", () => {
  const snap = buildContentSnapshot({
    contentType: "marketplace_listing",
    contentId: "c1",
    text: "call 08031234567 email a@b.com at 14 Allen Avenue",
    imageUrls: ["u1", "u2"],
    locale: "en",
    actorId: "user-1",
  });
  it("carries no raw phone", () => assert.ok(!JSON.stringify(snap).includes("08031234567")));
  it("carries no raw email", () => assert.ok(!JSON.stringify(snap).includes("a@b.com")));
  it("carries no raw address", () => assert.ok(!JSON.stringify(snap).includes("14 Allen Avenue")));
  it("records image count not urls", () => {
    assert.equal(snap.imageCount, 2);
    assert.ok(!JSON.stringify(snap).includes("u1"));
  });
  it("records content type + id", () => {
    assert.equal(snap.contentType, "marketplace_listing");
    assert.equal(snap.contentId, "c1");
  });
});
