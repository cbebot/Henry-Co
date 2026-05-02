#!/usr/bin/env node
/**
 * V2-SEARCH-01 — Verification harness (jest-free).
 *
 * Mirrors the test cases in
 * packages/search-core/src/__tests__/role-isolation.test.ts but is
 * runnable with plain `node` so it can be exercised in CI without a
 * jest project setup.
 *
 * Outputs:
 *   - PASS/FAIL summary to stdout
 *   - Non-zero exit on any failure
 *
 * Use:
 *   node scripts/search-verification.mjs
 */

import url from "node:url";
import path from "node:path";
import { register } from "node:module";

// Register a TS loader for direct .ts import. The harness runs against
// the in-source @henryco/search-core implementation without a build
// step. If TS-loader is not available in this environment, the harness
// falls back to printing a hint.

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

let probes;
try {
  probes = await import("../packages/search-core/src/index.ts");
} catch (error) {
  console.error("[verification] TS import failed.");
  console.error(error.message ?? error);
  console.error("Run via: pnpm tsx scripts/search-verification.mjs");
  process.exit(2);
}

const { COLLECTIONS_BY_NAME, listPermittedCollections, buildFilterClauses } = probes;

let pass = 0;
let fail = 0;

function probe(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message ?? error}`);
    fail += 1;
  }
}

function expectIncludes(haystack, needle, label) {
  if (!String(haystack).includes(needle)) {
    throw new Error(`${label}: expected "${haystack}" to include "${needle}"`);
  }
}

function expectNotIncludes(haystack, needle, label) {
  if (String(haystack).includes(needle)) {
    throw new Error(`${label}: expected "${haystack}" NOT to include "${needle}"`);
  }
}

const ANON = {
  user_id: null,
  role_visibility: ["public"],
  is_staff: false,
  is_platform_owner: false,
};
const SIGNED_IN = {
  user_id: "11111111-1111-1111-1111-111111111111",
  role_visibility: ["public", "authenticated", "owner"],
  is_staff: false,
  is_platform_owner: false,
};
const STAFF = {
  user_id: "22222222-2222-2222-2222-222222222222",
  role_visibility: ["public", "authenticated", "owner", "staff"],
  is_staff: true,
  is_platform_owner: false,
};
const PLATFORM_OWNER = {
  user_id: "33333333-3333-3333-3333-333333333333",
  role_visibility: ["public", "authenticated", "owner", "staff", "staff_owner", "platform_owner"],
  is_staff: true,
  is_platform_owner: true,
};

console.log("\nV2-SEARCH-01 Role-isolation verification\n");

console.log("listPermittedCollections — staff_only:");
probe("anon excludes hc_logistics_shipments + hc_studio_projects", () => {
  const list = listPermittedCollections({ role_visibility: ANON.role_visibility });
  const names = list.map((c) => c.name);
  if (names.includes("hc_logistics_shipments")) {
    throw new Error("LEAK: hc_logistics_shipments visible to anon");
  }
  if (names.includes("hc_studio_projects")) {
    throw new Error("LEAK: hc_studio_projects visible to anon");
  }
});
probe("non-staff signed-in user excludes staff_only", () => {
  const list = listPermittedCollections({ role_visibility: SIGNED_IN.role_visibility });
  const names = list.map((c) => c.name);
  if (names.includes("hc_logistics_shipments") || names.includes("hc_studio_projects")) {
    throw new Error("LEAK: staff-only collection visible to non-staff");
  }
});
probe("staff includes hc_logistics_shipments + hc_studio_projects", () => {
  const list = listPermittedCollections({ role_visibility: STAFF.role_visibility });
  const names = list.map((c) => c.name);
  if (!names.includes("hc_logistics_shipments")) {
    throw new Error("staff cannot see hc_logistics_shipments");
  }
  if (!names.includes("hc_studio_projects")) {
    throw new Error("staff cannot see hc_studio_projects");
  }
});

console.log("\nbuildFilterClauses — user-scoped binding:");
probe("workflows lock to owner for non-staff signed-in", () => {
  const c = COLLECTIONS_BY_NAME.hc_workflows;
  const clauses = buildFilterClauses({ collection: c, resolution: SIGNED_IN });
  expectIncludes(clauses, `owner_user_id:=\`${SIGNED_IN.user_id}\``, "owner_user_id binding");
});
probe("anon on user-scoped collection gets __anonymous__ guard", () => {
  const c = COLLECTIONS_BY_NAME.hc_notifications;
  const clauses = buildFilterClauses({ collection: c, resolution: ANON });
  expectIncludes(clauses, "owner_user_id:=__anonymous__", "anon guard");
});
probe("staff querying support_threads bypasses owner filter (cross-owner reads ok)", () => {
  const c = COLLECTIONS_BY_NAME.hc_support_threads;
  const clauses = buildFilterClauses({ collection: c, resolution: STAFF });
  expectNotIncludes(clauses, `owner_user_id:=\``, "staff bypass");
});

console.log("\nbuildFilterClauses — trust-state hiding:");
probe("non-staff cannot see deleted/closed/archived", () => {
  const c = COLLECTIONS_BY_NAME.hc_marketplace_products;
  const clauses = buildFilterClauses({ collection: c, resolution: ANON });
  expectIncludes(clauses, "`deleted`", "trust deleted");
  expectIncludes(clauses, "`closed`", "trust closed");
  expectIncludes(clauses, "`archived`", "trust archived");
});
probe("frozen entities hidden from staff", () => {
  const c = COLLECTIONS_BY_NAME.hc_marketplace_products;
  const clauses = buildFilterClauses({ collection: c, resolution: STAFF });
  expectIncludes(clauses, "trust_state:!=`frozen`", "frozen hidden from staff");
});
probe("frozen entities visible to platform_owner", () => {
  const c = COLLECTIONS_BY_NAME.hc_marketplace_products;
  const clauses = buildFilterClauses({ collection: c, resolution: PLATFORM_OWNER });
  expectNotIncludes(clauses, "trust_state:!=`frozen`", "frozen visible to platform owner");
});

console.log("\nbuildFilterClauses — role_visibility intersection:");
probe("anon role array is exactly [`public`]", () => {
  const c = COLLECTIONS_BY_NAME.hc_marketplace_products;
  const clauses = buildFilterClauses({ collection: c, resolution: ANON });
  expectIncludes(clauses, "role_visibility:=[`public`]", "anon role-array");
});
probe("signed-in role array contains public, authenticated, owner", () => {
  const c = COLLECTIONS_BY_NAME.hc_marketplace_products;
  const clauses = buildFilterClauses({ collection: c, resolution: SIGNED_IN });
  expectIncludes(clauses, "`public`", "public");
  expectIncludes(clauses, "`authenticated`", "authenticated");
  expectIncludes(clauses, "`owner`", "owner");
});

console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
