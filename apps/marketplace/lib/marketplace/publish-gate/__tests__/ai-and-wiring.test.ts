// V3-MKT-TRUST-01 — structural proofs about the code paths themselves.
//
// The server modules import "server-only" and cannot be loaded by the test
// runner, so their invariants are pinned on the source text, the way the
// existing platform-invoked AI surfaces pin theirs. The pins are on awaited call
// expressions and literal guards — never on a word a comment could satisfy.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { applyAiSignal, evaluateListingPolicy, type GateVerdict, type ListingGateInput } from "../policy";
import { isInstantPublishAiEnabled, isInstantPublishEnabled } from "../flag";
import { HOLD_REASONS, REJECT_REASONS, composeOutcome } from "../reasons";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
/** Source with line comments and block comments removed. */
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const AI = read("lib/marketplace/publish-gate/ai.ts");
const ROUTE = read("app/api/marketplace/route.ts");
const SELLER_ROUTE = read("app/api/seller-applications/route.ts");
const CRON = read("app/api/cron/marketplace-automation/route.ts");
const UPLOAD = read("app/api/marketplace/images/route.ts");
const GATE_FILES = [
  "lib/marketplace/publish-gate/ai.ts",
  "lib/marketplace/publish-gate/events.ts",
  "lib/marketplace/publish-gate/listing-write.ts",
  "lib/marketplace/publish-gate/onboarding.ts",
  "lib/marketplace/publish-gate/payout.ts",
  "lib/marketplace/publish-gate/server.ts",
  "lib/marketplace/publish-gate/surfaces.ts",
  "lib/marketplace/publish-gate/sweep.ts",
  "lib/marketplace/publish-gate/policy.ts",
  "lib/marketplace/publish-gate/payout-eligibility.ts",
  "lib/marketplace/publish-gate/listing-row.ts",
  "lib/marketplace/publish-gate/messages.ts",
];

describe("the optional AI screen", () => {
  it("is dark by default and needs BOTH its own flag and instant publish", () => {
    assert.equal(isInstantPublishAiEnabled({}), false);
    assert.equal(isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH_AI: "1" }), false);
    assert.equal(isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH: "1" }), false);
    assert.equal(isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH: "1", MARKETPLACE_INSTANT_PUBLISH_AI: "1" }), true);
    for (const value of ["true", "yes", "on", "TRUE", " 1", "1 ", "2", ""]) {
      assert.equal(isInstantPublishEnabled({ MARKETPLACE_INSTANT_PUBLISH: value }), false, JSON.stringify(value));
    }
  });

  it("additionally requires the gateway's own master switch", () => {
    const code = codeOnly(AI);
    assert.ok(code.includes("isInstantPublishAiEnabled(env) && isAiGatewayLive(env)"));
    assert.ok(code.includes("if (!listingScreenEnabled(env)) return null;"));
  });

  it("is server-only from its first line", () => {
    assert.ok(AI.startsWith('import "server-only";'));
  });

  it("runs on the non-billable surface through the no-billing port", () => {
    const code = codeOnly(AI);
    assert.ok(code.includes("{ billing: noBillingPort }"));
    assert.ok(code.includes("surface: LISTING_SCREEN_SURFACE"));
    assert.ok(!code.includes("createPgBillingPort"));
  });

  it("reserves budget on the unified internal ledger BEFORE the provider call, and stops when refused", () => {
    const code = codeOnly(AI);
    const reserve = code.indexOf("await reservePlatformAiSpend(");
    const run = code.indexOf("await runAiTask(");
    assert.ok(reserve > 0 && run > 0, "both calls must exist");
    assert.ok(reserve < run, "the reservation must come first");
    const guard = code.indexOf("if (!reservation.allowed) return null;");
    assert.ok(guard > reserve && guard < run, "the refusal guard must sit between them");
    assert.ok(code.includes('"internal_ai_spend_add"'));
    assert.ok(!code.includes("ai_free_spend_add"), "never the free-AI ledger");
  });

  it("an absent or erroring ledger closes the path (it throws inside the reservation port)", () => {
    const code = codeOnly(AI);
    assert.ok(code.includes('if (error) throw new Error("ledger_error");'));
    assert.ok(code.includes("data == null"));
  });

  it("checks the provider is configured before reserving anything", () => {
    const code = codeOnly(AI);
    assert.ok(code.indexOf("getAiProviderConfig().isConfigured") < code.indexOf("await reservePlatformAiSpend("));
  });

  it("returns a closed vocabulary — never the reply text, the receipt or a model name", () => {
    const code = codeOnly(AI);
    assert.ok(!code.includes("result.value.receipt"));
    assert.ok(!/return\s+result\.value/.test(code));
    assert.ok(!/claude-|anthropic|resolveModelForTier/i.test(code));
    // The only use of the reply is the fail-safe parser.
    assert.equal(code.split("result.value.output").length - 1, 1);
    assert.ok(code.includes("parseListingScreen(result.value.output)"));
  });

  it("only sends pictures served from this deployment's own storage", () => {
    const code = codeOnly(AI);
    assert.ok(code.includes('parsed.protocol === "https:" && parsed.host.toLowerCase() === host'));
  });
});

describe("AI can only add: it never turns a deterministic refusal into a publish", () => {
  const REF = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/a.jpg";
  const base: ListingGateInput = {
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
    seller: {
      vendor: { id: "v1", status: "approved", ownerUserId: "u1", ownerType: "vendor", sellerTier: "launch" },
      identityVerified: false,
      plan: { listingCap: 3, listingRows: 1 },
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
  };

  const everyAiAnswer = [
    null,
    { recommendation: "approve" as const, reasons: [], confidence: 1 },
    { recommendation: "approve" as const, reasons: ["ai_flagged_scam" as const], confidence: 1 },
    { recommendation: "hold" as const, reasons: [], confidence: 0.2 },
    { recommendation: "hold" as const, reasons: ["ai_flagged_nsfw" as const], confidence: 0.9 },
    { recommendation: "reject" as const, reasons: ["ai_flagged_abuse" as const], confidence: 1 },
  ];

  it("for every reject and hold code: no AI answer changes the outcome or removes a reason", () => {
    for (const code of [...REJECT_REASONS, ...HOLD_REASONS]) {
      const verdict: GateVerdict = {
        outcome: composeOutcome([code]),
        reasons: [code],
        signals: { qualityScore: 80, moderationDetail: [], probationActive: false, aiConsulted: false },
      };
      for (const ai of everyAiAnswer) {
        const after = applyAiSignal(verdict, ai);
        assert.equal(after.outcome, verdict.outcome, `${code} + ${JSON.stringify(ai)}`);
        assert.deepEqual(after.reasons, verdict.reasons, `${code} + ${JSON.stringify(ai)}`);
        // Not consulted at all: the object is returned as it was.
        assert.equal(after, verdict);
      }
    }
  });

  it("a real deterministic refusal stays a refusal whatever the screen says", () => {
    const refused = evaluateListingPolicy({
      ...base,
      listing: { ...base.listing, description: `${base.listing.description} Call 08031234567 to order.` },
    });
    assert.equal(refused.outcome, "reject");
    for (const ai of everyAiAnswer) assert.equal(applyAiSignal(refused, ai).outcome, "reject");
  });

  it("on a publish verdict the screen can only add a hold, from a closed vocabulary", () => {
    const clean = evaluateListingPolicy(base);
    assert.equal(clean.outcome, "publish");
    assert.equal(applyAiSignal(clean, null).outcome, "publish");
    assert.equal(applyAiSignal(clean, { recommendation: "approve", reasons: [], confidence: 1 }).outcome, "publish");
    const held = applyAiSignal(clean, { recommendation: "hold", reasons: ["ai_flagged_scam"], confidence: 0.9 });
    assert.equal(held.outcome, "hold");
    assert.ok(held.reasons.includes("ai_flagged_scam"));
    // A reply that tries to name its own code gets the generic one.
    const forged = applyAiSignal(clean, {
      recommendation: "hold",
      reasons: ["publish" as never, "approved" as never],
      confidence: 1,
    });
    assert.equal(forged.outcome, "hold");
    assert.deepEqual(
      forged.reasons.filter((code) => code.startsWith("ai_")),
      ["ai_flagged_other"],
    );
  });

  it("the gate only calls the screen when the deterministic verdict is publish", () => {
    const server = codeOnly(read("lib/marketplace/publish-gate/server.ts"));
    assert.ok(server.includes('if (verdict.outcome === "publish" && request.aiScan) {'));
  });
});

describe("no money path is touched by the gate", () => {
  const MONEY_TOKENS = [
    "payments_private",
    "reserve_wallet_for_ai",
    "post_ai_usage_charge",
    "release_wallet_ai_hold",
    "customer_wallet",
    "advance_payment_intent",
    "journal_entries",
    "apply_wallet_",
    "ledger_post",
  ];

  for (const file of GATE_FILES) {
    it(`${file} references no money object`, () => {
      const source = read(file);
      for (const token of MONEY_TOKENS) assert.ok(!source.includes(token), `${file} contains "${token}"`);
    });
  }

  it("the migration touches no money object either", () => {
    const sql = read("supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql")
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    for (const token of ["payments_private.", "reserve_wallet", "post_ai_usage_charge", "journal_entries", "customer_wallet"]) {
      assert.ok(!sql.includes(token), `migration contains "${token}"`);
    }
    // The payout trigger refuses; it never updates a payout or an order.
    const trigger = sql.slice(sql.indexOf("function public.marketplace_payout_identity_guard"), sql.indexOf("-- 12. Grants") > 0 ? sql.indexOf("12. Grants") : undefined);
    assert.ok(!/update\s+public\.marketplace_payout_requests/i.test(trigger));
    assert.ok(!/update\s+public\.marketplace_order_groups/i.test(trigger));
  });
});

describe("the flag is the only switch: every wired path is behind it", () => {
  it("vendor_product_upsert enters the gate only with the flag on and on Publish", () => {
    assert.ok(
      codeOnly(ROUTE).includes(
        'if (isInstantPublishEnabled() && text(formData, "submission_mode") === "submit" && vendorScopeId) {',
      ),
    );
  });

  it("checkout, payout request and payout decision checks are flag-gated", () => {
    const code = codeOnly(ROUTE);
    assert.ok(code.includes("if (isInstantPublishEnabled()) {\n          const cartLineProductIds"));
    assert.ok(code.includes("if (isInstantPublishEnabled()) {\n          const payoutGate = await readPayoutGate(admin, { vendorId, actorId: viewer.user.id, stage: \"request\" });"));
    assert.ok(code.includes('if (isInstantPublishEnabled() && (decision === "approved" || decision === "released")) {'));
  });

  it("the gate entry points are called from nowhere else in the route", () => {
    const code = codeOnly(ROUTE);
    assert.equal(code.split("instantListingUpsert(").length - 1, 1);
    assert.equal(code.split("cartHasUnavailableListing(").length - 1, 1);
    assert.equal(code.split("readPayoutGate(").length - 1, 2);
  });

  it("onboarding, the sweep and upload fingerprinting are flag-gated", () => {
    const seller = codeOnly(SELLER_ROUTE);
    assert.ok(seller.includes("const instantPublish = isInstantPublishEnabled();"));
    assert.ok(seller.includes('if (instantPublish && mode === "submit") {'));
    assert.ok(seller.includes('if (instantPublish && mode === "submit" && storeVerdict) {'));
    assert.ok(seller.includes('if (mode === "submit" && !instantPublish && missingCriticalDocuments.length > 0) {'));
    assert.ok(codeOnly(CRON).includes("if (isInstantPublishEnabled()) {"));
    assert.ok(codeOnly(UPLOAD).includes('if (scope === "product" && isInstantPublishEnabled()) {'));
  });

  it("the actor is always the session's user, never a posted value", () => {
    const code = codeOnly(ROUTE);
    const start = code.indexOf("const instant = await instantListingUpsert({");
    const call = code.slice(start, code.indexOf("});", start));
    assert.ok(call.includes("actorId: viewer.user.id,"));
    assert.ok(!/actorId:\s*text\(formData/.test(code));
    assert.ok(!/p_actor:\s*text\(/.test(code));
    assert.ok(codeOnly(SELLER_ROUTE).includes("actorId: viewer.user.id,"));
    assert.ok(!/actorId:\s*(payload|String\(payload)/.test(codeOnly(SELLER_ROUTE)));
  });

  it("nothing in the app writes the ledger tables directly", () => {
    for (const file of [...GATE_FILES, "app/api/marketplace/route.ts", "app/api/seller-applications/route.ts"]) {
      const code = codeOnly(read(file));
      for (const table of ["marketplace_listing_gate_verdicts", "marketplace_seller_probation", "marketplace_image_fingerprints", "marketplace_listing_enforcement"]) {
        const writes = new RegExp(`from\\("${table}"\\)\\s*\\.(insert|update|upsert|delete)\\(`);
        assert.ok(!writes.test(code.replace(/\s+/g, " ").replace(/\) \./g, ").")), `${file} writes ${table} directly`);
      }
    }
  });
});
