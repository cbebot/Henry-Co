// V3-MKT-TRUST-01 — the content rules against the two corpora (see ./corpus.ts).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateListingPolicy, evaluateStorePolicy, type ListingGateInput } from "../policy";
import { EVASIONS, HONEST_STORE_NAMES, HONEST_TEXT } from "./corpus";

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

describe("content rules: a very long field cannot stall the request", () => {
  // Each of these took 15 to 45 SECONDS before the detector's patterns were
  // bounded. The limit below is generous on purpose: it catches a return to
  // quadratic time, not a slow machine.
  const HOSTILE: Record<string, string> = {
    "one long word": "a".repeat(100_000),
    "one long number": "0803".repeat(25_000),
    "dots and letters": "a.".repeat(50_000),
    "a long run before an @": `${"a".repeat(100_000)}@`,
    "number words glued together": "zero".repeat(20_000),
    "look-alike digits": "o8".repeat(50_000),
  };
  for (const [name, text] of Object.entries(HOSTILE)) {
    it(`screens ${name} (${text.length} characters) in linear time`, () => {
      const started = performance.now();
      evaluateStorePolicy({ storeName: "Shop", categoryFocus: "", story: text, locale: "en" });
      const elapsed = performance.now() - started;
      assert.ok(elapsed < 3000, `took ${Math.round(elapsed)} ms`);
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
