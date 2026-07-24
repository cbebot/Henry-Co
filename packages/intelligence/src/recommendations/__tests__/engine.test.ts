import { test } from "node:test";
import assert from "node:assert/strict";

import { generateRecommendations, type RecommendationCandidate } from "../engine";
import type { Recommendation } from "../../index";

/**
 * V3-36 gate — executable proof of the four ABSOLUTE guarantees the pass rides
 * on: deterministic floor with AI off, consent suppresses profiling, opaque
 * scoring (no numeric score serialized), and no cross-user leak (the engine can
 * only ever surface what the injected viewer-scoped readers returned).
 */

function candidate(over: Partial<RecommendationCandidate> & { id: string; score: number }): RecommendationCandidate {
  return {
    id: over.id,
    division: over.division ?? "marketplace",
    title: over.title ?? `Item ${over.id}`,
    description: over.description,
    ctaHref: over.ctaHref ?? `/x/${over.id}`,
    ctaLabel: over.ctaLabel ?? "Open",
    reasonCodes: over.reasonCodes ?? ["recent_activity"],
    confidence: over.confidence ?? "medium",
    score: over.score,
    tier: over.tier ?? "local",
    origin: over.origin ?? "test",
  };
}

const reader = (rows: RecommendationCandidate[]) => async () => rows;

// ── 1. Deterministic floor with AI OFF ───────────────────────────────────────

test("V3-36: deterministic floor — no rerank ⇒ score-desc, stable, capped order", async () => {
  const local = reader([
    candidate({ id: "a", score: 0.2 }),
    candidate({ id: "b", score: 0.9 }),
    candidate({ id: "c", score: 0.5 }),
  ]);
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [] },
    limit: 3,
  });
  assert.deepEqual(
    result.recommendations.map((r) => r.id),
    ["b", "c", "a"],
    "must sort by score descending",
  );
  assert.equal(result.aiApplied, false);
  // Re-running yields the identical order — no wall-clock / iteration-order dependence.
  const again = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [] },
    limit: 3,
  });
  assert.deepEqual(again.recommendations.map((r) => r.id), ["b", "c", "a"]);
});

test("V3-36: a throwing reader never breaks the floor — the rest still rank", async () => {
  const ok = reader([candidate({ id: "a", score: 0.5 })]);
  const boom = async () => {
    throw new Error("reader down");
  };
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: true,
    readers: { local: [ok], profiling: [boom] },
    limit: 3,
  });
  assert.deepEqual(result.recommendations.map((r) => r.id), ["a"]);
});

// ── 2. AI enhancement can only REORDER the floor, never rewrite it ───────────

test("V3-36: AI re-rank reorders the SAME items — a valid permutation is honored", async () => {
  const local = reader([
    candidate({ id: "a", score: 0.9 }),
    candidate({ id: "b", score: 0.5 }),
  ]);
  const rerank = async (items: Recommendation[]) => [...items].reverse();
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [] },
    rerank,
    limit: 3,
  });
  assert.equal(result.aiApplied, true);
  assert.deepEqual(result.recommendations.map((r) => r.id), ["b", "a"], "AI reorder applied");
});

test("V3-36: AI re-rank that ADDS, DROPS, or REWRITES an item is discarded — floor stands", async () => {
  const local = reader([
    candidate({ id: "a", score: 0.9, ctaHref: "/a" }),
    candidate({ id: "b", score: 0.5, ctaHref: "/b" }),
  ]);
  const inputs = { viewerId: "u1", consentAllowed: false, readers: { local: [local], profiling: [] }, limit: 3 } as const;

  // Adds an item the floor never produced (a hallucinated recommendation).
  const injects = async (items: Recommendation[]): Promise<Recommendation[]> => [
    ...items,
    { id: "evil", division: "marketplace", title: "Buy now", reasonCodes: [], confidence: "high", ctaHref: "/evil", ctaLabel: "Go" },
  ];
  const r1 = await generateRecommendations({ ...inputs, rerank: injects });
  assert.equal(r1.aiApplied, false);
  assert.deepEqual(r1.recommendations.map((r) => r.id), ["a", "b"], "injected item rejected; floor stands");

  // Rewrites a CTA target (redirect the click to an attacker URL).
  const rewrites = async (items: Recommendation[]): Promise<Recommendation[]> =>
    items.map((item) => (item.id === "a" ? { ...item, ctaHref: "/phish" } : item));
  const r2 = await generateRecommendations({ ...inputs, rerank: rewrites });
  assert.equal(r2.aiApplied, false);
  assert.equal(r2.recommendations.find((r) => r.id === "a")?.ctaHref, "/a", "CTA rewrite rejected");

  // Drops an item.
  const drops = async (items: Recommendation[]): Promise<Recommendation[]> => items.slice(0, 1);
  const r3 = await generateRecommendations({ ...inputs, rerank: drops });
  assert.equal(r3.aiApplied, false);
  assert.deepEqual(r3.recommendations.map((r) => r.id), ["a", "b"]);
});

test("V3-36: a throwing re-rank is invisible — the deterministic floor already stands", async () => {
  const local = reader([candidate({ id: "a", score: 0.9 }), candidate({ id: "b", score: 0.5 })]);
  const rerank = async () => {
    throw new Error("gateway down");
  };
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [] },
    rerank,
    limit: 3,
  });
  assert.equal(result.aiApplied, false);
  assert.deepEqual(result.recommendations.map((r) => r.id), ["a", "b"]);
});

// ── 3. Consent suppresses cross-division profiling ───────────────────────────

test("V3-36: NO consent ⇒ profiling readers never run; only division-local defaults surface", async () => {
  let profilingRan = false;
  const local = reader([candidate({ id: "local-1", score: 0.3, tier: "local" })]);
  const profiling = async () => {
    profilingRan = true;
    return [candidate({ id: "cross-1", score: 0.99, tier: "profiling", division: "jobs" })];
  };
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [profiling] },
    limit: 6,
  });
  assert.equal(profilingRan, false, "a profiling reader must NOT run without consent");
  assert.equal(result.profiled, false);
  assert.deepEqual(result.recommendations.map((r) => r.id), ["local-1"], "cross-division item suppressed");
});

test("V3-36: WITH consent ⇒ profiling candidates are admitted and ranked", async () => {
  const local = reader([candidate({ id: "local-1", score: 0.3 })]);
  const profiling = reader([candidate({ id: "cross-1", score: 0.99, tier: "profiling", division: "jobs" })]);
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: true,
    readers: { local: [local], profiling: [profiling] },
    limit: 6,
  });
  assert.equal(result.profiled, true);
  assert.deepEqual(result.recommendations.map((r) => r.id), ["cross-1", "local-1"]);
});

// ── 4. Opaque scoring — no numeric score serialized ──────────────────────────

test("V3-36: the public recommendation carries NO numeric score / tier / origin field", async () => {
  const local = reader([candidate({ id: "a", score: 0.87, tier: "profiling", origin: "secret-reader" })]);
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: true,
    readers: { local: [local], profiling: [] },
    limit: 3,
  });
  const item = result.recommendations[0] as Record<string, unknown>;
  assert.equal("score" in item, false, "score must not serialize");
  assert.equal("tier" in item, false, "tier must not serialize");
  assert.equal("origin" in item, false, "origin must not serialize");
  // The public confidence is a string tier, never the numeric score.
  assert.equal(typeof item.confidence, "string");
  assert.ok(["low", "medium", "high"].includes(item.confidence as string));
  // Full JSON round-trip contains no forbidden numeric-score bytes.
  assert.equal(JSON.stringify(result.recommendations).includes("0.87"), false);
});

// ── 5. No cross-user leak — the engine surfaces only what the reader returned ─

test("V3-36 hardening: floor ids are unique (a duplicate-id candidate is deduped) — the permutation guard's invariant is enforced, not assumed", async () => {
  // Two candidates sharing an id but different hrefs — the floor must keep only
  // the first, so isPermutation's sorted-id-multiset compare stays sound.
  const local = reader([
    candidate({ id: "dup", score: 0.9, ctaHref: "/one" }),
    candidate({ id: "dup", score: 0.5, ctaHref: "/two" }),
    candidate({ id: "unique", score: 0.7, ctaHref: "/three" }),
  ]);
  const result = await generateRecommendations({
    viewerId: "u1",
    consentAllowed: false,
    readers: { local: [local], profiling: [] },
    limit: 6,
  });
  const ids = result.recommendations.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate ids in the floor");
  assert.deepEqual(ids, ["dup", "unique"], "the higher-scored duplicate-id candidate wins; the second is dropped");
});

test("V3-36 leak-proof: given viewer A's readers, user B's rows can never appear", async () => {
  // The engine has NO table access; it can only emit what the injected,
  // viewer-scoped readers hand it. Model reader A (scoped to user A) — user B's
  // candidate is simply never produced, so it cannot surface.
  const readerForUserA = reader([candidate({ id: "A-owned", score: 0.5, ctaHref: "/a-owned" })]);
  const result = await generateRecommendations({
    viewerId: "user-A",
    consentAllowed: true,
    readers: { local: [readerForUserA], profiling: [] },
    limit: 6,
  });
  const ids = result.recommendations.map((r) => r.id);
  assert.deepEqual(ids, ["A-owned"]);
  assert.equal(ids.includes("B-owned"), false, "user B's row was never in a viewer-A reader");
  // Structural guarantee: the engine takes readers, never a client/table — there
  // is no query here that could forget a viewer predicate.
});
