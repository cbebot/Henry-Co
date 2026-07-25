import { test } from "node:test";
import assert from "node:assert/strict";

import { applyDiversityGuard, selectDeals } from "../engine";
import type { DealCandidate } from "../types";
import { buildImpressionBatch } from "../impressions";
import { henryEventNameSchema } from "../../index";

/**
 * V3-35 gate — executable proof of the pass guarantees: deterministic floor
 * with all flags dark, consent suppresses targeting, opaque projection (no
 * numeric score / creator key serialized), reader failure never breaks the
 * floor, no cross-user leak by construction (injected readers only), the
 * diversity guard caps consecutive same-creator cards, and the impression
 * batch budget holds.
 */

function candidate(
  over: Partial<DealCandidate> & { id: string; score: number },
): DealCandidate {
  return {
    id: over.id,
    title: over.title ?? `Deal ${over.id}`,
    description: over.description,
    terms: over.terms ?? { kind: "percent_off", percent: 10 },
    division: over.division ?? "marketplace",
    categories: over.categories ?? [],
    ctaHref: over.ctaHref ?? `/deals/${over.id}`,
    endsAt: over.endsAt ?? "2026-08-01T00:00:00.000Z",
    creatorKey: over.creatorKey ?? "platform",
    reasonCodes: over.reasonCodes ?? ["division_local"],
    score: over.score,
    tier: over.tier ?? "floor",
    origin: over.origin ?? "test",
  };
}

const reader = (rows: DealCandidate[]) => async () => rows;

// ── 1. Deterministic floor — complete and stable with consent OFF ────────────

test("V3-35: deterministic floor — consent off ⇒ floor only, score-desc, stable", async () => {
  const floor = reader([
    candidate({ id: "a", score: 0.2 }),
    candidate({ id: "b", score: 0.9, creatorKey: "p1" }),
    candidate({ id: "c", score: 0.5, creatorKey: "p2" }),
  ]);
  const targeted = reader([candidate({ id: "t", score: 1.0, tier: "targeted" })]);

  const result = await selectDeals({
    viewerId: "u1",
    consentAllowed: false,
    readers: { floor: [floor], targeted: [targeted] },
    limit: 6,
  });
  assert.deepEqual(
    result.deals.map((d) => d.id),
    ["b", "c", "a"],
    "floor sorts by score descending; targeted candidates never admitted",
  );
  assert.equal(result.targeted, false);

  const again = await selectDeals({
    viewerId: "u1",
    consentAllowed: false,
    readers: { floor: [floor], targeted: [targeted] },
    limit: 6,
  });
  assert.deepEqual(again.deals.map((d) => d.id), ["b", "c", "a"], "same inputs ⇒ same order");
});

// ── 2. Consent admits targeting; opt-out ACTUALLY suppresses it ──────────────

test("V3-35: consent gate — targeted readers run only with consent", async () => {
  const floor = reader([candidate({ id: "f", score: 0.4 })]);
  let targetedReads = 0;
  const targeted = async () => {
    targetedReads += 1;
    return [candidate({ id: "t", score: 0.9, tier: "targeted", creatorKey: "p9" })];
  };

  const withConsent = await selectDeals({
    viewerId: "u1",
    consentAllowed: true,
    readers: { floor: [floor], targeted: [targeted] },
  });
  assert.deepEqual(withConsent.deals.map((d) => d.id), ["t", "f"]);
  assert.equal(withConsent.targeted, true);
  assert.equal(targetedReads, 1);

  const withoutConsent = await selectDeals({
    viewerId: "u1",
    consentAllowed: false,
    readers: { floor: [floor], targeted: [targeted] },
  });
  assert.deepEqual(withoutConsent.deals.map((d) => d.id), ["f"]);
  assert.equal(withoutConsent.targeted, false);
  assert.equal(targetedReads, 1, "opt-out means the targeted reader NEVER executes");
});

// ── 3. Opaque projection — no score/tier/origin/creatorKey serialized ────────

test("V3-35: opacity — the public offer carries reason codes, never the score", async () => {
  const result = await selectDeals({
    viewerId: "u1",
    consentAllowed: true,
    readers: {
      floor: [reader([candidate({ id: "a", score: 0.7, creatorKey: "p1" })])],
      targeted: [],
    },
  });
  const offer = result.deals[0] as unknown as Record<string, unknown>;
  for (const forbidden of ["score", "tier", "origin", "creatorKey"]) {
    assert.equal(
      forbidden in offer,
      false,
      `public DealOffer must not carry '${forbidden}'`,
    );
  }
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("0.7"), false, "the numeric score never serializes");
  assert.ok((offer.reasonCodes as string[]).length > 0, "reason codes present");
});

// ── 4. Reader failure never breaks the floor ─────────────────────────────────

test("V3-35: degraded reader — a throwing reader contributes nothing, floor stands", async () => {
  const broken = async (): Promise<DealCandidate[]> => {
    throw new Error("table absent on prod");
  };
  const result = await selectDeals({
    viewerId: "u1",
    consentAllowed: true,
    readers: {
      floor: [broken, reader([candidate({ id: "ok", score: 0.5 })])],
      targeted: [broken],
    },
  });
  assert.deepEqual(result.deals.map((d) => d.id), ["ok"]);
});

// ── 5. No cross-user leak by construction ────────────────────────────────────

test("V3-35: leak-proof — the engine surfaces ONLY what injected readers returned", async () => {
  // The 'stranger' viewer's readers return nothing (RLS/viewer-scoped reads
  // upstream) — the engine has no table access, so nothing else can appear.
  const result = await selectDeals({
    viewerId: "stranger",
    consentAllowed: true,
    readers: { floor: [reader([])], targeted: [reader([])] },
  });
  assert.deepEqual(result.deals, []);
});

// ── 6. Diversity guard — cap consecutive same-creator cards ──────────────────

test("V3-35: diversity guard — no creator holds consecutive slots while an alternative exists", async () => {
  const ranked = [
    candidate({ id: "a1", score: 0.9, creatorKey: "A" }),
    candidate({ id: "a2", score: 0.8, creatorKey: "A" }),
    candidate({ id: "a3", score: 0.7, creatorKey: "A" }),
    candidate({ id: "b1", score: 0.6, creatorKey: "B" }),
    candidate({ id: "b2", score: 0.5, creatorKey: "B" }),
  ];
  const guarded = applyDiversityGuard(ranked, 1);
  const creators = guarded.map((c) => c.creatorKey);
  for (let i = 1; i < creators.length; i += 1) {
    const remainingAfter = creators.slice(i);
    if (creators[i] === creators[i - 1]) {
      // A run is only allowed when no alternative creator remained.
      assert.equal(
        remainingAfter.every((k) => k === creators[i]),
        true,
        `run at index ${i} while an alternative creator remained`,
      );
    }
  }
  assert.equal(guarded.length, ranked.length, "the guard reorders, never drops");
  // The guard flows into selectDeals: the top slots must interleave A,B.
  const viaEngine = await selectDeals({
    viewerId: "u1",
    consentAllowed: false,
    readers: { floor: [reader(ranked)], targeted: [] },
    limit: 4,
    maxConsecutivePerCreator: 1,
  });
  assert.deepEqual(
    viaEngine.deals.map((d) => d.id),
    ["a1", "b1", "a2", "b2"],
    "guard pulls the alternative creator into the visible window",
  );
});

// ── 7. Dedupe — id and ctaHref each appear once, highest rank wins ───────────

test("V3-35: dedupe — duplicate ids/hrefs collapse to the highest-ranked copy", async () => {
  const result = await selectDeals({
    viewerId: "u1",
    consentAllowed: true,
    readers: {
      floor: [reader([candidate({ id: "a", score: 0.3 })])],
      targeted: [
        reader([
          candidate({ id: "a", score: 0.9, tier: "targeted", reasonCodes: ["recent_division_activity"] }),
          candidate({ id: "b", score: 0.5, tier: "targeted", ctaHref: "/deals/a" }),
        ]),
      ],
    },
  });
  assert.deepEqual(result.deals.map((d) => d.id), ["a"]);
  assert.deepEqual(result.deals[0].reasonCodes, ["recent_division_activity"], "highest-ranked copy wins");
});

// ── 8. Impression batch budget ───────────────────────────────────────────────

test("V3-35: impression budget — batch dedupes and caps, server-driven only", () => {
  const entries = Array.from({ length: 100 }, (_, i) => ({
    dealId: `d${i % 5}`,
    userId: "u1",
    surface: "all_deals" as const,
  }));
  const batch = buildImpressionBatch(entries);
  assert.equal(batch.length, 5, "duplicates within a render collapse");

  const flood = Array.from({ length: 100 }, (_, i) => ({
    dealId: `d${i}`,
    userId: null,
    surface: "division_mini" as const,
  }));
  assert.equal(buildImpressionBatch(flood).length, 24, "hard row cap holds");
  assert.equal(buildImpressionBatch(flood, 500).length, 24, "caller cannot raise the cap");
});

// ── 9. Telemetry names validate against the canonical envelope ───────────────

test("V3-35: event names — all deal events fit henry.<domain>.<noun>.<verb>", () => {
  const names = [
    "henry.deal.campaign.created",
    "henry.deal.offer.impressed",
    "henry.deal.offer.claimed",
    "henry.deal.status.changed",
    "henry.deal.fairness.alerted",
  ];
  for (const name of names) {
    assert.equal(
      henryEventNameSchema.safeParse(name).success,
      true,
      `${name} must validate against henryEventNameSchema`,
    );
  }
});
