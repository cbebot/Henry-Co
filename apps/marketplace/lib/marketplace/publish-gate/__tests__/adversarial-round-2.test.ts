// V3-MKT-TRUST-01 — one test per finding of adversarial round 2 that lives in
// TypeScript. (The database findings are proven in mkt_trust_guard_behaviour.sql,
// section R; detection findings in corpus.test.ts; the payout rule in
// state-and-eligibility.test.ts.)
//
// Server modules import "server-only", so their invariants are pinned on the
// source text — on call expressions and literal guards, never on a comment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { perceptualDistance, perceptualHashOfGrid } from "../image-fingerprint";
import { contentIsHighRisk, evaluateListingPolicy, evaluateStorePolicy, type ListingGateInput } from "../policy";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const repoRead = (relative: string) => readFileSync(join(process.cwd(), "..", "..", relative), "utf8");
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const ROUTE = codeOnly(read("app/api/marketplace/route.ts"));
const SELLER_ROUTE = codeOnly(read("app/api/seller-applications/route.ts"));
const ONBOARDING = codeOnly(read("lib/marketplace/publish-gate/onboarding.ts"));
const SERVER = codeOnly(read("lib/marketplace/publish-gate/server.ts"));
const BACKFILL = codeOnly(read("scripts/gate-backfill.mts"));
const HUB_DECISION = codeOnly(repoRead("apps/hub/lib/seller-decision-write.ts"));
const HUB_ACTION = codeOnly(repoRead("apps/hub/app/owner/(command)/operations/marketplace-trust/actions.ts"));

const REF = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/a.jpg";

function input(listing: Partial<ListingGateInput["listing"]>): ListingGateInput {
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
      ...listing,
    },
    images: { refs: [REF], notFirstParty: [], foreignRefs: [], matches: [] },
    seller: null,
    vendor: null,
    riskGated: false,
    isLiveEdit: false,
    isNew: true,
    locale: "en",
  };
}

describe("round 2 — instant onboarding opens the store that was screened", () => {
  it("the route screens the store's handle too, and sends the hash of what it screened", () => {
    assert.ok(SELLER_ROUTE.includes("evaluateStorePolicy({ storeName, storeSlug, categoryFocus, story, locale: gateLocale })"));
    assert.ok(SELLER_ROUTE.includes("profileHash: screenedProfileHash({ slug: storeSlug, name: storeName, story: story || null }),"));
  });

  it("the gate passes that hash to the database, which opens the store only if the row still matches", () => {
    assert.ok(ONBOARDING.includes("p_profile_hash: input.profileHash,"));
    assert.ok(ONBOARDING.includes('guardHint(error) === "profile_changed"'));
  });

  it("a number in the store's handle is screened", () => {
    const verdict = evaluateStorePolicy({ storeName: "Ade Shop", storeSlug: "ade-shop-0803-555-0101", categoryFocus: "", story: "We sell kettles.", locale: "en" });
    assert.notEqual(verdict.outcome, "publish");
  });

  it("an account that already owns a store is answered before any hold, and only its OWN application is touched", () => {
    const owned = ONBOARDING.indexOf("const owned = await readOwnedStore(admin, input.actorId);");
    const held = ONBOARDING.indexOf('return { kind: "review", why: "held", reasons };');
    assert.ok(owned > 0 && held > owned, "the store-owner check must come before the hold");
    assert.ok(ONBOARDING.includes('.eq("user_id", input.actorId)'));
  });

  it("a trust-flag read that fails holds the application instead of opening the store", () => {
    const start = ONBOARDING.indexOf("async function hasOpenTrustFlags(");
    const block = ONBOARDING.slice(start, start + 700);
    assert.ok(block.includes("if (error) return true;"));
    assert.ok(block.includes("} catch {\n    return true;\n  }"));
  });
});

describe("round 2 — store approvals cannot hand a store over", () => {
  it("the marketplace console refuses a handle that belongs to another account or the company, before changing anything", () => {
    const check = ROUTE.indexOf('error=store-handle-taken');
    const update = ROUTE.indexOf('.from("marketplace_vendor_applications")\n          .update({\n            status: decision,');
    assert.ok(check > 0 && update > check, "the handle check must come before the application is updated");
    assert.ok(ROUTE.includes('owner.owner_type === "company" || String(owner.owner_user_id || "") !== String(application.user_id || "")'));
  });

  it("no seller role is granted when the store write did not land", () => {
    const guard = ROUTE.indexOf("if (!vendor?.id) {");
    const role = ROUTE.indexOf('await admin.from("marketplace_role_memberships").upsert({\n            user_id: application.user_id,');
    assert.ok(guard > 0 && role > guard);
  });

  it("the hub's approval does the same", () => {
    assert.ok(HUB_DECISION.includes('owner.owner_type === "company" || String(owner.owner_user_id || "") !== String(applicantUserId || "")'));
    const guard = HUB_DECISION.indexOf("if (!vendor?.id) {");
    const role = HUB_DECISION.indexOf('await admin.from("marketplace_role_memberships").upsert({');
    assert.ok(guard > 0 && role > guard);
  });

  it("the owner's take-down page decides take-downs only", () => {
    const hide = HUB_ACTION.indexOf('.from("marketplace_listing_enforcement")');
    const review = HUB_ACTION.indexOf("await applyProductReview({");
    assert.ok(hide > 0 && review > hide);
    assert.ok(HUB_ACTION.includes('.eq("status", "active")'));
  });
});

describe("round 2 — reads that fail never publish", () => {
  it("an image comparison that could not be made holds a probation listing", () => {
    assert.ok(SERVER.includes("if (error || !Array.isArray(data)) return null;"));
    assert.ok(SERVER.includes("unfingerprinted: notCompared,"));
  });

  it("a malformed draft is screened, not thrown on — and the gate holds if the floor ever throws", () => {
    const weird = input({
      title: 12345 as unknown as string,
      summary: null as unknown as string,
      description: { text: "x" } as unknown as string,
      specificationValues: "not an array" as unknown as string[],
    });
    const verdict = evaluateListingPolicy({ ...weird, locale: { bad: true } as unknown as string });
    assert.ok(["publish", "hold", "reject"].includes(verdict.outcome));
    assert.ok(SERVER.includes("verdict = evaluateListingPolicy(policyInput);\n  } catch {\n    verdict = unavailableVerdict();"));
  });
});

describe("round 2 — what the content rules see", () => {
  it("a percent-encoded number in the URL handle is read as the number it is", () => {
    const verdict = evaluateListingPolicy(input({ slug: "raffia-basket-%30%38%30%33%35%35%35%30%31%30%31" }));
    assert.notEqual(verdict.outcome, "publish");
  });

  it("a phone is a phone however its name is spelled, or wherever the name is", () => {
    for (const title of ["i-phone 13 128GB", "iph0ne 13 128GB", "Sam sung Galaxy S22", "Mobile phone 128GB, very clean"]) {
      assert.equal(contentIsHighRisk({ title, summary: "", basePrice: 320_000 }), true, title);
    }
    assert.equal(contentIsHighRisk({ title: "Smart device, like new", summary: "", basePrice: 320_000, slug: "iphone-13-pro-used" }), true);
    assert.equal(contentIsHighRisk({ title: "Nokia 3310 classic", summary: "", basePrice: 70_000 }), true);
  });

  it("an accessory priced as one, or an ordinary word that contains a brand, is not", () => {
    assert.equal(contentIsHighRisk({ title: "Samsung charger 25W", summary: "", basePrice: 60_000 }), false);
    assert.equal(contentIsHighRisk({ title: "Galaxy tab tempered glass protector", summary: "", basePrice: 50_000 }), false);
    assert.equal(contentIsHighRisk({ title: "Opposite-colour wrap dress", summary: "", basePrice: 60_000 }), false);
    assert.equal(contentIsHighRisk({ title: "iPhone 15 Pro Max", summary: "", basePrice: 40_000 }), false, "below the price floor");
  });
});

describe("round 2 — a brighter or darker copy of a picture hashes like the original", () => {
  const grid = (f: (r: number, c: number) => number) => {
    const px = new Uint8Array(72);
    for (let r = 0; r < 8; r += 1) for (let c = 0; c < 9; c += 1) px[r * 9 + c] = Math.max(0, Math.min(255, Math.round(f(r, c))));
    return px;
  };
  const base = (r: number, c: number) => 40 + ((r * 37 + c * 53) % 7) * 18 + c * 6;

  it("scaling every grey level keeps the hash within the match distance", () => {
    const original = perceptualHashOfGrid(grid(base));
    assert.ok(original);
    for (const scale of [0.8, 1.2]) {
      const copy = perceptualHashOfGrid(grid((r, c) => base(r, c) * scale));
      assert.ok(copy);
      assert.ok(perceptualDistance(original!, copy!) <= 4, `scale ${scale}`);
    }
  });
});

describe("round 2 — the held backfill", () => {
  it("its dry run judges pictures exactly as --apply will", () => {
    assert.ok(BACKFILL.includes("const covered = await readStandingMediaRefs(admin, String(product.id));"));
    assert.ok(BACKFILL.includes("existingMedia: existingMedia.filter((ref) => covered.includes(ref)),"));
  });

  it("it records a picture as a store's only when one of the store's own members uploaded it", () => {
    assert.ok(BACKFILL.includes("vendorId: (await isMember(candidate.vendorId, candidate.uploader)) ? candidate.vendorId : null,"));
  });
});
