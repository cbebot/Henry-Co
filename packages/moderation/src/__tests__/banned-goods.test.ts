import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectBannedGoods } from "../deterministic/banned-goods";

describe("detectBannedGoods — drugs (reject)", () => {
  for (const term of [
    "cocaine for sale",
    "buy heroin cheap",
    "crystal meth available",
    "fentanyl powder",
    "mdma pills",
    "selling tramadol in bulk",
    "codeine syrup plug",
    "order weed for sale",
  ]) {
    it(`rejects: ${term}`, () => {
      const v = detectBannedGoods(term);
      assert.equal(v.decision, "reject");
      assert.equal(v.unambiguous, true);
      assert.deepEqual(v.reasons, ["banned_goods"]);
      assert.ok(v.detail?.includes("drugs"));
    });
  }
});

describe("detectBannedGoods — weapons (reject)", () => {
  for (const term of [
    "AK-47 for sale",
    "ar15 rifle available",
    "handgun cheap",
    "live ammunition box",
    "selling a silencer",
    "pipe bomb instructions",
    "brass knuckles",
    "stun gun for protection",
  ]) {
    it(`rejects: ${term}`, () => {
      assert.equal(detectBannedGoods(term).decision, "reject");
    });
  }
});

describe("detectBannedGoods — benign 'gun' compounds (approve)", () => {
  for (const term of [
    "glue gun for crafts",
    "water gun toy",
    "nail gun, barely used",
    "spray gun for painting",
    "heat gun 2000W",
  ]) {
    it(`approves: ${term}`, () => {
      assert.equal(detectBannedGoods(term).decision, "approve");
    });
  }
});

describe("detectBannedGoods — other categories (reject)", () => {
  it("counterfeit", () => {
    const v = detectBannedGoods("1:1 replica rolex, super fake");
    assert.equal(v.decision, "reject");
    assert.ok(v.detail?.includes("counterfeit"));
  });
  it("wildlife", () => {
    assert.equal(detectBannedGoods("genuine ivory and rhino horn").decision, "reject");
  });
  it("human body", () => {
    assert.equal(detectBannedGoods("kidney for sale urgent").decision, "reject");
  });
  it("regulated medicine", () => {
    assert.equal(detectBannedGoods("anabolic steroids no prescription").decision, "reject");
  });
  it("illicit digital", () => {
    assert.equal(detectBannedGoods("credit card dumps and fullz").decision, "reject");
  });
  it("fake id", () => {
    assert.equal(detectBannedGoods("fake passport and driver's license").decision, "reject");
  });
});

describe("detectBannedGoods — clean listings (approve)", () => {
  for (const term of [
    "Vintage acoustic guitar in great condition",
    "Organic shea butter, 500g",
    "Toyota Corolla 2018, low mileage",
    "Handmade beaded necklace",
    "Children's bicycle, red",
    "Office desk and chair set",
  ]) {
    it(`approves: ${term}`, () => {
      const v = detectBannedGoods(term);
      assert.equal(v.decision, "approve");
      assert.deepEqual(v.reasons, []);
    });
  }
  it("approves empty", () => assert.equal(detectBannedGoods("").decision, "approve"));
  it("does not false-positive on 'meth' inside 'method'", () => {
    assert.equal(detectBannedGoods("a fast cooking method").decision, "approve");
  });
  it("does not false-positive on 'ammo' inside 'ammonia'", () => {
    assert.equal(detectBannedGoods("household ammonia cleaner").decision, "approve");
  });
});
