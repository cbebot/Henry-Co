// V3-MKT-TRUST-01 — the content rules against the corpora (see ./corpus.ts).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runDeterministic } from "@henryco/moderation";
import { detectContactDetails } from "@henryco/trust/contact";
import { contentIsHighRisk, evaluateListingPolicy, evaluateStorePolicy, TEXT_LIMITS, type ListingGateInput } from "../policy";
import {
  EVASIONS,
  EVASIONS_R3,
  HIGH_RISK_R3,
  HONEST_STORE_NAMES,
  HONEST_TEXT,
  HONEST_TEXT_R3,
  KNOWN_LIMITS,
  MAY_HOLD,
} from "./corpus";

const REF = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/a.jpg";

function listing(overrides: Partial<ListingGateInput["listing"]> = {}): ListingGateInput {
  return {
    listing: {
      slug: "stainless-steel-electric-kettle",
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
      ...overrides,
    },
    images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [] },
    seller: {
      vendor: { id: "v1", status: "approved", ownerUserId: "u1", ownerType: "vendor", sellerTier: "launch" },
      identityVerified: true,
      plan: { listingCap: 50, listingRows: 1 },
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
    },
    vendor: null,
    riskGated: false,
    isLiveEdit: false,
    isNew: true,
    locale: "en",
  };
}

const BASE = listing().listing;
/** The free-text fields a seller fills in. */
const FIELDS = ["title", "summary", "description", "deliveryNote", "leadTime", "sku"] as const;

describe("content rules: honest listings publish", () => {
  it("the clean listing itself publishes", () => {
    const verdict = evaluateListingPolicy(listing());
    assert.equal(verdict.outcome, "publish", JSON.stringify(verdict.reasons));
  });

  for (const text of HONEST_TEXT) {
    it(`publishes: ${text.slice(0, 60)}`, () => {
      const verdict = evaluateListingPolicy(listing({ description: `${BASE.description} ${text}` }));
      assert.equal(
        verdict.outcome,
        "publish",
        `${JSON.stringify(verdict.reasons)} ${JSON.stringify(verdict.signals.moderationDetail)}`,
      );
    });
  }

  for (const name of HONEST_STORE_NAMES) {
    it(`store name passes: ${name}`, () => {
      const verdict = evaluateStorePolicy({ storeName: name, categoryFocus: "", story: "We sell quality goods.", locale: "en" });
      assert.equal(verdict.outcome, "publish", JSON.stringify(verdict.moderationDetail));
    });
  }
});

describe("content rules: round 3 honest lines publish in the title, the summary and the description", () => {
  for (const text of HONEST_TEXT_R3) {
    it(`publishes: ${text.slice(0, 60)}`, () => {
      for (const field of ["title", "summary", "description"] as const) {
        const verdict = evaluateListingPolicy(listing({ [field]: `${BASE[field]} ${text}` }));
        assert.equal(
          verdict.outcome,
          "publish",
          `${field}: ${JSON.stringify(verdict.reasons)} ${JSON.stringify(verdict.signals.moderationDetail)}`,
        );
      }
      const store = evaluateStorePolicy({ storeName: "Ade Kitchen", categoryFocus: "", story: `We sell kitchen goods. ${text}`, locale: "en" });
      assert.equal(store.outcome, "publish", `store story: ${JSON.stringify(store.moderationDetail)}`);
    });
  }

  for (const text of MAY_HOLD) {
    it(`may hold for a person, never refuses: ${text.slice(0, 60)}`, () => {
      for (const field of ["title", "summary", "description"] as const) {
        const verdict = evaluateListingPolicy(listing({ [field]: `${BASE[field]} ${text}` }));
        assert.notEqual(verdict.outcome, "reject", `${field}: ${JSON.stringify(verdict.reasons)}`);
      }
    });
  }
});

describe("content rules: a very long field cannot stall the request", () => {
  // Each of these took 15 to 45 SECONDS (round 1), or never finished (round 3:
  // a look-alike after a phone number, 100,000 characters killed after 150 s),
  // before the detectors were made linear. The policy now refuses text past the
  // size limit before reading it, so the detectors are timed directly at
  // 100,000 characters, and the policy at the limit. The bound is generous on
  // purpose: it catches a return to quadratic time, not a slow machine.
  const fill = (unit: string, n = 100_000) => unit.repeat(Math.ceil(n / unit.length)).slice(0, n);
  const late = (head: string, mid: string, unit: string, n = 100_000) =>
    fill(head, n / 2) + mid + fill(unit, n / 2 - mid.length);
  const HOSTILE: Record<string, string> = {
    "one long word": "a".repeat(100_000),
    "one long number": "0803".repeat(25_000),
    "dots and letters": "a.".repeat(50_000),
    "a long run before an @": `${"a".repeat(100_000)}@`,
    "number words glued together": "zero".repeat(20_000),
    "look-alike digits": "o8".repeat(50_000),
    "a weak look-alike after a phone number": late("1 ", "08031234567 ", "S7 "),
    "joining words after a mobile prefix": late("1 ", "0803", " x 1"),
    "joining words, spelled out": late("1 ", "0803", " then 1"),
    "number heads joined by a word": fill("0803 a "),
    "pieces placed by words": fill("starts 0803, middle 123, ends 4567, "),
    "one run of prefixes": fill("0803-"),
    "account number groups": fill("0123 456 789 "),
    "USSD stars": `*737*${fill("1*", 99_990)}#`,
    "at signs": fill("@abcde "),
    "contact requests": fill("drop your number "),
    "money verbs": fill("transfer send pay deposit credit to "),
  };
  for (const [name, text] of Object.entries(HOSTILE)) {
    it(`screens ${name} (${text.length} characters) in linear time`, () => {
      let started = performance.now();
      detectContactDetails(text);
      runDeterministic({ contentType: "marketplace_listing", contentId: "t", text, locale: "en" }, { ruleset: "listing_v2" });
      assert.ok(performance.now() - started < 3000, `detectors took ${Math.round(performance.now() - started)} ms`);
      started = performance.now();
      evaluateListingPolicy(listing({ description: text.slice(0, TEXT_LIMITS.long), summary: text.slice(0, TEXT_LIMITS.line) }));
      evaluateStorePolicy({ storeName: "Shop", categoryFocus: "", story: text.slice(0, TEXT_LIMITS.long), locale: "en" });
      assert.ok(performance.now() - started < 3000, `policy took ${Math.round(performance.now() - started)} ms`);
    });
  }
});

describe("content rules: contact details and payment steering never publish", () => {
  for (const payload of EVASIONS) {
    it(`does not publish: ${JSON.stringify(payload).slice(0, 60)}`, () => {
      for (const field of FIELDS) {
        const verdict = evaluateListingPolicy(listing({ [field]: `${BASE[field]} ${payload}` }));
        assert.notEqual(verdict.outcome, "publish", `published in ${field}`);
      }
      const store = evaluateStorePolicy({ storeName: "Ade Shop", categoryFocus: "", story: `We sell kettles. ${payload}`, locale: "en" });
      assert.notEqual(store.outcome, "publish", "published in a store story");
    });
  }

  for (const payload of EVASIONS_R3) {
    it(`does not publish (round 3): ${JSON.stringify(payload).slice(0, 60)}`, () => {
      for (const field of FIELDS) {
        const verdict = evaluateListingPolicy(listing({ [field]: `${BASE[field]} ${payload}` }));
        assert.notEqual(verdict.outcome, "publish", `published in ${field}`);
      }
      const story = evaluateStorePolicy({ storeName: "Ade Shop", categoryFocus: "", story: `We sell kettles. ${payload}`, locale: "en" });
      assert.notEqual(story.outcome, "publish", "published in a store story");
      const name = evaluateStorePolicy({ storeName: `Ade Kitchen ${payload}`, categoryFocus: "", story: "We sell kettles.", locale: "en" });
      assert.notEqual(name.outcome, "publish", "published as a store name");
    });
  }

  it("the documented limits are not also in the must-not-publish list", () => {
    for (const limit of KNOWN_LIMITS) assert.equal(EVASIONS_R3.includes(limit), false, limit);
  });

  it("a number in the listing's URL handle is screened like any other text", () => {
    const verdict = evaluateListingPolicy(listing({ slug: "kettle-call-0803-123-4567" }));
    assert.notEqual(verdict.outcome, "publish");
  });

  it("a number cut in two across fields is held", () => {
    const verdict = evaluateListingPolicy(
      listing({ title: "Stainless steel electric kettle 0803", description: `${BASE.description} Batch 1234567.` }),
    );
    assert.notEqual(verdict.outcome, "publish");
  });

  it("the first half in the URL handle and the rest in the title is held too (wrong order)", () => {
    const verdict = evaluateListingPolicy(
      listing({ slug: "kettle-0803", title: "Stainless steel electric kettle 1234567" }),
    );
    assert.notEqual(verdict.outcome, "publish");
  });

  it('a phone number is not a "was" price', () => {
    const verdict = evaluateListingPolicy(listing({ compareAtPrice: 8031234567 }));
    assert.equal(verdict.outcome, "reject");
    assert.ok(verdict.reasons.includes("price_invalid"));
  });
});

describe("content rules: a new store's phones, consoles and luxury goods are held; other goods are not (round 3)", () => {
  // A store on probation, priced under its cap, so the cap itself never decides.
  for (const item of HIGH_RISK_R3) {
    it(`${item.held ? "held" : "publishes"}: ${item.title}`, () => {
      const base = listing({
        title: item.title,
        summary: "A short summary of the item for buyers.",
        description: item.description ?? "Full description of the item, condition and what is in the box.",
        basePrice: item.price,
      });
      const seller = base.seller as NonNullable<ListingGateInput["seller"]>;
      const verdict = evaluateListingPolicy({
        ...base,
        seller: { ...seller, probation: { ...seller.probation, tracked: true, active: true } },
      });
      assert.equal(verdict.outcome, item.held ? "hold" : "publish", JSON.stringify(verdict.reasons));
      assert.equal(verdict.reasons.includes("high_risk_category_probation"), item.held);
      assert.equal(
        contentIsHighRisk({ title: item.title, summary: "", description: item.description ?? "", basePrice: item.price }),
        item.held,
      );
    });
  }
});
