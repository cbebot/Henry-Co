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
  it("rejects a phone number written the standard way", () => {
    for (const text of ["Call 08031234567", "0803 123 4567 for quick response", "0803-123-4567", "+234 803 123 4567"]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", text);
      assert.equal(verdict.unambiguous, true, text);
      assert.ok(verdict.reasons.includes("pii_leak"), text);
      assert.ok(verdict.detail?.includes("contact:phone:high"), text);
    }
  });
  it("holds a phone number rebuilt from a disguise — a person looks, nothing is refused by itself", () => {
    for (const text of [
      "o8o 3123 4567 for quick response",
      "zero eight zero three one two three four five six seven",
      "0 8 0 3 1 2 3 4 5 6 7",
      "0803 na 123 na 4567",
      "Call 0803 (that's MTN), then 123, then 4567",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", `${text} -> ${JSON.stringify(verdict)}`);
      assert.equal(verdict.unambiguous, false, text);
      assert.ok(verdict.detail?.includes("contact:phone:medium"), text);
    }
  });
  it("rejects an email, and an app steer that carries a number or a handle", () => {
    assert.equal(v2("mail ada@example.com").decision, "reject");
    for (const text of ["message me on WhatsApp 08031234567 for discount", "IG @adaobi_store", "my snap: adeshop22"]) {
      const steer = v2(text);
      assert.equal(steer.decision, "reject", text);
      assert.ok(steer.reasons.includes("off_platform_contact"), text);
    }
  });
  it("holds an app steer with no number or handle — a phrase is never refused", () => {
    for (const text of ["message me on WhatsApp for discount", "link in bio", "drop your number make I call you", "IG adeshop"]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", `${text} -> ${JSON.stringify(verdict)}`);
      assert.equal(verdict.unambiguous, false, text);
    }
  });
  it("rejects a handle or a link written the standard way", () => {
    for (const text of ["follow @adaobi_store", "visit adeshop.store", "Visit AdeShop.Store for more designs"]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", `${text} -> ${JSON.stringify(verdict)}`);
    }
  });
  it("holds what merely looks like contact", () => {
    for (const text of ["call 5550101 after six", "see https://my-own-shop.example/item", "follow @adaobi", "IG 👉 adeshop_ng"]) {
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
  it("rejects an account number written as one and named as the place to pay", () => {
    for (const text of [
      "GTB 0123 456 789",
      "GTB 0123456789",
      "Opay: 8031234567",
      "Account: 0123 - 456 - 789 (Access)",
      "send to 0123456789 GTB",
      "Send money to 0123456789",
      "*737*1*5000*0123 456 789#",
      "my aza is 0123456789",
      "wire it to 0123456789",
      "number to credit: 0123456789",
      "0123456789 send alert",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "reject", `${text} -> ${JSON.stringify(verdict)}`);
      assert.ok(verdict.detail?.includes("scam:payment_diversion"), text);
    }
  });
  it("holds an account number a person has to rebuild — never refused by itself", () => {
    for (const text of [
      "Send money to 0123/456/789",
      "acct no 0123,456,789 zenith",
      "Bank: Kuda. Ref: 0123456789.",
      "Opay. Code 8031234567.",
      "first 5 digits 01234, last 5 digits 56789, GTB",
      "GTB: 01234 then 56789",
      "GTB 01 57 39 28 46",
      "GTB 0157 39 28 46",
      "Kuda: 0 157 392 84 6",
      "Account: 01573, 92846 (GTB)",
      "Send to 01-57-39-28-46 (UBA)",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", `${text} -> ${JSON.stringify(verdict)}`);
      assert.ok(!verdict.detail?.includes("scam:payment_diversion"), text);
      assert.ok(verdict.detail?.includes("scam:account_suspected"), `${text} -> ${JSON.stringify(verdict.detail)}`);
    }
  });
  it("prices, landmarks and surnames are not an account number", () => {
    for (const text of [
      "Pay ₦10,000-₦15,000 depending on size.",
      "Installation paid separately: 10,000-15,000 naira.",
      "Pickup beside GTBank, Allen Avenue. Prices ₦10,000-₦15,000 by size.",
      "Shop 12, opposite Zenith Bank, Wuse 2. ₦25,000-₦30,000.",
      "Handmade by Chioma Uba, ₦20,000-₦35,000 depending on size.",
      "Opposite First Bank, Ikeja. ₦25000 then ₦30000 for the bigger size.",
      "Netflix-ready TV; business account invoices for ₦45,000/₦50,000 models.",
      "Pay 15000-25000 depending on size.",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "approve", `${text} -> ${JSON.stringify(verdict)}`);
    }
  });
  it("holds steering with no account number — a phrase is never refused", () => {
    for (const text of [
      "Pay me directly and save",
      "Bank transfer only, no card",
      "Send the money to my account",
      "Pay with crypto for 10% off",
      "Let's deal outside the platform",
      "Opay/Palmpay accepted",
      "make we talk the price outside",
      "drop alert once you pay",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "hold", `${text} -> ${JSON.stringify(verdict)}`);
      assert.ok(verdict.detail?.includes("scam:payment_steering"), text);
      assert.ok(!verdict.detail?.includes("scam:payment_diversion"), text);
    }
  });
  it("ordinary product sentences with payment words pass", () => {
    for (const text of [
      "Heat transfer only works on cotton and polyester blends.",
      "USB cable for data transfer only, it does not fast charge.",
      "Photos transfer directly to your phone over Wi-Fi.",
      "Wire it to the switch in five minutes, no electrician needed.",
      "Pay directly at checkout with any card.",
      "Control the light outside the app with the wall switch.",
      "Forget the app, the remote controls everything.",
      "Skip the fees at the salon and do your nails at home.",
      "Price includes VAT, no service charge.",
      "We supply dealers outside Lagos at wholesale prices.",
      "Best price for outside Lagos buyers is shown at checkout.",
      "This light na outside light, e no fear rain.",
      "The soundbox will send payment alert to your phone for every sale.",
      "Ledger Nano X hardware wallet: send, receive and pay with crypto.",
      "For custom sizes, contact the seller directly through the chat on this page.",
      "A/C compressor for Corolla 2009, Denso 447220-8645.",
      "Zenith Chronomaster Sport, reference 03.3100.3600/69.M3100, full set.",
      "Moniepoint POS terminal, serial 2201 3345 98, with charger and 5 paper rolls.",
      "Ceramic piggy bank in sizes 10 12 14 16 18 cm.",
      "No upfront payment needed before we deliver; pay on delivery is available.",
      "No deposit required before we ship.",
      "Smart lock: reset your password with the master code.",
      "We never ask for your OTP or BVN.",
      "SIM registration needs your NIN slip at pickup.",
    ]) {
      const verdict = v2(text);
      assert.equal(verdict.decision, "approve", `${text} -> ${JSON.stringify(verdict)}`);
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
  it("an AI approve cannot lower a hold for a reconstructed number", () => {
    const r = evaluate(listing("o8o 3123 4567"), { ...opts, aiResult: ai("approve") });
    assert.equal(r.decision, "hold");
  });
  it("carries a version so standing verdicts can be re-scanned when rules move", () => {
    assert.match(LISTING_RULESET_VERSION, /^listing_v2\.\d+$/);
    assert.equal(LISTING_RULESET_VERSION, "listing_v2.3");
  });
});
