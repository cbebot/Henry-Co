/**
 * Role-isolation probes — V2-SEARCH-01 verification, runtime-executed
 * since DASH-5 elevation pass.
 *
 * The security boundary of the cross-division search system is:
 *
 *   For every (collection, role-bundle) pair, the Typesense filter_by
 *   clause MUST include role_visibility intersection AND, for user-scoped
 *   collections, an owner_user_id binding (unless the user is staff).
 *
 * These probes assert the clause shape without hitting Typesense. A leak
 * here is catastrophic; the tests must be cheap, fast, and frequent.
 *
 * Runtime: node:test (Node 24+). Run via `pnpm --filter
 * @henryco/search-core test`. Originally authored against @jest/globals;
 * converted in the DASH-5 elevation pass so the V3 cross-tenant filter
 * shape is verified at runtime locally (the live Postgres-RLS probe
 * still requires a preview branch — see search-rls-probe.md).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { COLLECTIONS_BY_NAME, listPermittedCollections } from "../collections";
import { buildFilterClauses } from "../role";

const ANON = {
  user_id: null,
  role_visibility: ["public" as const],
  is_staff: false,
  is_platform_owner: false,
};

const SIGNED_IN = {
  user_id: "11111111-1111-1111-1111-111111111111",
  role_visibility: ["public" as const, "authenticated" as const, "owner" as const],
  is_staff: false,
  is_platform_owner: false,
};

const STAFF = {
  user_id: "22222222-2222-2222-2222-222222222222",
  role_visibility: ["public" as const, "authenticated" as const, "owner" as const, "staff" as const],
  is_staff: true,
  is_platform_owner: false,
};

const PLATFORM_OWNER = {
  user_id: "33333333-3333-3333-3333-333333333333",
  role_visibility: [
    "public" as const,
    "authenticated" as const,
    "owner" as const,
    "staff" as const,
    "staff_owner" as const,
    "platform_owner" as const,
  ],
  is_staff: true,
  is_platform_owner: true,
};

describe("listPermittedCollections — staff_only enforcement", () => {
  it("excludes hc_logistics_shipments and hc_studio_projects from anonymous", () => {
    const list = listPermittedCollections({ role_visibility: ANON.role_visibility });
    const names = list.map((c) => c.name);
    assert.ok(!names.includes("hc_logistics_shipments"));
    assert.ok(!names.includes("hc_studio_projects"));
  });

  it("excludes staff-only from a signed-in non-staff user", () => {
    const list = listPermittedCollections({ role_visibility: SIGNED_IN.role_visibility });
    const names = list.map((c) => c.name);
    assert.ok(!names.includes("hc_logistics_shipments"));
    assert.ok(!names.includes("hc_studio_projects"));
  });

  it("includes staff-only collections for staff", () => {
    const list = listPermittedCollections({ role_visibility: STAFF.role_visibility });
    const names = list.map((c) => c.name);
    assert.ok(names.includes("hc_logistics_shipments"));
    assert.ok(names.includes("hc_studio_projects"));
  });

  it("includes everything for platform owner", () => {
    const list = listPermittedCollections({ role_visibility: PLATFORM_OWNER.role_visibility });
    const names = list.map((c) => c.name);
    assert.ok(names.length >= Object.keys(COLLECTIONS_BY_NAME).length);
  });
});

describe("buildFilterClauses — user-scoped binding", () => {
  it("locks workflows to owner_user_id for non-staff", () => {
    const collection = COLLECTIONS_BY_NAME.hc_workflows!;
    const clauses = buildFilterClauses({ collection, resolution: SIGNED_IN });
    assert.ok(clauses.includes(`owner_user_id:=\`${SIGNED_IN.user_id}\``));
  });

  it("zero-rows-for-anonymous on user-scoped collections", () => {
    const collection = COLLECTIONS_BY_NAME.hc_notifications!;
    const clauses = buildFilterClauses({ collection, resolution: ANON });
    assert.ok(clauses.includes(`owner_user_id:=__anonymous__`));
  });

  it("does NOT add owner_user_id for staff (cross-owner reads allowed)", () => {
    const collection = COLLECTIONS_BY_NAME.hc_support_threads!;
    const clauses = buildFilterClauses({ collection, resolution: STAFF });
    // Staff need to triage all support threads, so the owner_user_id
    // restriction must NOT be applied. Visibility is enforced via
    // role_visibility:[staff].
    assert.ok(!clauses.includes(`owner_user_id:=`));
  });
});

describe("buildFilterClauses — trust-state hiding", () => {
  it("hides closed/archived/deleted from non-staff", () => {
    const collection = COLLECTIONS_BY_NAME.hc_marketplace_products!;
    const clauses = buildFilterClauses({ collection, resolution: ANON });
    assert.ok(clauses.includes("trust_state:!="));
    assert.ok(clauses.includes("`deleted`"));
    assert.ok(clauses.includes("`archived`"));
    assert.ok(clauses.includes("`closed`"));
  });

  it("frozen content is hidden from everyone except platform_owner", () => {
    const collection = COLLECTIONS_BY_NAME.hc_marketplace_products!;
    const staffClauses = buildFilterClauses({ collection, resolution: STAFF });
    assert.ok(staffClauses.includes("trust_state:!=`frozen`"));

    const ownerClauses = buildFilterClauses({ collection, resolution: PLATFORM_OWNER });
    assert.ok(!ownerClauses.includes("trust_state:!=`frozen`"));
  });
});

describe("buildFilterClauses — role_visibility intersection", () => {
  it("anon role-array contains only `public`", () => {
    const collection = COLLECTIONS_BY_NAME.hc_marketplace_products!;
    const clauses = buildFilterClauses({ collection, resolution: ANON });
    assert.ok(clauses.includes("role_visibility:=[`public`]"));
  });

  it("signed-in user has public, authenticated, owner", () => {
    const collection = COLLECTIONS_BY_NAME.hc_marketplace_products!;
    const clauses = buildFilterClauses({ collection, resolution: SIGNED_IN });
    assert.ok(clauses.includes("role_visibility:="));
    assert.match(clauses, /`public`/);
    assert.match(clauses, /`authenticated`/);
    assert.match(clauses, /`owner`/);
  });
});
