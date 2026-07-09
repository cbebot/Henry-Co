import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AWARE_DIVISIONS,
  MARKETPLACE_ROLE_VOCAB,
  JOBS_ROLE_VOCAB,
  LEARN_ROLE_VOCAB,
  PROPERTY_ROLE_VOCAB,
  STUDIO_ROLE_VOCAB,
  LOGISTICS_ROLE_VOCAB,
  resolveChromePlan,
  standingFromRoles,
} from "./index";
import { __PLAN_TABLES } from "./plan";
import type { AwareAction, AwareChromePlan, AwareDivision, AwareRoleVocab, AwareStanding } from "./types";

const VOCABS: Record<AwareDivision, AwareRoleVocab> = {
  marketplace: MARKETPLACE_ROLE_VOCAB,
  jobs: JOBS_ROLE_VOCAB,
  learn: LEARN_ROLE_VOCAB,
  property: PROPERTY_ROLE_VOCAB,
  studio: STUDIO_ROLE_VOCAB,
  logistics: LOGISTICS_ROLE_VOCAB,
};

const ALL_STANDINGS: AwareStanding[] = [
  { kind: "visitor" },
  { kind: "customer" },
  { kind: "applicant", track: "vendor" },
  { kind: "operator", track: "vendor" },
  { kind: "staff" },
];

function actionsOf(plan: AwareChromePlan): AwareAction[] {
  return [plan.primaryCta, plan.aside, plan.workspace, plan.recruit].filter(
    (a): a is AwareAction => a !== null,
  );
}

// ── standingFromRoles: precedence is fixed and total ────────────────────────

test("signed-out viewers are visitors regardless of stale roles", () => {
  const s = standingFromRoles({ signedIn: false, roles: ["vendor"] }, MARKETPLACE_ROLE_VOCAB);
  assert.deepEqual(s, { kind: "visitor" });
});

test("signed-in with no division roles is a customer", () => {
  const s = standingFromRoles({ signedIn: true, roles: ["buyer"] }, MARKETPLACE_ROLE_VOCAB);
  assert.deepEqual(s, { kind: "customer" });
});

test("staff beats operator beats applicant (precedence)", () => {
  const staffAndVendor = standingFromRoles(
    { signedIn: true, roles: ["vendor", "marketplace_admin"] },
    MARKETPLACE_ROLE_VOCAB,
  );
  assert.equal(staffAndVendor.kind, "staff");

  const vendorAndApplicant = standingFromRoles(
    { signedIn: true, roles: ["vendor_applicant", "vendor"] },
    MARKETPLACE_ROLE_VOCAB,
  );
  assert.deepEqual(vendorAndApplicant, { kind: "operator", track: "vendor" });

  const applicantOnly = standingFromRoles(
    { signedIn: true, roles: ["buyer", "vendor_applicant"] },
    MARKETPLACE_ROLE_VOCAB,
  );
  assert.deepEqual(applicantOnly, { kind: "applicant", track: "vendor" });
});

test("jobs vocab: employer and recruiter are operator; internal roles are staff", () => {
  assert.deepEqual(
    standingFromRoles({ signedIn: true, roles: ["candidate", "employer"] }, JOBS_ROLE_VOCAB),
    { kind: "operator", track: "employer" },
  );
  assert.deepEqual(
    standingFromRoles({ signedIn: true, roles: ["recruiter"] }, JOBS_ROLE_VOCAB),
    { kind: "operator", track: "employer" },
  );
  assert.equal(
    standingFromRoles({ signedIn: true, roles: ["moderator", "employer"] }, JOBS_ROLE_VOCAB).kind,
    "staff",
  );
});

test("vocab sanity: operator, applicant and staff role sets are disjoint", () => {
  for (const vocab of Object.values(VOCABS)) {
    const operator = new Set(vocab.operatorRoles);
    for (const role of vocab.applicantRoles ?? []) {
      assert.ok(!operator.has(role), `applicant role "${role}" collides with operator set`);
    }
    for (const role of vocab.staffRoles ?? []) {
      assert.ok(!operator.has(role), `staff role "${role}" collides with operator set`);
    }
  }
});

test("every covered division has a role vocab, and its first operator role resolves to operator standing", () => {
  for (const division of AWARE_DIVISIONS) {
    const vocab = VOCABS[division];
    assert.ok(vocab, `no vocab registered for division "${division}"`);
    const firstOperatorRole = vocab.operatorRoles[0];
    assert.ok(firstOperatorRole, `division "${division}" has no operator roles`);
    const standing = standingFromRoles(
      { signedIn: true, roles: [firstOperatorRole] },
      vocab,
    );
    assert.deepEqual(standing, { kind: "operator", track: vocab.track });
  }
});

test("each covered division's operator chrome differs from its customer chrome", () => {
  for (const division of AWARE_DIVISIONS) {
    const operator = resolveChromePlan(division, {
      kind: "operator",
      track: VOCABS[division].track,
    });
    const customer = resolveChromePlan(division, { kind: "customer" });
    assert.notDeepEqual(
      operator.primaryCta,
      customer.primaryCta,
      `${division}: operator sees the same primary CTA as a customer (no smart flip)`,
    );
  }
});

// ── resolveChromePlan: totality + fallback semantics ────────────────────────

test("every division × standing resolves to a plan that echoes its standing", () => {
  for (const division of AWARE_DIVISIONS) {
    for (const standing of ALL_STANDINGS) {
      const plan = resolveChromePlan(division, standing);
      assert.deepEqual(plan.standing, standing);
      assert.ok(plan.primaryCta.label.length > 0);
      assert.ok(plan.recruit.label.length > 0);
    }
  }
});

test("omitted staff rows fall back to CUSTOMER chrome, never operator chrome", () => {
  for (const division of AWARE_DIVISIONS) {
    if (__PLAN_TABLES[division].staff) continue;
    const staff = resolveChromePlan(division, { kind: "staff" });
    const customer = resolveChromePlan(division, { kind: "customer" });
    const operator = resolveChromePlan(division, { kind: "operator", track: "vendor" });
    assert.deepEqual(staff.primaryCta, customer.primaryCta);
    assert.notDeepEqual(staff.primaryCta, operator.primaryCta);
  }
});

// ── Doctrine invariants ──────────────────────────────────────────────────────

const RECRUIT_LANGUAGE = /apply|application|become|start selling|i.m hiring|open seller/i;

test("invariant: an operator is never re-recruited on any surface", () => {
  for (const division of AWARE_DIVISIONS) {
    const plan = resolveChromePlan(division, { kind: "operator", track: "vendor" });
    for (const action of actionsOf(plan)) {
      assert.ok(
        !RECRUIT_LANGUAGE.test(action.label),
        `${division} operator sees recruit language: "${action.label}"`,
      );
    }
    assert.ok(plan.workspace, `${division} operator has no workspace action`);
    assert.equal(
      plan.recruit.href,
      plan.workspace.href,
      `${division} operator recruit CTA must BE the workspace`,
    );
  }
});

test("invariant: applicants are pointed at status, never back at the form", () => {
  for (const division of AWARE_DIVISIONS) {
    const table = __PLAN_TABLES[division];
    if (!table.applicant) continue; // division has no applicant state
    const applicant = resolveChromePlan(division, { kind: "applicant", track: "vendor" });
    const customer = resolveChromePlan(division, { kind: "customer" });
    assert.notEqual(
      applicant.recruit.label,
      customer.recruit.label,
      `${division} applicant sees the same recruit CTA as a customer`,
    );
    assert.match(applicant.recruit.label, /track/i);
  }
});

test("invariant: hrefs are division-local paths", () => {
  for (const division of AWARE_DIVISIONS) {
    for (const standing of ALL_STANDINGS) {
      for (const action of actionsOf(resolveChromePlan(division, standing))) {
        assert.ok(action.href.startsWith("/"), `${division}: "${action.href}" is not local`);
        assert.ok(!/^https?:|\s/.test(action.href), `${division}: suspicious href "${action.href}"`);
      }
    }
  }
});

test("invariant: labels hold the voice (no urgency, no exclamation, no retired brand)", () => {
  for (const division of AWARE_DIVISIONS) {
    for (const standing of ALL_STANDINGS) {
      for (const action of actionsOf(resolveChromePlan(division, standing))) {
        assert.ok(!action.label.includes("!"), `exclamation in "${action.label}"`);
        assert.ok(!/\bnow\b|instantly|unlock|hurry/i.test(action.label), `urgency in "${action.label}"`);
        assert.ok(!/HenryCo\b|Henry & Co/.test(action.label), `retired brand in "${action.label}"`);
        assert.ok(!/[{}]/.test(action.label), `template braces in "${action.label}"`);
      }
    }
  }
});
