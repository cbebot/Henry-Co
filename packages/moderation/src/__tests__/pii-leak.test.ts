import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectPiiLeak } from "../deterministic/pii-leak";

describe("detectPiiLeak — PII (hold)", () => {
  it("holds an embedded email", () => {
    const v = detectPiiLeak("contact me at seller@gmail.com");
    assert.equal(v.decision, "hold");
    assert.ok(v.reasons.includes("pii_leak"));
    assert.ok(v.detail?.includes("email"));
  });
  it("holds a Nigerian mobile number", () => {
    const v = detectPiiLeak("call 08031234567 to buy");
    assert.equal(v.decision, "hold");
    assert.ok(v.detail?.includes("phone"));
  });
  it("holds an international phone number", () => {
    assert.equal(detectPiiLeak("reach me on +44 7911 123456").decision, "hold");
  });
  it("holds a street address", () => {
    const v = detectPiiLeak("come to 14 Allen Avenue for pickup");
    assert.equal(v.decision, "hold");
    assert.ok(v.detail?.includes("address"));
  });
  it("never auto-rejects PII", () => {
    assert.equal(detectPiiLeak("email a@b.com call 08031234567").unambiguous, false);
  });
});

describe("detectPiiLeak — off-platform contact (hold)", () => {
  it("holds a whatsapp mention", () => {
    const v = detectPiiLeak("message me on whatsapp");
    assert.equal(v.decision, "hold");
    assert.ok(v.reasons.includes("off_platform_contact"));
  });
  it("holds a telegram mention", () => {
    assert.equal(detectPiiLeak("dm me on telegram").decision, "hold");
  });
  it("holds a QR-code bypass", () => {
    assert.equal(detectPiiLeak("scan this qr code to contact").decision, "hold");
  });
});

describe("detectPiiLeak — clean (approve)", () => {
  for (const term of [
    "Selling a blue sofa, great condition",
    "Price is 50000 naira, negotiable",
    "Available this weekend in Lagos",
    "Size medium, cotton blend",
  ]) {
    it(`approves: ${term}`, () => {
      const v = detectPiiLeak(term);
      assert.equal(v.decision, "approve");
      assert.deepEqual(v.reasons, []);
    });
  }
  it("approves empty", () => assert.equal(detectPiiLeak("").decision, "approve"));
  it("does not treat a 5-digit price as a phone", () => {
    assert.equal(detectPiiLeak("only 50000").decision, "approve");
  });
  it("does not treat a year as a phone", () => {
    assert.equal(detectPiiLeak("manufactured in 2018").decision, "approve");
  });
});
