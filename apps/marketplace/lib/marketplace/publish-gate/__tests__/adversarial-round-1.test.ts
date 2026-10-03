// V3-MKT-TRUST-01 — one test per finding of adversarial round 1 that lives in
// TypeScript. (The database findings are proven in mkt_trust_guard_behaviour.sql,
// section Q; the detection findings in corpus.test.ts.)
//
// Server modules import "server-only", so their invariants are pinned on the
// source text — on call expressions and literal guards, never on a comment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { classifyImage, classifyImageSet, firstPartyMediaBases, isOwnUpload } from "../image-refs";
import { HIGH_RISK_CONTENT_MIN_PRICE, contentIsHighRisk, evaluateListingPolicy, type ListingGateInput } from "../policy";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const ROUTE = codeOnly(read("app/api/marketplace/route.ts"));
const SELLER_ROUTE = codeOnly(read("app/api/seller-applications/route.ts"));
const WRITE = codeOnly(read("lib/marketplace/publish-gate/listing-write.ts"));
const SERVER = codeOnly(read("lib/marketplace/publish-gate/server.ts"));
const AI = codeOnly(read("lib/marketplace/publish-gate/ai.ts"));
const SWEEP = codeOnly(read("lib/marketplace/publish-gate/sweep.ts"));

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const BASE = "https://project.supabase.co";
const CDN = "https://media.henryonyx.com";
const REF = `media://public/marketplace-images/product/${OWNER}/a.jpg`;

function input(overrides: {
  listing?: Partial<ListingGateInput["listing"]>;
  images?: Partial<ListingGateInput["images"]>;
  probation?: boolean;
}): ListingGateInput {
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
      ...overrides.listing,
    },
    images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [], ...overrides.images },
    seller: {
      vendor: { id: "v1", status: "approved", ownerUserId: OWNER, ownerType: "vendor", sellerTier: "launch" },
      identityVerified: false,
      plan: { listingCap: 50, listingRows: 1 },
      probation: {
        tracked: Boolean(overrides.probation),
        active: Boolean(overrides.probation),
        startedAt: null,
        ageDays: 1,
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

describe("round 1 — pictures", () => {
  it("a picture that could not be fingerprinted holds a probation store's listing, not an established one's", () => {
    const held = evaluateListingPolicy(input({ probation: true, images: { unfingerprinted: 1 } }));
    assert.equal(held.outcome, "hold");
    assert.ok(held.reasons.includes("gate_unavailable"));
    const published = evaluateListingPolicy(input({ probation: false, images: { unfingerprinted: 1 } }));
    assert.equal(published.outcome, "publish");
  });

  it("the gate passes the count of pictures it could not compare to the policy", () => {
    // Round 2: a failed registry read counts like a picture that could not be fingerprinted.
    assert.ok(SERVER.includes("const notCompared = fingerprints.missing + (matchRead === null ? images.refs.length : 0);"));
    assert.ok(SERVER.includes("unfingerprinted: notCompared,"));
  });

  it("an edit may only keep pictures the listing's STANDING verdict covers", () => {
    assert.ok(WRITE.includes("existing ? readStandingMediaRefs(admin, existing.id) : Promise.resolve([] as string[]),"));
    assert.ok(WRITE.includes("const coveredMedia = existingMedia.filter((url) => covered.includes(url));"));
    assert.ok(WRITE.includes("existingMedia: coveredMedia,"));
  });

  it("an outside picture a draft left on the row is judged as newly posted", () => {
    // What the gate now sees for a never-live row: nothing is grandfathered.
    const outside = "https://images.example.com/phone.jpg";
    const result = classifyImageSet({ values: [outside], publicBaseUrl: BASE, allowedUploaders: [OWNER], grandfathered: [] });
    assert.deepEqual(result.notFirstParty, [outside]);
    const copied = `media://public/marketplace-images/product/${OTHER}/theirs.jpg`;
    const foreign = classifyImageSet({ values: [copied], publicBaseUrl: BASE, allowedUploaders: [OWNER], grandfathered: [] });
    assert.deepEqual(foreign.foreignRefs, [copied]);
  });

  it("with instant publish on, a draft can only carry first-party uploads or pictures it already has", () => {
    const start = ROUTE.indexOf('let imageRefs = parseProductImageRefs(text(formData, "image_urls"), text(formData, "image_url"));');
    assert.ok(start > 0);
    const block = ROUTE.slice(start, start + 900);
    assert.ok(block.includes("if (isInstantPublishEnabled() && imageRefs.length > 0) {"));
    assert.ok(block.includes("imageRefs = imageRefs.filter((value) => attached.has(value) || classifyImage(value, bases).ref !== null);"));
  });

  it("the storage origin and the delivery base in front of it are both first-party", () => {
    assert.deepEqual(firstPartyMediaBases({ NEXT_PUBLIC_SUPABASE_URL: BASE, MEDIA_PUBLIC_BASE_URL: CDN }), [BASE, CDN]);
    assert.deepEqual(firstPartyMediaBases({ NEXT_PUBLIC_SUPABASE_URL: BASE }), [BASE]);
    const path = `/storage/v1/object/public/marketplace-images/product/${OWNER}/a.jpg`;
    assert.equal(classifyImage(`${BASE}${path}`, [BASE, CDN]).ref, REF);
    assert.equal(classifyImage(`${CDN}${path}`, [BASE, CDN]).ref, REF);
    assert.equal(classifyImage(`${CDN}${path}`, BASE).ref, null);
    assert.equal(classifyImage(`https://evil.example.com${path}`, [BASE, CDN]).ref, null);
  });

  it("a URL with credentials, a look-alike host or another bucket is not first-party", () => {
    const path = `/storage/v1/object/public/marketplace-images/product/${OWNER}/a.jpg`;
    assert.equal(classifyImage(`https://project.supabase.co@evil.example.com${path}`, BASE).ref, null);
    assert.equal(classifyImage(`https://user:pass@project.supabase.co${path}`, BASE).ref, null);
    assert.equal(classifyImage(`https://project.supabase.co.evil.example.com${path}`, BASE).ref, null);
    assert.equal(classifyImage(`${BASE}/storage/v1/object/public/other-bucket/product/${OWNER}/a.jpg`, BASE).ref, null);
    // Dot segments are resolved by URL parsing: the result can never leave the bucket,
    // and what it lands on is nobody's upload (so it is foreign to every store).
    assert.equal(classifyImage(`${BASE}/storage/v1/object/public/marketplace-images/../other-bucket/x.jpg`, BASE).ref, null);
    assert.equal(
      classifyImage(`${BASE}/storage/v1/object/public/marketplace-images/product/${OWNER}/../x.jpg`, BASE).uploaderId,
      null,
    );
    assert.equal(classifyImage(`media://public/marketplace-images/product/${OWNER}/../x.jpg`, BASE).ref, null);
    assert.equal(classifyImage("javascript:alert(1)", BASE).ref, null);
    assert.equal(classifyImage("data:image/png;base64,AAAA", BASE).ref, null);
  });

  it("a store's hero must be the store's own upload, not any object in the bucket", () => {
    assert.equal(isOwnUpload(`media://public/marketplace-images/store/${OWNER}/hero.jpg`, OWNER, BASE), true);
    assert.equal(isOwnUpload(REF, OWNER, BASE), true);
    assert.equal(isOwnUpload(`media://public/marketplace-images/store/${OTHER}/hero.jpg`, OWNER, BASE), false);
    assert.equal(isOwnUpload(`media://public/marketplace-images/product/${OTHER}/a.jpg`, OWNER, BASE), false);
    assert.equal(isOwnUpload("https://images.example.com/hero.jpg", OWNER, BASE), false);
    assert.equal(isOwnUpload(REF, null, BASE), false);
    assert.ok(ROUTE.includes("if (!isOwnUpload(postedHero, viewer.user?.id, firstPartyMediaBases())) {"));
  });
});

describe("round 1 — what a new store is held on", () => {
  it("a phone is a phone whatever category it is filed under", () => {
    const phone = { title: "iPhone 13 128GB", summary: "UK used, battery health 90%", basePrice: 320_000 };
    assert.equal(contentIsHighRisk(phone), true);
    const held = evaluateListingPolicy(
      input({ probation: true, listing: { ...phone, categorySlug: "everyday-tech", slug: "iphone-13-128gb" } }),
    );
    assert.equal(held.outcome, "hold");
    assert.ok(held.reasons.includes("high_risk_category_probation"));
    // …and an established store is not held on it.
    const established = evaluateListingPolicy(
      input({ probation: false, listing: { ...phone, categorySlug: "everyday-tech", slug: "iphone-13-128gb" } }),
    );
    assert.equal(established.outcome, "publish", JSON.stringify(established.reasons));
  });

  it("a phone case is not a phone", () => {
    const cheap = { title: "iPhone 13 silicone case", summary: "Soft-touch cover in six colours", basePrice: 4500 };
    assert.equal(cheap.basePrice < HIGH_RISK_CONTENT_MIN_PRICE, true);
    assert.equal(contentIsHighRisk(cheap), false);
    const verdict = evaluateListingPolicy(
      input({ probation: true, listing: { ...cheap, categorySlug: "accessories", slug: "iphone-13-silicone-case" } }),
    );
    assert.equal(verdict.outcome, "publish", JSON.stringify(verdict.reasons));
  });
});

describe("round 1 — onboarding", () => {
  it("an application a person rejected or sent back is never re-decided by the gate", () => {
    assert.ok(SELLER_ROUTE.includes('const decidedByPerson = existingStatus === "rejected" || existingStatus === "changes_requested";'));
    const branch = SELLER_ROUTE.indexOf('if (instantPublish && mode === "submit" && storeVerdict && decidedByPerson) {');
    const call = SELLER_ROUTE.indexOf("await instantOnboard(admin, {");
    assert.ok(branch > 0 && call > branch, "the prior-decision branch must come before the onboarding call");
  });

  it("an account that already owns a store is answered as such, not as a new opening", () => {
    assert.ok(SELLER_ROUTE.includes('if (result.kind === "already_seller") {'));
    assert.ok(SELLER_ROUTE.includes('onboarding: { opened: result.vendorStatus === "approved", existing: true },'));
    assert.equal(SELLER_ROUTE.includes('result.kind === "opened" || result.kind === "already_seller"'), false);
  });
});

describe("round 1 — what leaves the server", () => {
  it("raw reason codes are not sent to the seller's browser", () => {
    assert.equal(ROUTE.includes("reasons: instant.reasons,\n                notice"), false);
    assert.equal(ROUTE.includes("&reason=${encodeURIComponent(instant.reasons"), false);
    assert.equal(SELLER_ROUTE.includes('code: "store-rejected",\n          reasons:'), false);
    assert.ok(SELLER_ROUTE.includes('code: "store-rejected",\n        },'));
  });
});

describe("round 1 — the optional AI screen and the take-down sweep", () => {
  it("one store's screens are counted on the ledger BEFORE any budget is reserved", () => {
    const count = AI.indexOf("await countRecentAiScreens(createAdminSupabase(), input.vendorId);");
    const reserve = AI.indexOf("await reservePlatformAiSpend({");
    assert.ok(count > 0 && reserve > count);
    assert.ok(AI.includes("if (recent === null || recent >= LISTING_SCREEN_MAX_PER_STORE_PER_DAY) return null;"));
  });

  it("the screen reads every field the deterministic rules read", () => {
    assert.ok(SERVER.includes("text: listingText(policyInput.listing),"));
  });

  it("a take-down is never decided on reporters that could not be checked", () => {
    const start = SWEEP.indexOf("const sellers = new Set<string>();");
    const block = SWEEP.slice(start, start + 1600);
    assert.ok(block.includes("if (error) return;"));
    // Round 2: account age comes from the account (auth), not from a profile row its owner can edit.
    assert.ok(block.includes('admin.rpc("marketplace_gate_established_accounts", {'));
    assert.equal(block.includes('.from("customer_profiles")'), false);
    assert.ok(block.includes("if (ageError || !Array.isArray(accounts)) return;"));
    assert.ok(block.includes("for (const id of reporterIds) if (!established.has(id)) sellers.add(id);"));
    assert.ok(block.includes("} catch {\n    return;\n  }"));
  });
});
