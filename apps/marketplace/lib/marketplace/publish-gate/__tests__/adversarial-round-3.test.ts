// V3-MKT-TRUST-01 — one test per finding of adversarial round 3 that lives in
// TypeScript. (The database findings are proven in mkt_trust_guard_behaviour.sql,
// R10 and section S; detection findings in corpus.test.ts.)
//
// Server modules import "server-only", so their invariants are pinned on the
// source text — on call expressions and literal guards, never on a comment.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { storeHandle } from "../store-handle";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const repoRead = (relative: string) => readFileSync(join(process.cwd(), "..", "..", relative), "utf8");
const codeOnly = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

const ROUTE = codeOnly(read("app/api/marketplace/route.ts"));
const SELLER_ROUTE = codeOnly(read("app/api/seller-applications/route.ts"));
const ONBOARDING = codeOnly(read("lib/marketplace/publish-gate/onboarding.ts"));
const SWEEP = codeOnly(read("lib/marketplace/publish-gate/sweep.ts"));
const STAFF_PAGE = codeOnly(read("components/marketplace/staff-resource-page.tsx"));
const NOTICE = codeOnly(read("components/marketplace/decision-refusal-notice.tsx"));
const ADMIN_PAGE = codeOnly(read("app/admin/page.tsx"));
const ADMIN_RESOURCE = codeOnly(read("app/admin/[resource]/page.tsx"));
const OWNER_RESOURCE = codeOnly(read("app/owner/[resource]/page.tsx"));
const MIGRATION = read("supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql");
const HUB_DECISION = codeOnly(repoRead("apps/hub/lib/seller-decision-write.ts"));

describe("round 3 — a person's revocation stands", () => {
  it("is recorded by the database on the decision itself, not read off the row the seller rewrites", () => {
    assert.ok(MIGRATION.includes("create table if not exists public.marketplace_seller_revocations ("));
    assert.ok(MIGRATION.includes("  after update on public.marketplace_vendor_applications\n"));
    assert.ok(MIGRATION.includes("public.marketplace_gate_owner_revoked((select v.owner_user_id"));
  });

  it("closes an owner's application only when the store is open and its approval stands", () => {
    const owned = ONBOARDING.indexOf("const owned = await readOwnedStore(admin, input.actorId);");
    const standing = ONBOARDING.indexOf("const standing = await readSellerGateState(admin, owned.id, null);");
    const mark = ONBOARDING.indexOf('if (vendorStatus === "approved") {');
    assert.ok(owned > 0 && standing > owned && mark > standing);
    assert.ok(SELLER_ROUTE.includes('status: result.applicationApproved ? "approved" : application.status'));
  });

  it("after a person's decision a store owner is still answered as one, and nothing is opened", () => {
    assert.ok(SELLER_ROUTE.includes("priorDecision: decidedByPerson,"));
    assert.equal(SELLER_ROUTE.includes("storeVerdict && decidedByPerson) {"), false);
    const owned = ONBOARDING.indexOf("const owned = await readOwnedStore(admin, input.actorId);");
    const prior = ONBOARDING.indexOf("if (input.priorDecision) {");
    const rpc = ONBOARDING.indexOf('admin.rpc("marketplace_gate_instant_onboard"');
    assert.ok(owned > 0 && prior > owned && rpc > prior);
  });
});

describe("round 3 — an approval keeps one store per account and never rewrites it", () => {
  const surfaces = [
    ["the marketplace console", ROUTE, "applicant"],
    ["the hub", HUB_DECISION, "applicantUserId"],
  ] as const;
  for (const [name, source, applicant] of surfaces) {
    it(`${name}: a handle that matches another store in any letter case is refused`, () => {
      assert.ok(source.includes('? handleQuery.ilike("slug", handle)'));
      assert.ok(source.includes(`(owner) => owner.owner_type === "company" || String(owner.owner_user_id || "") !== ${applicant},`));
    });

    it(`${name}: an applicant who owns a store has that store re-opened as it is`, () => {
      const start = source.indexOf("let ownedStoreId: string | null = null;");
      const reopen = source.indexOf('.update({ status: "approved" } as never)', start);
      const upsert = source.indexOf('{ onConflict: "slug" }', start);
      assert.ok(start > 0 && reopen > start && upsert > reopen, "the re-open branch comes before the store write");
      assert.ok(source.includes('.neq("owner_type", "company")'));
    });

    it(`${name}: an application with no account behind it is never approved`, () => {
      assert.ok(source.includes(`if (!${applicant}) {`));
    });
  }

  it("a refused approval puts the staff note back with the rest (marketplace console)", () => {
    assert.ok(ROUTE.includes("review_note: application.review_note ?? null,"));
  });
});

describe("round 3 — the handle a store opens under", () => {
  it("is normalised before it is screened, saved or opened (instant publish on)", () => {
    const flag = SELLER_ROUTE.indexOf("const instantPublish = isInstantPublishEnabled();");
    const handle = SELLER_ROUTE.indexOf("const storeSlug = instantPublish ? storeHandle(typedSlug, storeName) : typedSlug;");
    const screen = SELLER_ROUTE.indexOf("evaluateStorePolicy({ storeName, storeSlug, categoryFocus, story, locale: gateLocale })");
    assert.ok(flag > 0 && handle > flag && screen > handle);
  });

  it("always satisfies the onboarding RPC's rule, and a look-alike becomes the handle it imitates", () => {
    const rpcRule = /^[a-z0-9][a-z0-9-]{1,62}$/;
    const cases: Array<[string, string, string]> = [
      ["Advb-Victim", "Victim", "advb-victim"],
      ["my_store name", "My Store", "my-store-name"],
      ["  Ade  Shop  ", "", "ade-shop"],
      ["a", "Ade Shop", "ade-shop"],
      ["", "Mama's Kitchen & Co", "mama-s-kitchen-co"],
      ["-ade-", "", "ade"],
    ];
    for (const [typed, name, expected] of cases) {
      const handle = storeHandle(typed, name);
      assert.equal(handle, expected, typed);
      assert.match(handle, rpcRule, typed);
    }
    const long = storeHandle(`${"a".repeat(62)}-b-c`, "");
    assert.ok(long.length <= 63 && rpcRule.test(long), long);
    assert.equal(storeHandle("x".repeat(80), "").length, 63);
  });
});

describe("round 3 — the screened-profile hash keeps the fields apart", () => {
  it("digests each field on its own (the database does the same)", () => {
    assert.ok(ONBOARDING.includes("return digest(`${digest(slug)}${digest(name)}${digest(story)}`);"));
    assert.ok(MIGRATION.includes("encode(sha256(convert_to(v_slug, 'UTF8')), 'hex')"));
  });
});

describe("round 3 — a reporter's age is the age when they reported", () => {
  it("each reporter goes to the database with the time of their first report in the window", () => {
    assert.ok(SWEEP.includes("p_reported_at: reporterIds.map((id) => firstReportAt.get(id) ?? null),"));
  });
});

describe("round 3 — the re-scan is bounded", () => {
  it("reads at most RESCAN_MAX_TEXT characters and sends a longer listing to a person", () => {
    assert.ok(SWEEP.includes("text: oversize ? text.slice(0, RESCAN_MAX_TEXT) : text,"));
    assert.ok(SWEEP.includes('? { action: "review" as const, reasons: [...found.reasons, "listing_too_long" as const] }'));
  });
});

describe("round 3 — a refused approval says why wherever the queue is", () => {
  it("the notice maps both refusals and renders nothing otherwise", () => {
    assert.ok(NOTICE.includes('error === "store-handle-taken"'));
    assert.ok(NOTICE.includes('error === "decision-failed"'));
    assert.ok(NOTICE.includes("if (!message) return null;"));
  });

  it("is shown on /admin, /admin/seller-applications and /owner/seller-applications", () => {
    assert.ok(ADMIN_PAGE.includes("<DecisionRefusalNotice error={refusalError} locale={locale} />"));
    assert.ok(STAFF_PAGE.includes("<DecisionRefusalNotice error={error} locale={locale} />"));
    for (const page of [ADMIN_RESOURCE, OWNER_RESOURCE]) {
      assert.ok(page.includes('error={typeof query.error === "string" ? query.error : undefined}'));
    }
  });
});
