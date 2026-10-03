// V3-MKT-TRUST-01 — the flag, the reason vocabulary, and its lockstep with the SQL.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { isInstantPublishAiEnabled, isInstantPublishEnabled } from "../flag";
import {
  ALL_GATE_REASONS,
  GATE_ENGINE_VERSION,
  HOLD_REASONS,
  REJECT_REASONS,
  SIGNAL_REASONS,
  blockingReasons,
  composeOutcome,
  isGateReasonCode,
  normalizeReasons,
  reasonClass,
  type GateReasonCode,
} from "../reasons";

const MIGRATION = readFileSync(
  fileURLToPath(
    new URL("../../../../supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql", import.meta.url),
  ),
  "utf8",
);

describe("MARKETPLACE_INSTANT_PUBLISH", () => {
  it("is OFF with an empty environment", () => {
    assert.equal(isInstantPublishEnabled({}), false);
    assert.equal(isInstantPublishAiEnabled({}), false);
  });

  it("is ON only for the exact value 1", () => {
    assert.equal(isInstantPublishEnabled({ MARKETPLACE_INSTANT_PUBLISH: "1" }), true);
    for (const value of ["", "0", "true", "TRUE", "yes", "on", " 1", "1 ", "01", "2", "false"]) {
      assert.equal(isInstantPublishEnabled({ MARKETPLACE_INSTANT_PUBLISH: value }), false, JSON.stringify(value));
    }
  });

  it("is not a NEXT_PUBLIC flag (never inlined into a client bundle)", () => {
    assert.equal(isInstantPublishEnabled({ NEXT_PUBLIC_MARKETPLACE_INSTANT_PUBLISH: "1" }), false);
  });

  it("the AI signal needs instant publish AND its own flag", () => {
    assert.equal(isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH_AI: "1" }), false);
    assert.equal(isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH: "1" }), false);
    assert.equal(
      isInstantPublishAiEnabled({ MARKETPLACE_INSTANT_PUBLISH: "1", MARKETPLACE_INSTANT_PUBLISH_AI: "1" }),
      true,
    );
  });
});

describe("reason vocabulary", () => {
  it("the three classes are disjoint and together make the vocabulary", () => {
    const all = [...REJECT_REASONS, ...HOLD_REASONS, ...SIGNAL_REASONS];
    assert.equal(new Set(all).size, all.length);
    assert.deepEqual([...ALL_GATE_REASONS], all);
  });

  it("every code is an identifier the ledger accepts", () => {
    // The recording RPC enforces this same pattern.
    for (const code of ALL_GATE_REASONS) assert.match(code, /^[a-z][a-z0-9_]{1,47}$/);
  });

  it("classifies every code", () => {
    for (const code of REJECT_REASONS) assert.equal(reasonClass(code), "reject");
    for (const code of HOLD_REASONS) assert.equal(reasonClass(code), "hold");
    for (const code of SIGNAL_REASONS) assert.equal(reasonClass(code), "signal");
  });

  it("recognises codes and nothing else", () => {
    assert.equal(isGateReasonCode("contact_details"), true);
    for (const value of ["", "publish", "approve", "constructor", "toString", "__proto__", 1, null, undefined, {}]) {
      assert.equal(isGateReasonCode(value), false, String(value));
    }
  });

  it("the engine version carries the content ruleset version", () => {
    assert.match(GATE_ENGINE_VERSION, /^mkt_gate_\d+\+listing_v2\.\d+$/);
  });
});

describe("composeOutcome", () => {
  it("nothing blocking publishes", () => {
    assert.equal(composeOutcome([]), "publish");
    assert.equal(composeOutcome([...SIGNAL_REASONS]), "publish");
  });

  it("any hold-class code holds; any reject-class code rejects", () => {
    for (const code of HOLD_REASONS) assert.equal(composeOutcome([code]), "hold", code);
    for (const code of REJECT_REASONS) assert.equal(composeOutcome([code]), "reject", code);
  });

  it("reject beats hold beats signal, in any order", () => {
    for (const reject of REJECT_REASONS) {
      for (const hold of HOLD_REASONS) {
        assert.equal(composeOutcome([hold, reject, "thin_listing"]), "reject");
        assert.equal(composeOutcome(["thin_listing", reject, hold]), "reject");
      }
    }
    assert.equal(composeOutcome(["thin_listing", "profanity"]), "hold");
  });

  it("adding a code never loosens the outcome", () => {
    const rank = { publish: 0, hold: 1, reject: 2 } as const;
    const samples: GateReasonCode[][] = [[], ["thin_listing"], ["profanity"], ["price_invalid"], ["profanity", "price_invalid"]];
    for (const base of samples) {
      for (const extra of ALL_GATE_REASONS) {
        assert.ok(rank[composeOutcome([...base, extra])] >= rank[composeOutcome(base)], `${base}+${extra}`);
      }
    }
  });

  it("normalises to a stable order and hides signals from the blocking list", () => {
    const mixed: GateReasonCode[] = ["thin_listing", "profanity", "price_invalid", "profanity"];
    assert.deepEqual(normalizeReasons(mixed), ["price_invalid", "profanity", "thin_listing"]);
    assert.deepEqual(blockingReasons(mixed), ["price_invalid", "profanity"]);
  });
});

describe("lockstep with the migration", () => {
  it("every reason code the SQL can emit is in the TS vocabulary, in the same class", () => {
    // The recording RPC appends codes with `v_reasons || 'code'::text` or sets
    // `array['code']`, each next to the outcome it forces.
    const emitted = new Map<string, "hold" | "reject">();
    const re = /v_outcome := '(hold|reject)';\s*v_reasons := (?:v_reasons \|\| '([a-z_]+)'::text|array\['([a-z_]+)'\]);/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(MIGRATION)) !== null) {
      emitted.set(match[2] ?? match[3], match[1] as "hold" | "reject");
    }
    assert.deepEqual(
      [...emitted.keys()].sort(),
      [
        "enforcement_hold_active",
        "gate_unavailable",
        "incomplete_listing",
        "listing_conflict",
        "price_invalid",
        "probation_daily_cap",
        "probation_listing_cap",
        "probation_price_cap",
        "seller_not_active",
      ],
    );
    for (const [code, outcome] of emitted) {
      assert.equal(isGateReasonCode(code), true, code);
      assert.equal(reasonClass(code as GateReasonCode), outcome, code);
    }
  });

  it("the guard's refusal hints are reason codes or documented guard hints", () => {
    const hints = [...MIGRATION.matchAll(/hint = '([a-z_]+)'/g)].map((m) => m[1]);
    const guardOnly = new Set([
      "verdict_required",
      "media_not_covered",
      "application_not_submitted",
      "agreement_required",
      "store_identity_incomplete",
      "store_handle_taken",
      "identity_unverified",
      "listing_id_immutable",
      "variants_need_review",
      "prior_human_decision",
      "profile_changed",
      "store_owner_immutable",
      "store_type_immutable",
    ]);
    for (const hint of hints) {
      assert.ok(isGateReasonCode(hint) || guardOnly.has(hint), hint);
    }
  });

  it("the probation numbers live in SQL only (the policy module holds none)", () => {
    const policy = readFileSync(fileURLToPath(new URL("../policy.ts", import.meta.url)), "utf8");
    assert.match(MIGRATION, /'max_live_listings', 10/);
    assert.match(MIGRATION, /'max_new_listings_per_day', 5/);
    assert.match(MIGRATION, /'max_price', 500000/);
    assert.ok(!/maxLiveListings\s*[:=]\s*\d/.test(policy));
    assert.ok(!/maxPrice\s*[:=]\s*\d/.test(policy));
  });

  it("the reason-code pattern is the same on both sides", () => {
    assert.ok(MIGRATION.includes("'^[a-z][a-z0-9_]{1,47}$'"));
  });
});
