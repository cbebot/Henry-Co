// V3-STAFF-SELFGRANT-FIX-01 — resolveUserRoles must not treat customer-facing or
// inactive memberships, or a forged profiles.role, as staff. A false `is_staff` lifts the
// per-user owner_user_id filter in buildFilterClauses (cross-user search results).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveUserRoles } from "../role";

type Row = Record<string, unknown>;

function fakeSupabase(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      const filters: Array<(row: Row) => boolean> = [];
      const q = {
        select() { return q; },
        eq(col: string, val: unknown) { filters.push((r) => r[col] === val); return q; },
        async maybeSingle() {
          const rows = (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
          return { data: rows[0] ?? null, error: null };
        },
        then(resolve: (v: { data: Row[]; error: null }) => void) {
          resolve({ data: (tables[table] ?? []).filter((r) => filters.every((f) => f(r))), error: null });
        },
      };
      return q;
    },
  } as never;
}

const U = "user-1";

describe("resolveUserRoles — staff only from operator memberships / verified roles", () => {
  it("a self-served vendor_applicant membership is NOT staff", async () => {
    const r = await resolveUserRoles(fakeSupabase({
      profiles: [{ id: U, role: "customer" }],
      marketplace_role_memberships: [{ user_id: U, role: "vendor_applicant", is_active: true }],
    }), U);
    assert.equal(r.is_staff, false);
    assert.ok(!r.role_visibility.includes("staff"));
  });

  it("an INACTIVE operator membership is not staff", async () => {
    const r = await resolveUserRoles(fakeSupabase({
      profiles: [{ id: U, role: "customer" }],
      marketplace_role_memberships: [{ user_id: U, role: "marketplace_admin", is_active: false }],
    }), U);
    assert.equal(r.is_staff, false);
  });

  it("an active operator membership is staff", async () => {
    const r = await resolveUserRoles(fakeSupabase({
      profiles: [{ id: U, role: "customer" }],
      marketplace_role_memberships: [{ user_id: U, role: "marketplace_admin", is_active: true }],
    }), U);
    assert.equal(r.is_staff, true);
  });

  it("a forged profiles.role='owner' without a live grant is not platform owner", async () => {
    const r = await resolveUserRoles(fakeSupabase({
      profiles: [{ id: U, role: "owner" }],
      staff_role_grants: [],
    }), U);
    assert.equal(r.is_platform_owner, false);
    assert.equal(r.is_staff, false);
  });

  it("a grant-backed profiles.role='owner' is platform owner", async () => {
    const r = await resolveUserRoles(fakeSupabase({
      profiles: [{ id: U, role: "owner" }],
      staff_role_grants: [{ user_id: U, role: "owner", revoked_at: null }],
    }), U);
    assert.equal(r.is_platform_owner, true);
  });
});
