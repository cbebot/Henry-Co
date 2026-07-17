import { test } from "node:test";
import assert from "node:assert/strict";

import type { UnifiedViewer } from "@henryco/auth";
import {
  studioViewerIdentity,
  filterToAllowedProjects,
} from "../studio-scope-core";

/**
 * Build a minimal UnifiedViewer for the pure scoping predicates. Only
 * `kind` and `user.id` / `user.email` are read; the rest is irrelevant
 * to scoping and cast away.
 */
function mkViewer(
  kind: string,
  id: string,
  email: string | null,
  emailVerified = true,
): UnifiedViewer {
  return {
    kind,
    user: { id, email, emailVerified },
  } as unknown as UnifiedViewer;
}

type Row = { id: string; project_id: string | null };

// ---------------------------------------------------------------------------
// studioViewerIdentity
// ---------------------------------------------------------------------------

test("studioViewerIdentity: customer with id + email → normalized identity", () => {
  const id = studioViewerIdentity(mkViewer("customer", "user-1", "Jane@Example.com"));
  assert.deepEqual(id, { userId: "user-1", normalizedEmail: "jane@example.com" });
});

test("studioViewerIdentity: null email → normalizedEmail null (never matches on '')", () => {
  const id = studioViewerIdentity(mkViewer("customer", "user-1", null));
  assert.deepEqual(id, { userId: "user-1", normalizedEmail: null });
});

test("studioViewerIdentity: UNVERIFIED email → normalizedEmail null (no cross-customer pull)", () => {
  // The email path is gated on verification — an unverified address must
  // not resolve another customer's projects. userId path still stands.
  const id = studioViewerIdentity(
    mkViewer("customer", "user-1", "victim@example.com", false),
  );
  assert.deepEqual(id, { userId: "user-1", normalizedEmail: null });
});

test("studioViewerIdentity: blank / whitespace email collapses to null", () => {
  const id = studioViewerIdentity(mkViewer("customer", "user-1", "   "));
  assert.deepEqual(id, { userId: "user-1", normalizedEmail: null });
});

test("studioViewerIdentity: non-customer viewer → null (skips studio read entirely)", () => {
  assert.equal(studioViewerIdentity(mkViewer("owner", "owner-1", "o@x.com")), null);
  assert.equal(studioViewerIdentity(mkViewer("staff", "staff-1", "s@x.com")), null);
});

test("studioViewerIdentity: empty user id → null", () => {
  assert.equal(studioViewerIdentity(mkViewer("customer", "", "a@b.com")), null);
});

// ---------------------------------------------------------------------------
// filterToAllowedProjects — the non-party = 0 rows proof
// ---------------------------------------------------------------------------

const ROWS: Row[] = [
  { id: "m1", project_id: "p-owned" },
  { id: "m2", project_id: "p-other" }, // another customer's project
  { id: "m3", project_id: "p-owned" },
  { id: "m4", project_id: null }, // orphan row
  { id: "m5", project_id: "p-third" }, // yet another customer's project
];

test("filterToAllowedProjects: keeps only rows for the viewer's own projects", () => {
  const allowed = new Set(["p-owned"]);
  const kept = filterToAllowedProjects(ROWS, allowed);
  assert.deepEqual(kept.map((r) => r.id), ["m1", "m3"]);
});

test("filterToAllowedProjects: NON-PARTY viewer (empty allowed set) → 0 rows", () => {
  // This is the leak-proof: a viewer who is party to no studio project
  // receives zero studio rows no matter what the DB returned.
  assert.deepEqual(filterToAllowedProjects(ROWS, new Set<string>()), []);
});

test("filterToAllowedProjects: viewer party to none of the returned projects → 0 rows", () => {
  const allowed = new Set(["p-unrelated"]);
  assert.deepEqual(filterToAllowedProjects(ROWS, allowed), []);
});

test("filterToAllowedProjects: rows with null project_id are always dropped", () => {
  const allowed = new Set(["p-owned", "p-other", "p-third"]);
  const kept = filterToAllowedProjects(ROWS, allowed);
  assert.ok(kept.every((r) => r.project_id != null));
  assert.deepEqual(kept.map((r) => r.id), ["m1", "m2", "m3", "m5"]);
});
