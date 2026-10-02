// V3-MKT-TRUST-01 — seller state parsing, image references, payout eligibility.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { classifyImage, classifyImageSet, storageKeyOf } from "../image-refs";
import { parsePayoutEligibilityFacts, payoutEligibility, type PayoutEligibilityFacts } from "../payout-eligibility";
import { parseSellerGateState, probationProgress } from "../seller-state";

const BASE = "https://proj.supabase.co";
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const REF = `media://public/marketplace-images/product/${OWNER}/abc123-kettle.jpg`;
const URL_FORM = `${BASE}/storage/v1/object/public/marketplace-images/product/${OWNER}/abc123-kettle.jpg`;

function statePayload(overrides: Record<string, unknown> = {}) {
  return {
    vendor: { id: "v1", status: "approved", owner_user_id: OWNER, owner_type: "vendor", seller_tier: "launch" },
    identity_verified: false,
    plan: { listing_cap: 3, listing_rows: 1 },
    probation: {
      tracked: true,
      active: true,
      started_at: "2026-10-01T00:00:00Z",
      age_days: 2,
      caps: {
        max_live_listings: 10,
        max_new_listings_per_day: 5,
        max_price: 500000,
        graduation_min_delivered_orders: 3,
        graduation_min_days: 14,
      },
      live_listings: 4,
      new_listings_24h: 1,
      delivered_orders: 1,
    },
    product: { id: "p1", vendor_id: "v1", approval_status: "approved", created_at: "2026-10-01T00:00:00Z" },
    active_hide: null,
    ...overrides,
  };
}

describe("parseSellerGateState", () => {
  it("parses the RPC payload", () => {
    const state = parseSellerGateState(statePayload());
    assert.ok(state);
    assert.equal(state.vendor.status, "approved");
    assert.equal(state.probation.active, true);
    assert.equal(state.probation.caps.maxPrice, 500000);
    assert.equal(state.plan.listingCap, 3);
    assert.equal(state.product?.approvalStatus, "approved");
    assert.equal(state.activeHide, null);
  });

  it("returns null — never a permissive default — when anything it relies on is missing", () => {
    const broken: unknown[] = [
      null,
      undefined,
      "string",
      [],
      {},
      { vendor: null },
      statePayload({ plan: null }),
      statePayload({ probation: null }),
      statePayload({ identity_verified: "yes" }),
      statePayload({ probation: { ...statePayload().probation, caps: null } }),
      statePayload({ probation: { ...statePayload().probation, active: "true" } }),
      statePayload({ probation: { ...statePayload().probation, live_listings: "many" } }),
      statePayload({
        probation: { ...statePayload().probation, caps: { ...statePayload().probation.caps, max_price: null } },
      }),
    ];
    for (const payload of broken) {
      assert.equal(parseSellerGateState(payload), null, JSON.stringify(payload));
    }
  });

  it("reads an open hide and ignores an unknown hide kind", () => {
    const withHide = parseSellerGateState(
      statePayload({ active_hide: { id: "h1", kind: "reports", reasons: ["reports_threshold", 3], created_at: "x" } }),
    );
    assert.deepEqual(withHide?.activeHide, { id: "h1", kind: "reports", reasons: ["reports_threshold"] });
    const odd = parseSellerGateState(statePayload({ active_hide: { id: "h1", kind: "mystery", reasons: [] } }));
    assert.equal(odd?.activeHide, null);
  });

  it("reports what is left before graduation", () => {
    const state = parseSellerGateState(statePayload());
    assert.deepEqual(probationProgress(state!), {
      identityVerified: false,
      deliveredOrders: 1,
      deliveredOrdersNeeded: 3,
      ageDays: 2,
      ageDaysNeeded: 14,
      liveListings: 4,
      liveListingsCap: 10,
    });
    const graduated = parseSellerGateState(statePayload({ probation: { ...statePayload().probation, active: false } }));
    assert.equal(probationProgress(graduated!), null);
  });
});

describe("image references", () => {
  it("folds the ref and the resolved URL of one upload to the same canonical ref", () => {
    assert.equal(classifyImage(REF, BASE).ref, REF);
    assert.equal(classifyImage(URL_FORM, BASE).ref, REF);
    assert.equal(classifyImage(URL_FORM, BASE).uploaderId, OWNER);
  });

  it("refuses anything that is not a first-party upload", () => {
    const refused = [
      "https://attacker.example/kettle.jpg",
      "https://res.cloudinary.com/attacker/image/upload/kettle.jpg",
      // right path, wrong host
      `https://evil.supabase.co/storage/v1/object/public/marketplace-images/product/${OWNER}/a.jpg`,
      // right host, another bucket
      `${BASE}/storage/v1/object/public/other-bucket/product/${OWNER}/a.jpg`,
      `media://public/other-bucket/product/${OWNER}/a.jpg`,
      // a private ref
      `media://private/marketplace-images/product/${OWNER}/a.jpg`,
      // traversal
      `media://public/marketplace-images/product/${OWNER}/../../secret.jpg`,
      `${BASE}/storage/v1/object/public/marketplace-images/product/%2e%2e/%2e%2e/secret.jpg`,
      "data:image/png;base64,AAAA",
      "javascript:alert(1)",
      "//attacker.example/kettle.jpg",
      "",
    ];
    for (const value of refused) {
      assert.equal(classifyImage(value, BASE).ref, null, value);
    }
  });

  it("an absolute URL is never first-party when the base is unknown", () => {
    assert.equal(classifyImage(URL_FORM, null).ref, null);
    assert.equal(classifyImage(URL_FORM, "").ref, null);
  });

  it("sorts a gallery into refs, external images and foreign uploads", () => {
    const foreign = `media://public/marketplace-images/product/${OTHER}/zzz-copied.jpg`;
    const result = classifyImageSet({
      values: [URL_FORM, REF, "https://attacker.example/x.jpg", foreign],
      publicBaseUrl: BASE,
      allowedUploaders: [OWNER],
    });
    assert.deepEqual(result.refs, [REF, foreign]);
    assert.deepEqual(result.notFirstParty, ["https://attacker.example/x.jpg"]);
    assert.deepEqual(result.foreignRefs, [foreign]);
  });

  it("an upload outside the product prefix has no attributable uploader and is foreign", () => {
    const store = `media://public/marketplace-images/store/${OWNER}/logo.png`;
    const result = classifyImageSet({ values: [store], publicBaseUrl: BASE, allowedUploaders: [OWNER] });
    assert.deepEqual(result.foreignRefs, [store]);
  });

  it("keeps an image the listing already carried", () => {
    const legacy = "https://images.unsplash.com/photo-1";
    const result = classifyImageSet({
      values: [legacy, REF],
      publicBaseUrl: BASE,
      allowedUploaders: [OWNER],
      grandfathered: [legacy],
    });
    assert.deepEqual(result.refs, [legacy, REF]);
    assert.deepEqual(result.notFirstParty, []);
  });

  it("uploader matching is case-insensitive and ignores empty ids", () => {
    const result = classifyImageSet({
      values: [REF],
      publicBaseUrl: BASE,
      allowedUploaders: [null, undefined, "", OWNER.toUpperCase()],
    });
    assert.deepEqual(result.foreignRefs, []);
  });

  it("gives the storage key of a first-party ref only", () => {
    assert.equal(storageKeyOf(REF), `product/${OWNER}/abc123-kettle.jpg`);
    assert.equal(storageKeyOf("https://attacker.example/x.jpg"), null);
  });
});

describe("payoutEligibility", () => {
  const facts = (overrides: Partial<PayoutEligibilityFacts> = {}): PayoutEligibilityFacts => ({
    vendorFound: true,
    vendorStatus: "approved",
    ownerUserId: OWNER,
    identityVerified: true,
    instantOnboarded: true,
    ...overrides,
  });

  it("a verified, active store with no hold is eligible", () => {
    assert.deepEqual(payoutEligibility({ facts: facts(), riskGated: false }), { eligible: true, reasons: [] });
  });

  it("a store opened by instant onboarding must verify identity before a payout", () => {
    const result = payoutEligibility({ facts: facts({ identityVerified: false, instantOnboarded: true }), riskGated: false });
    assert.deepEqual(result, { eligible: false, reasons: ["identity_unverified"] });
  });

  it("a store a person approved already handed over its documents: it is not asked again", () => {
    // Mirrors the database trigger, which only binds stores with a probation row.
    const result = payoutEligibility({ facts: facts({ identityVerified: false, instantOnboarded: false }), riskGated: false });
    assert.deepEqual(result, { eligible: true, reasons: [] });
  });

  it("a staff-applied risk hold blocks, on its own and together with identity", () => {
    assert.deepEqual(payoutEligibility({ facts: facts(), riskGated: true }).reasons, ["risk_hold_active"]);
    assert.deepEqual(
      payoutEligibility({ facts: facts({ identityVerified: false }), riskGated: true }).reasons,
      ["identity_unverified", "risk_hold_active"],
    );
  });

  it("a store that does not exist is not eligible", () => {
    assert.deepEqual(payoutEligibility({ facts: facts({ vendorFound: false }), riskGated: false }).reasons, ["seller_not_active"]);
  });

  it("a store's status is finance's call, as it always was: the gate does not second-guess it", () => {
    assert.deepEqual(payoutEligibility({ facts: facts({ vendorStatus: "suspended" }), riskGated: false }), {
      eligible: true,
      reasons: [],
    });
  });

  it("a staff risk hold blocks a human-approved store too", () => {
    assert.deepEqual(
      payoutEligibility({ facts: facts({ instantOnboarded: false, identityVerified: false }), riskGated: true }).reasons,
      ["risk_hold_active"],
    );
  });

  it("fails closed when the facts could not be read", () => {
    assert.deepEqual(payoutEligibility({ facts: null, riskGated: false }), {
      eligible: false,
      reasons: ["eligibility_unavailable"],
    });
  });

  it("parses the RPC payload and rejects a malformed one", () => {
    assert.deepEqual(
      parsePayoutEligibilityFacts({
        vendor_found: true,
        vendor_status: "approved",
        owner_user_id: OWNER,
        identity_verified: true,
        instant_onboarded: false,
      }),
      facts({ instantOnboarded: false }),
    );
    assert.equal(parsePayoutEligibilityFacts({ vendor_found: false })?.vendorFound, false);
    for (const payload of [null, undefined, "x", [], {}, { vendor_found: true }, { vendor_found: true, identity_verified: "true", instant_onboarded: true }]) {
      assert.equal(parsePayoutEligibilityFacts(payload), null, JSON.stringify(payload));
    }
  });
});
