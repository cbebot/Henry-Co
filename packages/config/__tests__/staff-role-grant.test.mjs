import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifiedLegacyProfileRole,
  isMissingRelationError,
  readVerifiedProfileRole,
  readVerifiedProfileRoles,
} from "../staff-role-grant.ts";

// A tiny stand-in for the supabase-js admin client: from(table).select().eq()/in().maybeSingle()
function fakeClient({ rows = [], error = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push(table);
      const q = {
        _filter: null,
        select() { return q; },
        eq(col, val) { q._filter = (r) => r[col] === val; return q; },
        in(col, vals) { q._filter = (r) => vals.includes(r[col]); return q; },
        async maybeSingle() {
          if (error) return { data: null, error };
          return { data: rows.find(q._filter) ?? null, error: null };
        },
        then(resolve) {
          resolve(error ? { data: null, error } : { data: rows.filter(q._filter), error: null });
        },
      };
      return q;
    },
  };
}

describe("verifiedLegacyProfileRole — a non-customer profiles.role needs a matching live grant", () => {
  it("passes customer / empty straight through", () => {
    assert.equal(verifiedLegacyProfileRole("customer", null), "customer");
    assert.equal(verifiedLegacyProfileRole(null, null), null);
    assert.equal(verifiedLegacyProfileRole("", { role: "staff" }), null);
  });
  it("THE HOLE: a self-set staff/owner role with no grant confers nothing", () => {
    assert.equal(verifiedLegacyProfileRole("staff", null), null);
    assert.equal(verifiedLegacyProfileRole("owner", undefined), null);
  });
  it("a revoked or mismatched grant confers nothing", () => {
    assert.equal(verifiedLegacyProfileRole("staff", { role: "staff", revoked_at: "2026-09-24T00:00:00Z" }), null);
    assert.equal(verifiedLegacyProfileRole("owner", { role: "staff", revoked_at: null }), null);
  });
  it("a live matching grant verifies (case-insensitive)", () => {
    assert.equal(verifiedLegacyProfileRole("Staff", { role: "staff", revoked_at: null }), "staff");
    assert.equal(verifiedLegacyProfileRole("manager", { role: "manager" }), "manager");
  });
});

describe("isMissingRelationError", () => {
  it("recognises only 'table not there yet' errors", () => {
    assert.equal(isMissingRelationError({ code: "42P01", message: 'relation "public.staff_role_grants" does not exist' }), true);
    assert.equal(isMissingRelationError({ code: "PGRST205", message: "Could not find the table" }), true);
    assert.equal(isMissingRelationError({ code: "42501", message: "permission denied" }), false);
    assert.equal(isMissingRelationError({ code: "08006", message: "connection failure" }), false);
    assert.equal(isMissingRelationError(null), false);
  });
});

describe("readVerifiedProfileRole (admin-client lookup)", () => {
  const grants = [
    { user_id: "u-staff", role: "staff", revoked_at: null },
    { user_id: "u-revoked", role: "staff", revoked_at: "2026-09-24T00:00:00Z" },
  ];
  it("does not query for customer / empty roles", async () => {
    const c = fakeClient({ rows: grants });
    assert.equal(await readVerifiedProfileRole(c, "u-x", "customer"), "customer");
    assert.equal(await readVerifiedProfileRole(c, "u-x", null), null);
    assert.deepEqual(c.calls, []);
  });
  it("verifies against staff_role_grants", async () => {
    const c = fakeClient({ rows: grants });
    assert.equal(await readVerifiedProfileRole(c, "u-staff", "staff"), "staff");
    assert.equal(await readVerifiedProfileRole(c, "u-forged", "staff"), null);
    assert.equal(await readVerifiedProfileRole(c, "u-revoked", "staff"), null);
    assert.deepEqual([...new Set(c.calls)], ["staff_role_grants"]);
  });
  it("FAILS CLOSED on any lookup error …", async () => {
    const c = fakeClient({ error: { code: "08006", message: "connection failure" } });
    assert.equal(await readVerifiedProfileRole(c, "u-staff", "staff"), null);
  });
  it("… except before the migration exists (then behaves exactly as pre-fix)", async () => {
    const c = fakeClient({ error: { code: "42P01", message: "relation does not exist" } });
    assert.equal(await readVerifiedProfileRole(c, "u-staff", "staff"), "staff");
  });
});

describe("readVerifiedProfileRoles (batch, for recipient lists)", () => {
  it("keeps only rows whose role verifies; customers pass", async () => {
    const c = fakeClient({ rows: [{ user_id: "a", role: "staff", revoked_at: null }] });
    const out = await readVerifiedProfileRoles(c, [
      { id: "a", role: "staff" },
      { id: "b", role: "staff" },
      { id: "c", role: "customer" },
    ]);
    assert.deepEqual(Object.fromEntries(out), { a: "staff", b: null, c: "customer" });
  });
  it("fails closed on error, open only on missing relation", async () => {
    const closed = await readVerifiedProfileRoles(fakeClient({ error: { code: "42501", message: "x" } }), [{ id: "a", role: "staff" }]);
    assert.equal(closed.get("a"), null);
    const pre = await readVerifiedProfileRoles(fakeClient({ error: { code: "PGRST205", message: "x" } }), [{ id: "a", role: "staff" }]);
    assert.equal(pre.get("a"), "staff");
  });
});
