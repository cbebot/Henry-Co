// V3-MKT-TRUST-01 — the TypeScript side of adversarial round 5. (The database side is
// proven in mkt_trust_guard_behaviour.sql: R10b, S10d, S17.)

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { evaluateListingPolicy, type ListingGateInput } from "../policy";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const SELLER_ROUTE = codeOnly(read("app/api/seller-applications/route.ts"));
const REF = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/a.jpg";

function input(status: string): ListingGateInput {
  return {
    listing: {
      slug: "stainless-steel-electric-kettle",
      title: "Stainless steel electric kettle",
      summary: "A two litre kettle with auto shut-off and a one year warranty.",
      description: "Boils two litres in under four minutes. Brushed stainless body and a cool-touch handle.",
      sku: "KET-2000",
      categorySlug: "home-kitchen",
      basePrice: 18500,
      compareAtPrice: null,
      deliveryNote: "Dispatched within 24 hours.",
      leadTime: "2-4 days",
      specificationValues: ["Stainless steel"],
    },
    images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [] },
    seller: {
      vendor: { id: "v1", status, ownerUserId: "u1", ownerType: "vendor", sellerTier: "launch" },
      identityVerified: false,
      plan: { listingCap: 50, listingRows: 1 },
      probation: {
        tracked: false,
        active: false,
        startedAt: null,
        ageDays: 0,
        caps: { maxLiveListings: 10, maxNewListingsPerDay: 5, maxPrice: 500_000, graduationMinDeliveredOrders: 3, graduationMinDays: 14 },
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
  } as unknown as ListingGateInput;
}

describe("round 5 — a person's 'no' sends listings to a person; an inactive store cannot publish", () => {
  it("a revoked account's listing is held for a person, not refused", () => {
    const verdict = evaluateListingPolicy(input("revoked"));
    assert.equal(verdict.outcome, "hold", JSON.stringify(verdict.reasons));
    assert.ok(verdict.reasons.includes("risk_hold_active"));
    assert.equal(verdict.reasons.includes("seller_not_active"), false);
  });

  it("a store that is not active is refused", () => {
    const verdict = evaluateListingPolicy(input("suspended"));
    assert.equal(verdict.outcome, "reject");
    assert.ok(verdict.reasons.includes("seller_not_active"));
  });
});

describe("round 5 — a stamped application that is not approved is a person's decision", () => {
  it("the seller route reads the person's stamp, not only the current status", () => {
    assert.ok(SELLER_ROUTE.includes('.select("id, status, submitted_at, agreement_accepted_at, reviewed_by")'));
    assert.ok(SELLER_ROUTE.includes('(Boolean(existing?.reviewed_by) && existingStatus !== "approved");'));
  });
});
