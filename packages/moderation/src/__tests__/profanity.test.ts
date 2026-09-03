import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectProfanity, normalizeForLexicon } from "../deterministic/profanity";

describe("normalizeForLexicon", () => {
  it("lowercases", () => assert.equal(normalizeForLexicon("ABC"), "abc"));
  it("strips accents", () => assert.equal(normalizeForLexicon("café"), "cafe"));
  it("collapses leet a", () => assert.equal(normalizeForLexicon("h@te"), "hate"));
  it("collapses leet o/i/e/s", () => assert.equal(normalizeForLexicon("$h1t"), "shit"));
  it("collapses repeated letters", () => assert.equal(normalizeForLexicon("shiiit"), "shiit"));
  it("handles empty", () => assert.equal(normalizeForLexicon(""), ""));
});

describe("detectProfanity — hate speech (reject, unambiguous)", () => {
  it("flags a universal slur", () => {
    const v = detectProfanity("you are a retard", "en");
    assert.equal(v.decision, "reject");
    assert.equal(v.unambiguous, true);
    assert.deepEqual(v.reasons, ["hate_speech"]);
    assert.equal(v.severity, "critical");
  });
  it("flags leetspeak-obfuscated slur", () => {
    const v = detectProfanity("f@gg0t", "en");
    assert.equal(v.decision, "reject");
  });
  it("flags a hate construct without a slur", () => {
    const v = detectProfanity("kill all immigrants", "en");
    assert.equal(v.decision, "reject");
    assert.ok(v.detail?.includes("hate_construct"));
  });
  it("flags 'go back to your country'", () => {
    assert.equal(detectProfanity("just go back to your country", "en").decision, "reject");
  });
  it("flags a French slur in fr locale", () => {
    assert.equal(detectProfanity("sale pede", "fr").decision, "reject");
  });
  it("flags a Spanish slur in es locale", () => {
    assert.equal(detectProfanity("eres un maricon", "es").decision, "reject");
  });
  it("flags a German slur in de locale", () => {
    assert.equal(detectProfanity("du kanake", "de").decision, "reject");
  });
  it("flags an Arabic slur in ar locale (substring/non-latin)", () => {
    assert.equal(detectProfanity("يا khawal", "ar").decision, "reject");
  });
});

describe("detectProfanity — profanity (hold)", () => {
  it("holds common English profanity", () => {
    const v = detectProfanity("this is shit", "en");
    assert.equal(v.decision, "hold");
    assert.deepEqual(v.reasons, ["profanity"]);
    assert.equal(v.severity, "medium");
  });
  it("holds locale-specific French profanity", () => {
    assert.equal(detectProfanity("quelle merde", "fr").decision, "hold");
  });
  it("holds Hindi profanity", () => {
    assert.equal(detectProfanity("tu chutiya hai", "hi").decision, "hold");
  });
  it("holds Chinese profanity (substring locale)", () => {
    assert.equal(detectProfanity("你是傻屄", "zh").decision, "hold");
  });
});

describe("detectProfanity — clean text (approve)", () => {
  it("approves a clean listing", () => {
    const v = detectProfanity("Beautiful handmade leather bag, gently used", "en");
    assert.equal(v.decision, "approve");
    assert.deepEqual(v.reasons, []);
  });
  it("approves clean French", () => {
    assert.equal(detectProfanity("sac en cuir fait main", "fr").decision, "approve");
  });
  it("approves empty text", () => {
    assert.equal(detectProfanity("", "en").decision, "approve");
  });
  it("does not false-positive on 'class' (contains no slur)", () => {
    assert.equal(detectProfanity("a first class product", "en").decision, "approve");
  });
  it("does not false-positive on 'assistant'", () => {
    assert.equal(detectProfanity("virtual assistant services", "en").decision, "approve");
  });
  it("does not false-positive on 'Scunthorpe' place name", () => {
    assert.equal(detectProfanity("shipping from Scunthorpe", "en").decision, "approve");
  });
  it("does not false-positive on 'cockpit'", () => {
    assert.equal(detectProfanity("flight simulator cockpit", "en").decision, "approve");
  });
});

describe("detectProfanity — locale fallback", () => {
  it("falls back to universal list for unknown locale", () => {
    assert.equal(detectProfanity("you retard", "xx").decision, "reject");
  });
  it("defaults locale to en when omitted", () => {
    assert.equal(detectProfanity("this is shit").decision, "hold");
  });
  it("parses region-tagged locale (fr-CA)", () => {
    assert.equal(detectProfanity("quelle merde", "fr-CA").decision, "hold");
  });
});
