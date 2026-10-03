// V3-MKT-TRUST-01 — every gate outcome and every reason code, proven on the pure policy.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AiScanResult } from "@henryco/moderation";

import {
  applyAiSignal,
  codesFromModerationDetail,
  REPORTS_HIDE_THRESHOLD,
  REPORTS_WINDOW_DAYS,
  countIndependentReporters,
  evaluateListingPolicy,
  evaluateStorePolicy,
  rescanDecision,
  mergeDbVerdict,
  unavailableVerdict,
  type GateVerdict,
  type ListingGateInput,
} from "../policy";
import {
  ALL_GATE_REASONS,
  HOLD_REASONS,
  REJECT_REASONS,
  SIGNAL_REASONS,
  composeOutcome,
  reasonClass,
  type GateOutcome,
  type GateReasonCode,
} from "../reasons";
import type { SellerGateState } from "../seller-state";

const REF = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/abc-kettle.jpg";

function seller(overrides: Partial<SellerGateState> = {}): SellerGateState {
  return {
    vendor: { id: "v1", status: "approved", ownerUserId: "u1", ownerType: "vendor", sellerTier: "launch" },
    identityVerified: false,
    plan: { listingCap: 3, listingRows: 1 },
    probation: {
      tracked: false,
      active: false,
      startedAt: null,
      ageDays: 0,
      caps: {
        maxLiveListings: 10,
        maxNewListingsPerDay: 5,
        maxPrice: 500_000,
        graduationMinDeliveredOrders: 3,
        graduationMinDays: 14,
      },
      liveListings: 0,
      newListings24h: 0,
      deliveredOrders: 0,
    },
    product: null,
    activeHide: null,
    ...overrides,
  };
}

function onProbation(extra: Partial<SellerGateState["probation"]> = {}): SellerGateState {
  const base = seller();
  return { ...base, probation: { ...base.probation, tracked: true, active: true, ...extra } };
}

function input(overrides: Partial<ListingGateInput> = {}): ListingGateInput {
  return {
    listing: {
      title: "Stainless steel electric kettle",
      summary: "A two litre kettle with auto shut-off, a concealed element and a one year warranty.",
      description:
        "Boils two litres in under four minutes. Brushed stainless body, cool-touch handle, removable limescale filter, " +
        "360 degree cordless base and boil-dry protection. Comes boxed with a one year replacement warranty.",
      sku: "KET-2000",
      categorySlug: "home-kitchen",
      basePrice: 18500,
      compareAtPrice: null,
      deliveryNote: "Dispatched within 24 hours, delivered in 2 to 4 days.",
      leadTime: "2-4 days",
      specificationValues: ["Stainless steel", "1 year"],
    },
    images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [] },
    seller: seller(),
    vendor: null,
    riskGated: false,
    isLiveEdit: false,
    isNew: true,
    locale: "en",
    ...overrides,
  };
}

function withListing(patch: Partial<ListingGateInput["listing"]>, extra: Partial<ListingGateInput> = {}): ListingGateInput {
  const base = input(extra);
  return { ...base, listing: { ...base.listing, ...patch } };
}

function verdictOf(overrides: Partial<ListingGateInput> = {}): GateVerdict {
  return evaluateListingPolicy(input(overrides));
}

describe("a clean listing publishes", () => {
  it("publishes with no blocking reason", () => {
    const verdict = verdictOf();
    assert.equal(verdict.outcome, "publish");
    assert.deepEqual(
      verdict.reasons.filter((code) => reasonClass(code) !== "signal"),
      [],
    );
  });

  it("publishes for a store that never passed an identity check", () => {
    // Identity is not a listing gate any more: it is checked at payout.
    const verdict = verdictOf({ seller: { ...seller(), identityVerified: false } });
    assert.equal(verdict.outcome, "publish");
  });

  it("a low quality score is advice, never a queue", () => {
    const verdict = evaluateListingPolicy(
      withListing({ sku: "", deliveryNote: "", leadTime: "", summary: "Good kettle for the home." }),
    );
    assert.equal(verdict.outcome, "publish");
    assert.ok(verdict.reasons.includes("thin_listing"));
  });
});

// One producer per reason code. The meta-test below fails if a code is added to
// the vocabulary without a case here.
const CASES: Record<GateReasonCode, () => GateVerdict> = {
  // ---- reject -------------------------------------------------------------
  prohibited_goods: () => evaluateListingPolicy(withListing({ title: "AK-47 rifle, brand new in box" })),
  counterfeit_claim: () => evaluateListingPolicy(withListing({ title: "Rolex Submariner 1:1 copy, mirror quality" })),
  hate_speech: () => evaluateListingPolicy(withListing({ description: "Great kettle. All muslims should die. Buy today." })),
  known_bad_image: () =>
    verdictOf({
      images: {
        refs: [REF],
        notFirstParty: [],
        foreignRefs: [],
        matches: [],
        hashes: ["abcdef0123456789"],
        knownBadHashes: new Set(["abcdef0123456789"]),
      },
    }),
  contact_details: () =>
    evaluateListingPolicy(withListing({ description: "Lovely kettle, boils fast. Call 0803 123 4567 to order today." })),
  off_platform_payment: () =>
    evaluateListingPolicy(withListing({ deliveryNote: "Pay into GTB 0123 456 789 and save the fee." })),
  incomplete_listing: () => verdictOf({ images: { refs: [], notFirstParty: [], foreignRefs: [], matches: [] } }),
  listing_too_long: () => evaluateListingPolicy(withListing({ description: "Stainless kettle. ".repeat(1_200) })),
  price_invalid: () => evaluateListingPolicy(withListing({ basePrice: 0 })),
  image_not_first_party: () =>
    verdictOf({
      images: { refs: [REF], notFirstParty: ["https://attacker.example/kettle.jpg"], foreignRefs: [], matches: [] },
    }),
  plan_listing_limit: () => verdictOf({ seller: seller({ plan: { listingCap: 3, listingRows: 3 } }) }),
  probation_listing_cap: () => verdictOf({ seller: onProbation({ liveListings: 10 }) }),
  probation_daily_cap: () => verdictOf({ seller: onProbation({ liveListings: 4, newListings24h: 5 }) }),
  probation_price_cap: () => evaluateListingPolicy(withListing({ basePrice: 500_001 }, { seller: onProbation() })),
  seller_not_active: () =>
    verdictOf({ seller: seller({ vendor: { ...seller().vendor, status: "suspended" } }) }),
  listing_conflict: () => mergeDbVerdict(verdictOf(), { outcome: "reject", reasons: ["listing_conflict"] }),
  // ---- hold ---------------------------------------------------------------
  restricted_item_review: () => evaluateListingPolicy(withListing({ title: "Arsenal replica jersey, home kit" })),
  profanity: () => evaluateListingPolicy(withListing({ summary: "This shit is the best kettle you will find anywhere in Lagos." })),
  contact_suspected: () =>
    evaluateListingPolicy(withListing({ description: "Lovely kettle, boils fast, see more at https://my-own-shop.example/kettle" })),
  scam_language: () =>
    evaluateListingPolicy(withListing({ description: "Lovely kettle. Verify your account first to unlock the discount price." })),
  duplicate_image_other_seller: () =>
    verdictOf({
      seller: onProbation(),
      images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [{ ref: REF, relation: "other_seller" }] },
    }),
  high_risk_category_probation: () =>
    evaluateListingPolicy(withListing({ categorySlug: "phones-electronics" }, { seller: onProbation() })),
  risk_hold_active: () => verdictOf({ riskGated: true }),
  enforcement_hold_active: () =>
    verdictOf({ seller: seller({ activeHide: { id: "h1", kind: "reports", reasons: ["reports_threshold"] } }) }),
  ai_flagged_scam: () =>
    applyAiSignal(verdictOf(), { recommendation: "hold", reasons: ["ai_flagged_scam"], confidence: 0.9 }),
  ai_flagged_nsfw: () =>
    applyAiSignal(verdictOf(), { recommendation: "hold", reasons: ["ai_flagged_nsfw"], confidence: 0.9 }),
  ai_flagged_abuse: () =>
    applyAiSignal(verdictOf(), { recommendation: "hold", reasons: ["ai_flagged_abuse"], confidence: 0.9 }),
  ai_flagged_other: () => applyAiSignal(verdictOf(), { recommendation: "hold", reasons: [], confidence: 0.4 }),
  gate_unavailable: () => verdictOf({ seller: null }),
  // ---- signal -------------------------------------------------------------
  shared_image: () =>
    verdictOf({ images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [{ ref: REF, relation: "other_seller" }] } }),
  duplicate_image_same_seller: () =>
    verdictOf({ images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [{ ref: REF, relation: "same_seller" }] } }),
  urgency_language: () => evaluateListingPolicy(withListing({ title: "Urgent sale: stainless steel kettle" })),
  pickup_address: () =>
    evaluateListingPolicy(withListing({ deliveryNote: "Pickup available at 12 Allen Avenue, Ikeja, weekdays only." })),
  thin_listing: () => evaluateListingPolicy(withListing({ sku: "", deliveryNote: "", leadTime: "" })),
};

describe("every reason code has a producer, and lands in the right outcome", () => {
  it("the case table covers the whole vocabulary", () => {
    assert.deepEqual(Object.keys(CASES).sort(), [...ALL_GATE_REASONS].sort());
  });

  for (const code of REJECT_REASONS) {
    it(`reject — ${code}`, () => {
      const verdict = CASES[code]();
      assert.ok(verdict.reasons.includes(code), JSON.stringify(verdict));
      assert.equal(verdict.outcome, "reject");
    });
  }
  for (const code of HOLD_REASONS) {
    it(`hold — ${code}`, () => {
      const verdict = CASES[code]();
      assert.ok(verdict.reasons.includes(code), JSON.stringify(verdict));
      assert.equal(verdict.outcome, "hold");
    });
  }
  for (const code of SIGNAL_REASONS) {
    it(`signal only — ${code}`, () => {
      const verdict = CASES[code]();
      assert.ok(verdict.reasons.includes(code), JSON.stringify(verdict));
      assert.equal(verdict.outcome, "publish");
    });
  }
});

describe("probation caps", () => {
  it("apply only while probation is active", () => {
    const tracked = seller();
    const graduated: SellerGateState = {
      ...tracked,
      probation: { ...tracked.probation, tracked: true, active: false, liveListings: 40, newListings24h: 12 },
    };
    const verdict = evaluateListingPolicy(withListing({ basePrice: 900_000, categorySlug: "phones-electronics" }, { seller: graduated }));
    assert.equal(verdict.outcome, "publish");
  });

  it("the price ceiling is inclusive", () => {
    const at = evaluateListingPolicy(withListing({ basePrice: 500_000 }, { seller: onProbation() }));
    const over = evaluateListingPolicy(withListing({ basePrice: 500_001 }, { seller: onProbation() }));
    assert.equal(at.outcome, "publish");
    assert.ok(over.reasons.includes("probation_price_cap"));
  });

  it("the live-listing cap refuses the listing that would exceed it, not the one that reaches it", () => {
    assert.equal(verdictOf({ seller: onProbation({ liveListings: 9 }) }).outcome, "publish");
    assert.ok(verdictOf({ seller: onProbation({ liveListings: 10 }) }).reasons.includes("probation_listing_cap"));
  });

  it("the daily cap refuses the listing after the fifth in 24 hours", () => {
    assert.equal(verdictOf({ seller: onProbation({ newListings24h: 4 }) }).outcome, "publish");
    assert.ok(verdictOf({ seller: onProbation({ newListings24h: 5 }) }).reasons.includes("probation_daily_cap"));
  });

  it("editing a live listing is not counted as a new one", () => {
    const full = onProbation({ liveListings: 10, newListings24h: 5 });
    const verdict = verdictOf({ seller: full, isLiveEdit: true, isNew: false });
    assert.equal(verdict.outcome, "publish");
  });

  it("the price ceiling still binds an edit of a live listing", () => {
    const verdict = evaluateListingPolicy(
      withListing({ basePrice: 750_000 }, { seller: onProbation(), isLiveEdit: true, isNew: false }),
    );
    assert.ok(verdict.reasons.includes("probation_price_cap"));
  });

  it("the caps come from the store state, not from a constant in the policy", () => {
    const tight = onProbation({ liveListings: 2 });
    tight.probation.caps = { ...tight.probation.caps, maxLiveListings: 2, maxPrice: 1000 };
    const verdict = verdictOf({ seller: tight });
    assert.ok(verdict.reasons.includes("probation_listing_cap"));
    assert.ok(verdict.reasons.includes("probation_price_cap"));
  });
});

describe("holds and hides", () => {
  it("a policy hide does not hold the seller's fix: the clean rewrite publishes", () => {
    const verdict = verdictOf({
      seller: seller({ activeHide: { id: "h1", kind: "policy", reasons: ["contact_details"] } }),
      isNew: false,
    });
    assert.equal(verdict.outcome, "publish");
  });

  it("a reports or risk hide always needs a person", () => {
    for (const kind of ["reports", "risk"] as const) {
      const verdict = verdictOf({ seller: seller({ activeHide: { id: "h1", kind, reasons: [] } }), isNew: false });
      assert.equal(verdict.outcome, "hold", kind);
    }
  });

  it("a foreign upload is held as another seller's image", () => {
    const verdict = verdictOf({ images: { refs: [REF], notFirstParty: [], foreignRefs: [REF], matches: [] } });
    assert.ok(verdict.reasons.includes("duplicate_image_other_seller"));
    assert.equal(verdict.outcome, "hold");
  });
});

describe("a picture another store had first", () => {
  const matched = (relation: "foreign_ref" | "other_seller" | "same_seller") => ({
    refs: [REF],
    notFirstParty: [],
    foreignRefs: [],
    matches: [{ ref: REF, relation }],
  });

  it("holds a store on probation — the copied-listing pattern", () => {
    const verdict = verdictOf({ seller: onProbation(), images: matched("other_seller") });
    assert.equal(verdict.outcome, "hold");
    assert.ok(verdict.reasons.includes("duplicate_image_other_seller"));
    assert.ok(!verdict.reasons.includes("shared_image"));
  });

  it("is only a signal for an established store — a shared manufacturer photo", () => {
    const verdict = verdictOf({ images: matched("other_seller") });
    assert.equal(verdict.outcome, "publish");
    assert.ok(verdict.reasons.includes("shared_image"));
    assert.ok(!verdict.reasons.includes("duplicate_image_other_seller"));
  });

  it("a copied REFERENCE holds every store, established or not", () => {
    for (const store of [seller(), onProbation()]) {
      const fromDb = verdictOf({ seller: store, images: matched("foreign_ref") });
      assert.equal(fromDb.outcome, "hold");
      assert.ok(fromDb.reasons.includes("duplicate_image_other_seller"));
      const fromKey = verdictOf({ seller: store, images: { refs: [REF], notFirstParty: [], foreignRefs: [REF], matches: [] } });
      assert.equal(fromKey.outcome, "hold");
    }
  });

  it("reuse across the store's own listings never blocks, and is noted alongside the rest", () => {
    const verdict = verdictOf({
      seller: onProbation(),
      images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [
        { ref: REF, relation: "other_seller" },
        { ref: REF, relation: "same_seller" },
      ] },
    });
    assert.ok(verdict.reasons.includes("duplicate_image_other_seller"));
    assert.ok(verdict.reasons.includes("duplicate_image_same_seller"));
    assert.equal(verdictOf({ seller: onProbation(), images: matched("same_seller") }).outcome, "publish");
  });
});

describe("the store profile check at onboarding", () => {
  const profile = (overrides: Partial<Parameters<typeof evaluateStorePolicy>[0]> = {}) =>
    evaluateStorePolicy({
      storeName: "Adaeze Home & Kitchen",
      categoryFocus: "Kitchenware and small appliances",
      story: "We source durable kitchenware and test every appliance before it ships. Orders leave within a day.",
      locale: "en",
      ...overrides,
    });

  it("an ordinary store profile opens — with no identity document anywhere in the input", () => {
    const verdict = profile();
    assert.equal(verdict.outcome, "publish");
    assert.deepEqual(verdict.reasons.filter((code) => reasonClass(code) !== "signal"), []);
  });

  it("contact details in the story are refused when written plainly", () => {
    for (const story of ["Great store. Call 08031234567 to order.", "Great store. Reach us on 0803 123 4567 any time."]) {
      const verdict = profile({ story });
      assert.equal(verdict.outcome, "reject", story);
      assert.ok(verdict.reasons.includes("contact_details"), story);
    }
  });

  it("disguised contact details in the story go to a person (held, never published)", () => {
    for (const story of [
      "Great store. Reach us on o8o 3123 4567 any time.",
      "Great store. WhatsApp zero eight zero three one two three four five six seven.",
    ]) {
      const verdict = profile({ story });
      assert.equal(verdict.outcome, "hold", story);
      assert.ok(verdict.reasons.includes("contact_suspected"), story);
    }
  });

  it("an account to pay into and prohibited goods are refused; steering with no account is held", () => {
    assert.ok(profile({ story: "Pay into my GTB account 0123456789 and skip the fee." }).reasons.includes("off_platform_payment"));
    assert.equal(profile({ storeName: "AK-47 rifles and ammo depot" }).outcome === "publish", false);
    const steering = profile({ story: "Pay me directly by bank transfer only and skip the fee." });
    assert.equal(steering.outcome, "hold");
    assert.ok(steering.reasons.includes("scam_language"));
  });

  it("a store profile past the size limit is refused before any rule reads it", () => {
    const verdict = profile({ story: "We sell kettles. ".repeat(1_300) });
    assert.equal(verdict.outcome, "reject");
    assert.deepEqual(verdict.reasons, ["listing_too_long"]);
    assert.deepEqual(verdict.moderationDetail, []);
    assert.equal(profile({ storeName: "A".repeat(301) }).outcome, "reject");
    assert.equal(profile({ storeName: "A".repeat(300) }).outcome, "publish");
  });

  it("an ambiguous profile goes to a person rather than opening", () => {
    const verdict = profile({ categoryFocus: "Replica football jerseys" });
    assert.equal(verdict.outcome, "hold");
    assert.ok(verdict.reasons.includes("restricted_item_review"));
  });

  it("the store name is screened too, not just the story", () => {
    assert.equal(profile({ storeName: "Call 08031234567 Stores" }).outcome, "reject");
  });

  it("stores only machine tokens, never the text it read", () => {
    const verdict = profile({ story: "Great store. Call 08031234567 to order." });
    for (const token of verdict.moderationDetail) assert.ok(!/0803/.test(token), token);
  });
});

describe("the sweep's decisions on an already-live listing", () => {
  it("takes down an unambiguous violation the ENGINE let through", () => {
    for (const origin of ["policy_engine", "backfill"]) {
      const decision = rescanDecision({ codes: ["contact_details", "thin_listing"], origin });
      assert.deepEqual(decision, { action: "hide", reasons: ["contact_details"] });
    }
  });

  it("never takes down a listing a PERSON approved — it goes back to a person", () => {
    for (const origin of ["staff_review", "pre_guard_backfill", "platform_catalog", "rescan", null, "something_new"]) {
      const decision = rescanDecision({ codes: ["prohibited_goods"], origin });
      assert.equal(decision.action, "review", String(origin));
      assert.deepEqual(decision.reasons, ["prohibited_goods"]);
    }
  });

  it("an ambiguous finding is a person's call, never a take-down", () => {
    const decision = rescanDecision({ codes: ["restricted_item_review", "profanity"], origin: "policy_engine" });
    assert.equal(decision.action, "review");
    assert.deepEqual(decision.reasons, ["restricted_item_review", "profanity"]);
  });

  it("validation and limit codes are not policy violations: they never take a live listing down", () => {
    for (const code of ["incomplete_listing", "price_invalid", "plan_listing_limit", "probation_daily_cap", "seller_not_active"] as const) {
      assert.equal(rescanDecision({ codes: [code], origin: "policy_engine" }).action, "clear", code);
    }
  });

  it("a clean listing is cleared, signals and all", () => {
    assert.deepEqual(rescanDecision({ codes: ["thin_listing", "urgency_language"], origin: "policy_engine" }), {
      action: "clear",
      reasons: [],
    });
  });

  const at = (day: number) => new Date(Date.UTC(2026, 9, day)).toISOString();
  const none = new Set<string>();

  it("counts people, not reports", () => {
    const reports = [
      { reporterId: "a", createdAt: at(1) },
      { reporterId: "a", createdAt: at(2) },
      { reporterId: "a", createdAt: at(3) },
      { reporterId: "b", createdAt: at(3) },
    ];
    assert.equal(countIndependentReporters(reports, { since: null, excluded: none }), 2);
  });

  it("anonymous reports and other sellers never count", () => {
    const reports = [
      { reporterId: null, createdAt: at(1) },
      { reporterId: "seller-1", createdAt: at(1) },
      { reporterId: "seller-2", createdAt: at(1) },
      { reporterId: "buyer-1", createdAt: at(1) },
    ];
    assert.equal(countIndependentReporters(reports, { since: null, excluded: new Set(["seller-1", "seller-2"]) }), 1);
  });

  it("reports older than the last resolved take-down are not reused", () => {
    const reports = [
      { reporterId: "a", createdAt: at(1) },
      { reporterId: "b", createdAt: at(2) },
      { reporterId: "c", createdAt: at(3) },
      { reporterId: "d", createdAt: at(9) },
    ];
    assert.equal(countIndependentReporters(reports, { since: null, excluded: none }), 4);
    assert.equal(countIndependentReporters(reports, { since: at(5), excluded: none }), 1);
    assert.equal(countIndependentReporters(reports, { since: at(9), excluded: none }), 0);
  });

  it("the threshold is three independent buyers in fourteen days", () => {
    assert.equal(REPORTS_HIDE_THRESHOLD, 3);
    assert.equal(REPORTS_WINDOW_DAYS, 14);
  });
});

describe("text past the size limit is refused before any rule reads it", () => {
  const limits: Array<[string, Partial<ListingGateInput["listing"]>, Partial<ListingGateInput["listing"]>]> = [
    ["title", { title: "K".repeat(300) }, { title: "K".repeat(301) }],
    ["URL handle", { slug: "k".repeat(300) }, { slug: "k".repeat(301) }],
    ["summary", { summary: "S".repeat(1_000) }, { summary: "S".repeat(1_001) }],
    ["SKU", { sku: "K".repeat(1_000) }, { sku: "K".repeat(1_001) }],
    ["delivery note", { deliveryNote: "D".repeat(1_000) }, { deliveryNote: "D".repeat(1_001) }],
    ["lead time", { leadTime: "L".repeat(1_000) }, { leadTime: "L".repeat(1_001) }],
    ["one specification value", { specificationValues: ["V".repeat(1_000)] }, { specificationValues: ["V".repeat(1_001)] }],
    ["all specification values", { specificationValues: Array(20).fill("V".repeat(1_000)) }, { specificationValues: [...Array(20).fill("V".repeat(1_000)), "V"] }],
    ["description", { description: "D".repeat(20_000) }, { description: "D".repeat(20_001) }],
  ];
  for (const [name, at, over] of limits) {
    it(`${name}: at the limit it is read; one character over, it is refused`, () => {
      const read = evaluateListingPolicy(withListing(at));
      assert.ok(!read.reasons.includes("listing_too_long"), JSON.stringify(read.reasons));
      const refused = evaluateListingPolicy(withListing(over));
      assert.equal(refused.outcome, "reject");
      assert.deepEqual(refused.reasons, ["listing_too_long"]);
      assert.deepEqual(refused.signals.moderationDetail, []);
    });
  }

  it("a refusal for size is not a policy violation: the sweep never takes a listing down for it", () => {
    assert.equal(rescanDecision({ codes: ["listing_too_long"], origin: "policy_engine" }).action, "clear");
  });

  it("the refusal is immediate, however long the text", () => {
    const started = performance.now();
    evaluateListingPolicy(withListing({ description: "o8o3 l23 4567 ".repeat(100_000) }));
    assert.ok(performance.now() - started < 500);
  });
});

describe("price sanity", () => {
  it("refuses a 'was' price that is not above the selling price", () => {
    assert.ok(evaluateListingPolicy(withListing({ basePrice: 5000, compareAtPrice: 5000 })).reasons.includes("price_invalid"));
    assert.ok(evaluateListingPolicy(withListing({ basePrice: 5000, compareAtPrice: 4000 })).reasons.includes("price_invalid"));
    assert.equal(evaluateListingPolicy(withListing({ basePrice: 5000, compareAtPrice: 6000 })).outcome, "publish");
  });
  it("refuses non-integer, negative and absurd prices", () => {
    for (const basePrice of [-1, 0, 12.5, Number.NaN, Number.POSITIVE_INFINITY, 2_000_000_000]) {
      assert.ok(evaluateListingPolicy(withListing({ basePrice })).reasons.includes("price_invalid"), String(basePrice));
    }
  });
});

describe("the content ruleset reads every buyer-visible field", () => {
  const fields: Array<[string, Partial<ListingGateInput["listing"]>]> = [
    ["title", { title: "Kettle, call 08031234567 now" }],
    ["summary", { summary: "A kettle. Call 08031234567 to order today, it boils two litres fast." }],
    ["description", { description: "A solid kettle for the home. Call 08031234567 to order it today." }],
    ["delivery note", { deliveryNote: "Call 08031234567 to arrange delivery" }],
    ["lead time", { leadTime: "call 08031234567" }],
    ["sku", { sku: "call-08031234567" }],
    ["specification", { specificationValues: ["Steel", "WhatsApp: 08031234567"] }],
  ];
  for (const [name, patch] of fields) {
    it(`a phone number in the ${name} is caught`, () => {
      const verdict = evaluateListingPolicy(withListing(patch));
      assert.ok(verdict.reasons.includes("contact_details"), JSON.stringify(verdict));
      assert.equal(verdict.outcome, "reject");
    });
  }
});

describe("the AI can only add", () => {
  const ai = (recommendation: AiScanResult["recommendation"], reasons: AiScanResult["reasons"] = []): AiScanResult => ({
    recommendation,
    reasons,
    confidence: 0.99,
  });

  it("an AI approve leaves a publish as a publish", () => {
    const merged = applyAiSignal(verdictOf(), ai("approve"));
    assert.equal(merged.outcome, "publish");
    assert.equal(merged.signals.aiConsulted, true);
  });

  it("an AI hold (or reject) turns a publish into a hold — never into a reject", () => {
    for (const recommendation of ["hold", "reject"] as const) {
      const merged = applyAiSignal(verdictOf(), ai(recommendation, ["ai_flagged_nsfw"]));
      assert.equal(merged.outcome, "hold", recommendation);
      assert.ok(merged.reasons.includes("ai_flagged_nsfw"));
    }
  });

  it("no AI output can turn a deterministic reject into anything else", () => {
    const rejected = CASES.contact_details();
    for (const recommendation of ["approve", "hold", "reject"] as const) {
      const merged = applyAiSignal(rejected, ai(recommendation, ["ai_flagged_scam"]));
      assert.deepEqual(merged, rejected, recommendation);
    }
  });

  it("no AI output can turn a deterministic hold into a publish", () => {
    const held = CASES.restricted_item_review();
    for (const recommendation of ["approve", "hold", "reject"] as const) {
      const merged = applyAiSignal(held, ai(recommendation));
      assert.deepEqual(merged, held, recommendation);
    }
  });

  it("an unavailable AI (null) changes nothing", () => {
    const base = verdictOf();
    assert.deepEqual(applyAiSignal(base, null), base);
  });

  it("only codes from the closed vocabulary are ever added", () => {
    const merged = applyAiSignal(verdictOf(), {
      recommendation: "hold",
      // A jailbroken reply trying to smuggle text into the stored reasons.
      reasons: ["claude-fable; DROP TABLE" as never, "approve" as never, "ai_flagged_scam"],
      confidence: 1,
    });
    assert.deepEqual(
      merged.reasons.filter((code) => reasonClass(code) === "hold"),
      ["ai_flagged_scam"],
    );
  });

  it("exhaustively: applyAiSignal never loosens any producer's outcome", () => {
    const rank: Record<GateOutcome, number> = { publish: 0, hold: 1, reject: 2 };
    for (const code of ALL_GATE_REASONS) {
      const base = CASES[code]();
      for (const recommendation of ["approve", "hold", "reject"] as const) {
        const merged = applyAiSignal(base, ai(recommendation, ["ai_flagged_other"]));
        assert.ok(rank[merged.outcome] >= rank[base.outcome], `${code}/${recommendation}`);
      }
    }
  });
});

describe("merging the database's verdict can only tighten", () => {
  const outcomes: GateOutcome[] = ["publish", "hold", "reject"];
  const rank: Record<GateOutcome, number> = { publish: 0, hold: 1, reject: 2 };
  const bases: Record<GateOutcome, GateVerdict> = {
    publish: verdictOf(),
    hold: CASES.restricted_item_review(),
    reject: CASES.price_invalid(),
  };

  for (const ts of outcomes) {
    for (const db of outcomes) {
      it(`TS ${ts} + DB ${db}`, () => {
        const dbReasons = db === "reject" ? ["probation_price_cap"] : db === "hold" ? ["enforcement_hold_active"] : [];
        const merged = mergeDbVerdict(bases[ts], { outcome: db, reasons: dbReasons });
        assert.ok(rank[merged.outcome] >= Math.max(rank[ts], rank[db]), JSON.stringify(merged));
        assert.equal(merged.outcome, composeOutcome(merged.reasons));
      });
    }
  }

  it("a DB outcome stricter than its codes explain is a hold, never a publish", () => {
    const merged = mergeDbVerdict(verdictOf(), { outcome: "reject", reasons: [] });
    assert.notEqual(merged.outcome, "publish");
    assert.ok(merged.reasons.includes("gate_unavailable"));
  });

  it("an unknown reason code or a malformed payload is a hold, never a publish", () => {
    for (const db of [
      { outcome: "publish", reasons: ["some_new_code"] },
      { outcome: "publish", reasons: "not-an-array" },
      { outcome: "approved", reasons: [] },
      { outcome: undefined, reasons: undefined },
    ]) {
      const merged = mergeDbVerdict(verdictOf(), db);
      assert.equal(merged.outcome, "hold", JSON.stringify(db));
    }
  });

  it("a clean DB publish leaves a clean TS publish alone", () => {
    assert.equal(mergeDbVerdict(verdictOf(), { outcome: "publish", reasons: [] }).outcome, "publish");
  });
});

describe("degraded gate", () => {
  it("an unavailable gate is a hold on any base verdict that would have published", () => {
    assert.equal(unavailableVerdict().outcome, "hold");
    assert.equal(unavailableVerdict(verdictOf()).outcome, "hold");
    assert.equal(unavailableVerdict(CASES.price_invalid()).outcome, "reject");
  });
});

describe("moderation token mapping", () => {
  it("maps each token family", () => {
    assert.deepEqual(codesFromModerationDetail(["banned:drugs"]), ["prohibited_goods"]);
    assert.deepEqual(codesFromModerationDetail(["counterfeit:explicit"]), ["counterfeit_claim"]);
    assert.deepEqual(codesFromModerationDetail(["ambiguous:replica"]), ["restricted_item_review"]);
    assert.deepEqual(codesFromModerationDetail(["hate:slur"]), ["hate_speech"]);
    assert.deepEqual(codesFromModerationDetail(["contact:phone:high"]), ["contact_details"]);
    assert.deepEqual(codesFromModerationDetail(["contact:link:medium"]), ["contact_suspected"]);
    assert.deepEqual(codesFromModerationDetail(["contact:messaging_app:low"]), []);
    assert.deepEqual(codesFromModerationDetail(["scam:payment_diversion"]), ["off_platform_payment"]);
    // Steering with no account to pay into is a hold, never a refusal.
    assert.deepEqual(codesFromModerationDetail(["scam:payment_steering"]), ["scam_language"]);
    assert.deepEqual(codesFromModerationDetail(["scam:phishing"]), ["scam_language"]);
    assert.deepEqual(codesFromModerationDetail(["image:known_bad"]), ["known_bad_image"]);
    assert.deepEqual(codesFromModerationDetail(["signal:urgency", "signal:address"]), ["urgency_language", "pickup_address"]);
  });
  it("an unknown token adds nothing (it can never add a publish)", () => {
    assert.deepEqual(codesFromModerationDetail(["something:new"]), []);
  });
});
