import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../pipeline";
import { runDeterministic, runListingRulesetV2, LISTING_RULESET_VERSION } from "../deterministic/index";
import type { AiScanResult, ModerationInput } from "../types";

const listing = (text: string): ModerationInput => ({
  contentType: "marketplace_listing",
  contentId: "c1",
  text,
  locale: "en",
});

const v2 = (text: string) => runDeterministic(listing(text), { ruleset: "listing_v2" });

describe("listing_v2 — ordinary listings publish", () => {
  const CLEAN = [
    "Gas cooker, 4 burner, with oven",
    "Gas cylinder 12.5kg with regulator",
    "Kill switch for generator",
    "Kills 99.9% of bacteria and germs",
    "Ivory white wedding dress, size 12",
    "Deep tissue massage gun with 6 heads",
    "Hot glue gun with 20 sticks",
    "Pistol grip cordless drill",
    "Exhaust silencer for Toyota Corolla",
    "Generator silencer box",
    "Surge suppressor, 4 way extension",
    "Loud speakers for sale, 15 inch",
    "Igbo traditional attire, isiagu, for sale",
    "LSD limited slip differential for sale",
    "Frozen hash browns, 1kg pack",
    "Molly doll for kids",
    "Weed killer concentrate 1 litre",
    "Roasted seaweed snack",
    "Hemp seed oil shampoo",
    "Gunmetal grey wristwatch",
    "Price is 250000, last price 230000",
    "2019-2023 model, registered 2024",
    "Signal booster antenna for 4G router",
    "This phone works on WhatsApp, Facebook and Instagram",
    "Bitcoin mining rig, 6 GPU",
    "Ledger crypto hardware wallet",
    "Hang women's dresses on this rack",
    "Burn all the calories with this treadmill",
    "Not a stolen phone, comes with receipt",
    "We send ID card holders nationwide",
    "7 days guaranteed returns policy",
    "Sizes 40 41 42 43 44 45 46",
  ];
  for (const text of CLEAN) {
    it(`approves: ${text}`, () => {
      const verdict = v2(text);
      assert.equal(verdict.decision, "approve", JSON.stringify(verdict));
      assert.equal(verdict.unambiguous, false);
    });
  }

  it("urgency and a pickup address are signals, not holds", () => {
    const verdict = v2("Urgent sale! Pick up at 12 Allen Avenue, Ikeja");
    assert.equal(verdict.decision, "approve");
    assert.ok(verdict.detail?.includes("signal:urgency"));
    assert.ok(verdict.detail?.includes("signal:address"));
  });
});

describe("listing_v2 — prohibited goods are refused outright", () => {
  const CASES: Array<[string, string]> = [
    ["AK-47 rifle for sale", "banned:weapons"],
    ["Stun gun for self defence", "banned:weapons"],
    ["Pure cocaine", "banned:drugs"],
    ["Tramadol 225mg", "banned:drugs"],
    ["Weed for sale, fast delivery", "banned:drugs"],
    ["Loud plug in Lekki", "banned:drugs"],
    ["Buy cannabis online", "banned:drugs"],
    ["Elephant tusk carving", "banned:wildlife"],
    ["Genuine ivory bangle", "banned:wildlife"],
    ["Kidney for sale", "banned:human_body"],
    ["Abortion pills available", "banned:regulated_medicine"],
    ["Fake passport and fake ID", "banned:illicit_digital"],
    ["1:1 copy Rolex Submariner", "counterfeit:explicit"],
    ["First copy designer sneakers", "counterfeit:explicit"],
    ["AAA replica handbag", "counterfeit:explicit"],
  ];
  for (const [text, token] of CASES) {
    it(`rejects: ${text}`, () => {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", JSON.stringify(verdict));
      assert.equal(verdict.unambiguous, true);
      assert.ok(verdict.reasons.includes("banned_goods"));
      assert.ok(verdict.detail?.includes(token), JSON.stringify(verdict.detail));
    });
  }
});

describe("listing_v2 — terms with a benign reading hold for a human", () => {
  const CASES: Array<[string, string]> = [
    ["Replica jersey, Arsenal home kit", "ambiguous:replica"],
    ["Air rifle scope 3-9x40", "ambiguous:rifle"],
    ["Leather gun holster", "ambiguous:gun"],
    ["Metal ammo box", "ambiguous:munition"],
    ["Silencer, brand new", "ambiguous:silencer"],
    ["Molly for sale", "ambiguous:drug_slang"],
    ["Cannabis leaf necklace", "ambiguous:cannabis"],
  ];
  for (const [text, token] of CASES) {
    it(`holds: ${text}`, () => {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", JSON.stringify(verdict));
      assert.equal(verdict.unambiguous, false);
      assert.ok(verdict.detail?.includes(token), JSON.stringify(verdict.detail));
    });
  }

  it("profanity holds", () => {
    const verdict = v2("This shit is the best phone case");
    assert.equal(verdict.decision, "hold");
    assert.ok(verdict.reasons.includes("profanity"));
  });
});

describe("listing_v2 — hate", () => {
  it("rejects a slur", () => {
    const verdict = v2("only a retard would miss this deal");
    assert.equal(verdict.decision, "reject");
    assert.ok(verdict.detail?.includes("hate:slur"));
  });
  it("rejects incitement against a named group", () => {
    for (const text of ["kill all the igbos", "all muslims should die", "exterminate those foreigners"]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", text);
      assert.ok(verdict.detail?.includes("hate:construct"), text);
    }
  });
});

describe("listing_v2 — contact details", () => {
  it("rejects an unmistakable phone number, however it is written", () => {
    for (const text of [
      "Call 08031234567",
      "o8o 3123 4567 for quick response",
      "zero eight zero three one two three four five six seven",
      "0 8 0 3 1 2 3 4 5 6 7",
      "+234 803 123 4567",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", text);
      assert.equal(verdict.unambiguous, true, text);
      assert.ok(verdict.reasons.includes("pii_leak"), text);
      assert.ok(verdict.detail?.includes("contact:phone:high"), text);
    }
  });
  it("rejects an email and an app steer", () => {
    assert.equal(v2("mail ada@example.com").decision, "reject");
    const steer = v2("message me on WhatsApp for discount");
    assert.equal(steer.decision, "reject");
    assert.ok(steer.reasons.includes("off_platform_contact"));
  });
  it("holds what merely looks like contact", () => {
    for (const text of ["call 5550101 after six", "see https://my-own-shop.example/item", "follow @adaobi_store"]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", `${text} -> ${JSON.stringify(verdict)}`);
      assert.equal(verdict.unambiguous, false, text);
    }
  });
  it("never puts the matched contact text into detail", () => {
    const verdict = v2("Call 08031234567 or ada@example.com");
    const serialised = JSON.stringify(verdict);
    assert.ok(!serialised.includes("0803"));
    assert.ok(!serialised.includes("example.com"));
  });
});

describe("listing_v2 — scam language", () => {
  it("rejects steering payment off the platform", () => {
    for (const text of [
      "Pay me directly and save",
      "Bank transfer only, no card",
      "Send the money to my account",
      "Pay with crypto for 10% off",
      "Let's deal outside the platform",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", text);
      assert.ok(verdict.detail?.includes("scam:payment_diversion"), text);
    }
  });
  it("holds phishing, identity requests and advance-fee language", () => {
    const cases: Array<[string, string]> = [
      ["Verify your account to claim", "scam:phishing"],
      ["Send me your BVN to register", "scam:identity_request"],
      ["Congratulations you have been selected, claim your prize", "scam:advance_fee"],
    ];
    for (const [text, token] of cases) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", text);
      assert.ok(verdict.detail?.includes(token), text);
    }
  });
});

describe("listing_v2 — known-bad images", () => {
  it("rejects a known-bad image hash", () => {
    const verdict = runListingRulesetV2(listing("Clean kettle"), {
      imageHashes: ["abcdef0123456789"],
      knownBadImageHashes: new Set(["abcdef0123456789"]),
    });
    assert.equal(verdict.decision, "reject");
    assert.ok(verdict.detail?.includes("image:known_bad"));
  });
});

describe("the default ruleset is unchanged", () => {
  it("still behaves the old way when the ruleset is not requested", () => {
    // Pinned on purpose: these are the legacy outcomes the new ruleset fixes.
    assert.equal(runDeterministic(listing("Gas cooker, 4 burner")).decision, "reject");
    assert.equal(runDeterministic(listing("Ivory white wedding dress")).decision, "reject");
    assert.equal(runDeterministic(listing("Price is 250000")).decision, "hold");
    assert.equal(runDeterministic(listing("Deep tissue massage gun")).decision, "reject");
    assert.equal(runDeterministic(listing("2019-2023 model")).decision, "hold");
    assert.equal(runDeterministic(listing("call 08031234567")).decision, "hold");
    // A spelled-out number sails straight through the default ruleset.
    assert.equal(
      runDeterministic(listing("zero eight zero three one two three four five six seven")).decision,
      "approve",
    );
  });
  it("an explicit default is the same as omitting it", () => {
    for (const text of ["Gas cooker", "call 08031234567", "AK-47 for sale", "Beautiful leather bag"]) {
      assert.deepEqual(runDeterministic(listing(text), { ruleset: "default" }), runDeterministic(listing(text)));
    }
  });
});

describe("listing_v2 through the pipeline — the AI can only add", () => {
  const opts = { deterministic: { ruleset: "listing_v2" as const } };
  const ai = (recommendation: AiScanResult["recommendation"]): AiScanResult => ({
    recommendation,
    reasons: ["ai_flagged_scam"],
    confidence: 0.9,
  });

  it("an AI hold turns a clean publish into a hold", () => {
    const r = evaluate(listing("Clean stainless kettle"), { ...opts, aiResult: ai("hold") });
    assert.equal(r.decision, "hold");
    assert.equal(r.scanner, "ai_check");
  });
  it("an AI approve cannot lower a deterministic hold", () => {
    const r = evaluate(listing("Replica jersey"), { ...opts, aiResult: ai("approve") });
    assert.equal(r.decision, "hold");
  });
  it("an AI approve cannot turn a deterministic reject into a publish", () => {
    const r = evaluate(listing("Call 08031234567"), { ...opts, aiResult: ai("approve") });
    assert.equal(r.decision, "reject");
    assert.equal(r.shortCircuited, true);
    assert.equal(r.scanner, "deterministic_rule");
  });
  it("carries a version so standing verdicts can be re-scanned when rules move", () => {
    assert.match(LISTING_RULESET_VERSION, /^listing_v2\.\d+$/);
  });
});
