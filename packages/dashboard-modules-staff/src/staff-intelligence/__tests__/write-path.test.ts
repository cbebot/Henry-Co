import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { staffIntelligenceEnabled, STAFF_INTELLIGENCE_PATH } from "../flags";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..", "..");
const read = (rel: string) => readFileSync(path.join(REPO, rel), "utf8");

const WRITE = "apps/staff/lib/intelligence/recommendation-write.ts";
const ACTION = "apps/staff/app/(track-c)/_actions/intelligence-actions.ts";
const MODULE = "packages/dashboard-modules-staff/src/staff-intelligence/index.tsx";
const DASHBOARD = "packages/dashboard-modules-staff/src/staff-intelligence/dashboard.tsx";

// ── dark launch ───────────────────────────────────────────────────────────────

test("FLAG-DARK: the dashboards are OFF with an empty environment", () => {
  assert.equal(staffIntelligenceEnabled({}), false);
});

test("the flag turns on via either documented form", () => {
  assert.equal(staffIntelligenceEnabled({ NEXT_PUBLIC_HENRY_FLAG_PREDICTIVE_DASHBOARDS: "1" }), true);
  assert.equal(staffIntelligenceEnabled({ NEXT_PUBLIC_HENRY_FLAGS: "staff_intelligence" }), true);
  assert.equal(staffIntelligenceEnabled({ NEXT_PUBLIC_HENRY_FLAG_PREDICTIVE_DASHBOARDS: "0" }), false);
});

test("the module's rail entry, role gate AND palette entry all honour the flag", () => {
  const source = read(MODULE);
  const gated = source.match(/staffIntelligenceEnabled\(\)/g) ?? [];
  assert.ok(gated.length >= 3, `expected the flag in eligibility, role gate and palette; found ${gated.length}`);
  assert.ok(/getEligibleViewer\(\)\s*\{[\s\S]*?staffIntelligenceEnabled\(\)/.test(source));
  assert.ok(/getRoleGate\(viewer\)\s*\{[\s\S]*?if \(!staffIntelligenceEnabled\(\)\) return null/.test(source));
  assert.equal(STAFF_INTELLIGENCE_PATH, "/modules/staff-intelligence");
});

// ── the write path: layer ORDER is the guarantee ────────────────────────────

test("WRITE PATH: every guard runs BEFORE the database write, in the documented order", () => {
  const s = read(WRITE);
  const at = (needle: string) => {
    const i = s.indexOf(needle);
    assert.ok(i > -1, `write path is missing "${needle}"`);
    return i;
  };
  const flag = at('"predictive_dashboards"');
  const lens = at("assertActorMayActOnLens(input.actor, input.lens)");
  const scope = at("recommendationScopeForKey(key)");
  const human = at("assertHumanActor(status, input.actor.userId)");
  const write = at('.from("staff_recommendation_state").upsert(');
  const audit = at("writeAuditLog(");
  assert.ok(flag < lens, "the dark-launch check must come first");
  assert.ok(lens < scope, "lens permission before key scope");
  assert.ok(scope < human, "key scope before the human-actor check");
  assert.ok(human < write, "the human-actor check must precede the write");
  assert.ok(write < audit, "the audit records a write that happened");
});

test("WRITE PATH: the key must belong to the lens, not merely exist", () => {
  const s = read(WRITE);
  assert.ok(s.includes("if (keyScope !== input.lens)"), "a trust-shaped key must be refused under another lens");
});

test("WRITE PATH: the upsert never overwrites the row's primary key", () => {
  const s = read(WRITE);
  const upsert = s.slice(s.indexOf(".upsert("), s.indexOf("onConflict"));
  assert.equal(/\bid\s*:/.test(upsert), false, "sending `id` would rewrite the PK of an existing row on conflict");
  assert.ok(s.includes('onConflict: "recommendation_key,role_scope"'));
});

test("WRITE PATH: no enforcement, money or customer mutation is reachable", () => {
  const s = read(WRITE);
  for (const table of [
    "risk_enforcement_log",
    "risk_scores",
    "customer_wallets",
    "payment_intents",
    "support_threads",
    "marketplace_orders",
    "quality_assessments",
    "dispute_likelihoods",
  ]) {
    assert.equal(s.includes(`"${table}"`), false, `the recommendation write path must never touch ${table}`);
  }
  const writes = [...s.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(writes)], ["staff_recommendation_state"], "exactly one table is ever written");
});

test("WRITE PATH: a failed save does not leak database internals to the client", () => {
  const s = read(WRITE);
  assert.equal(
    /throw new Error\([^)]*error\.message/.test(s),
    false,
    "server-action errors reach the client; do not echo Postgres messages",
  );
});

test("SERVER ACTION: re-derives the actor itself — never trusts an id from the client", () => {
  const s = read(ACTION);
  assert.ok(s.startsWith('"use server"'), "must be a server action module");
  assert.ok(s.includes("await requireIntelligenceActor()"), "actor must be resolved server-side");
  assert.equal(/actorId|userId\s*:/.test(s.split("requireIntelligenceActor")[0] ?? ""), false);
  // The exported signature carries no actor parameter a client could forge.
  const signature = s.slice(s.indexOf("export async function"), s.indexOf("{", s.indexOf("export async function")));
  assert.equal(/actor/i.test(signature), false, `the action signature must not accept an actor: ${signature}`);
});

// ── the dashboard surface ────────────────────────────────────────────────────

test("SURFACE: the injected CSS is a constant — nothing is ever interpolated into it", () => {
  const s = read(DASHBOARD);
  const start = s.indexOf("export const INTEL_CSS = `");
  assert.ok(start > -1, "INTEL_CSS must be a module-level constant");
  const body = s.slice(start + "export const INTEL_CSS = `".length, s.indexOf("`;", start));
  assert.equal(body.includes("${"), false, "dangerouslySetInnerHTML content must never interpolate");
});

test("SURFACE: navigation is links, not callbacks that cannot cross the RSC boundary", () => {
  const s = read(DASHBOARD);
  assert.equal(s.includes("onLensChange"), false, "a function prop from the server would render dead tabs");
  assert.ok(s.includes("?lens=${key}"), "lens tabs are plain links");
});

test("SURFACE: a failed action never shows a false 'Agreed'", () => {
  const s = read(DASHBOARD);
  const act = s.slice(s.indexOf("const act = "), s.indexOf("return (", s.indexOf("const act = ")));
  assert.ok(act.includes("try {") && act.includes("catch"), "the action must be guarded");
  assert.ok(
    act.indexOf("await onAction(") < act.indexOf("setResolved(action)"),
    "the resolved state is set only AFTER the server confirms",
  );
});

test("ROUND-1: the audit runs through the CALLER'S session — service role makes add_audit_log_v2 raise", () => {
  const s = read(WRITE);
  const audit = s.slice(s.indexOf("writeAuditLog("), s.indexOf("writeAuditLog(") + 40);
  assert.ok(audit.includes("session"), `the audit must use the staff session client, got: ${audit}`);
  assert.equal(/writeAuditLog\(admin/.test(s), false, "an admin-client audit is refused by add_audit_log_v2 and silently lost");
  assert.equal(/writeAuditLog\([^)]*\)\s*\.catch/.test(s), false, "an audit failure must not be swallowed");
  assert.ok(s.includes("recommendation_key: key"), "the key travels in new_values (entity_id is a uuid)");
});

test("ROUND-1: a write must name a CURRENT key", () => {
  const s = read(WRITE);
  assert.ok(s.includes("isRecommendationKeyCurrent(key, now)"));
  assert.ok(s.indexOf("isRecommendationKeyCurrent(") < s.indexOf('.from("staff_recommendation_state")'));
});

test("ROUND-2: a write must name a card the engine is showing THAT lens right now", () => {
  const s = read(WRITE);
  assert.ok(s.includes("liveRecommendationKeys(session"), "re-derives the rail through the caller's RLS session");
  assert.ok(s.includes("if (!live.has(key))"), "refuses a key that is not a live card");
  assert.ok(
    s.indexOf("live.has(key)") < s.indexOf('.from("staff_recommendation_state")'),
    "the live-card gate runs BEFORE the write",
  );
});

test("ROUND-2: the DATABASE must agree the caller is staff before anything is written", () => {
  const s = read("apps/staff/lib/intelligence/actor.ts");
  assert.ok(s.includes('rpc("is_staff_in_any"'), "SQL staff predicate consulted");
  assert.ok(s.includes("sqlStaff !== true"), "anything but an explicit true is refused");
  assert.ok(s.includes('rpc("is_staff_in"') && s.includes("sqlSecurity === true"), "trust lens needs the SQL security predicate too");
});

test("ROUND-3: a card that changed since render is a distinct 'stale' outcome, never 'try again'", () => {
  const write = read(WRITE);
  assert.ok(write.includes("class RecommendationNotLiveError"));
  assert.equal(write.includes('throw new Error("That recommendation is no longer current.")'), false);
  const action = read(ACTION);
  assert.ok(action.includes("instanceof RecommendationNotLiveError"));
  assert.ok(action.includes('return "stale"'));
  assert.ok(
    action.indexOf('revalidatePath("/modules/staff-intelligence")') < action.indexOf('return "stale"'),
    "the page re-renders so the rail shows the current cards",
  );
  const ui = read("packages/dashboard-modules-staff/src/staff-intelligence/dashboard.tsx");
  assert.ok(ui.includes('outcome === "stale"') && ui.includes("actions.stale"));
});

test("ROUND-3: journal snapshot series are judged WITHOUT the Poisson count floor", () => {
  const s = read("packages/dashboard-modules-staff/src/staff-intelligence/index.tsx");
  assert.ok(s.includes("SNAPSHOT_SERIES.has(s.key) ? SNAPSHOT_ANOMALY_OPTS"));
  assert.ok(s.includes("SNAPSHOT_ANOMALY_OPTS = { countData: false, relativeFloor: 0.05, minScale: 2 }"), "round 4: a relative floor for stocks");
});

test("ROUND-4: a 'stale' row keeps its buttons, so a still-present card is never stuck", () => {
  const ui = read("packages/dashboard-modules-staff/src/staff-intelligence/dashboard.tsx");
  const row = ui.slice(ui.indexOf("function RecommendationRow"), ui.indexOf("export function PredictiveDashboard"));
  assert.equal(/\{stale \? \([\s\S]{0,200}\) : resolved \?/.test(row), false, "stale must not replace the buttons");
  assert.ok(row.indexOf("actions.stale") > row.indexOf("actions.snooze"), "the stale note renders beside the live buttons");
  assert.ok(row.includes("setStale(false)"), "a new attempt clears the note");
});
