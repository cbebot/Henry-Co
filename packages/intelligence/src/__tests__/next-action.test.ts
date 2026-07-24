/**
 * V3-39 — resolver unit suite (validation gate 2). Proves, per contract:
 * every PageContextKind yields a relevant action; sensitive actions never get
 * the floating chip; opt-out/dismissals suppress server-side; the stitch is
 * consent-gated + fails safe + distinct; the V3-36 seam degrades
 * deterministically; numeric scores never cross the module boundary.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  pickFloatingChipAction,
  resolveNextAction,
  type NextActionCatalogCopy,
  type PageContext,
  type PageContextKind,
} from "../next-action";
import type { HenryDivision, Recommendation, UserContext } from "../index";

const entry = (key: string) => ({
  title: `title:${key}`,
  description: `description:${key}`,
  ctaLabel: `cta:${key}`,
});

const COPY: NextActionCatalogCopy = {
  marketplaceSave: entry("marketplaceSave"),
  marketplaceCompare: entry("marketplaceCompare"),
  careBook: entry("careBook"),
  jobsApply: entry("jobsApply"),
  jobsSave: entry("jobsSave"),
  studioQuote: entry("studioQuote"),
  learnContinue: entry("learnContinue"),
  propertyInspection: entry("propertyInspection"),
  propertySave: entry("propertySave"),
  logisticsTrack: entry("logisticsTrack"),
  logisticsReturn: entry("logisticsReturn"),
  stitchCareToJobs: entry("stitchCareToJobs"),
  stitchLearnToJobs: entry("stitchLearnToJobs"),
  stitchMarketplaceToLogistics: entry("stitchMarketplaceToLogistics"),
};

const baseCtx: UserContext = {
  roleHint: "buyer",
  trustState: "verified",
  profileCompleteness: 1,
};

const buildHref = (division: HenryDivision, path: string) =>
  `https://${division}.test${path}`;

function page(kind: PageContextKind, division: HenryDivision, entityId?: string): PageContext {
  return { kind, division, entityId };
}

const OPTS = { copy: COPY, buildHref };

// ---------------------------------------------------------------------------
// 1. Seed catalog coverage — each page kind returns a relevant, deep-linked action
// ---------------------------------------------------------------------------

test("marketplace_listing yields the save action deep-linked to the listing", () => {
  const actions = resolveNextAction(baseCtx, page("marketplace_listing", "marketplace", "p1"), OPTS);
  assert.ok(actions.length >= 1 && actions.length <= 2);
  assert.equal(actions[0].id, "marketplace-save");
  assert.equal(actions[0].ctaHref, "https://marketplace.test/product/p1?intent=save");
  assert.equal(actions[0].contextKind, "marketplace_listing");
});

test("care_service yields the booking entry with the service deep link", () => {
  const actions = resolveNextAction(baseCtx, page("care_service", "care", "svc9"), OPTS);
  assert.equal(actions[0].id, "care-book");
  assert.equal(actions[0].ctaHref, "https://care.test/book?service=svc9");
});

test("jobs_detail yields apply for a profile-ready viewer", () => {
  const actions = resolveNextAction(baseCtx, page("jobs_detail", "jobs", "j7"), OPTS);
  assert.equal(actions[0].id, "jobs-apply");
  assert.equal(actions[0].ctaHref, "https://jobs.test/jobs/j7?intent=apply");
});

test("jobs_detail yields save-for-later when the profile is not ready", () => {
  const ctx: UserContext = { ...baseCtx, profileCompleteness: 0.2 };
  const actions = resolveNextAction(ctx, page("jobs_detail", "jobs", "j7"), OPTS);
  assert.equal(actions[0].id, "jobs-save");
});

test("jobs_detail never offers apply to a restricted or frozen account", () => {
  for (const trustState of ["restricted", "frozen"] as const) {
    const actions = resolveNextAction(
      { ...baseCtx, trustState },
      page("jobs_detail", "jobs", "j7"),
      OPTS,
    );
    assert.ok(actions.every((a) => a.id !== "jobs-apply"), `${trustState} saw apply`);
  }
});

test("studio_brief yields the brief-submit step", () => {
  const actions = resolveNextAction(baseCtx, page("studio_brief", "studio"), OPTS);
  assert.equal(actions[0].id, "studio-quote");
  assert.equal(actions[0].ctaHref, "https://studio.test/request");
});

test("learn_course yields the resume deep link", () => {
  const actions = resolveNextAction(baseCtx, page("learn_course", "learn", "c3"), OPTS);
  assert.equal(actions[0].id, "learn-continue");
  assert.equal(actions[0].ctaHref, "https://learn.test/learner/courses/c3");
});

test("property_listing yields the inspection request first, save second", () => {
  const actions = resolveNextAction(baseCtx, page("property_listing", "property", "pl2"), OPTS);
  assert.deepEqual(actions.map((a) => a.id), ["property-inspection", "property-save"]);
});

test("logistics_booking yields track-shipment first", () => {
  const actions = resolveNextAction(baseCtx, page("logistics_booking", "logistics"), OPTS);
  assert.equal(actions[0].id, "logistics-track");
  assert.equal(actions[0].ctaHref, "https://logistics.test/track");
});

test("account_home defers to nextAccountSteps (saved jobs surface)", () => {
  const ctx: UserContext = { ...baseCtx, savedJobIds: ["a"] };
  const actions = resolveNextAction(ctx, page("account_home", "account"), OPTS);
  assert.ok(actions.some((a) => a.id === "jobs-saved"));
});

// ---------------------------------------------------------------------------
// 2. Sensitive actions never float
// ---------------------------------------------------------------------------

test("the trust/KYC step is sensitive and inline-only, never the chip", () => {
  const ctx: UserContext = { ...baseCtx, trustState: "needs_action" };
  const actions = resolveNextAction(ctx, page("account_home", "account"), OPTS);
  const trust = actions.find((a) => a.id === "trust-next");
  assert.ok(trust, "trust step expected");
  assert.equal(trust.sensitive, true);
  assert.equal(trust.placement, "inline");
  const chip = pickFloatingChipAction(actions);
  assert.notEqual(chip?.id, "trust-next");
});

test("no sensitive action across the whole seed catalog is chip-placed", () => {
  const kinds: Array<[PageContextKind, HenryDivision]> = [
    ["account_home", "account"],
    ["marketplace_listing", "marketplace"],
    ["care_service", "care"],
    ["jobs_detail", "jobs"],
    ["studio_brief", "studio"],
    ["learn_course", "learn"],
    ["property_listing", "property"],
    ["logistics_booking", "logistics"],
  ];
  const ctx: UserContext = { ...baseCtx, trustState: "needs_action", profileCompleteness: 0.1 };
  for (const [kind, division] of kinds) {
    for (const action of resolveNextAction(ctx, page(kind, division, "x"), OPTS)) {
      if (action.sensitive) assert.equal(action.placement, "inline", `${kind}:${action.id}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Opt-out + dismissal suppression (server-side)
// ---------------------------------------------------------------------------

test("promptsEnabled=false suppresses everything", () => {
  const actions = resolveNextAction(baseCtx, page("marketplace_listing", "marketplace", "p1"), {
    ...OPTS,
    promptsEnabled: false,
  });
  assert.deepEqual(actions, []);
});

test("promptsEnabled null/undefined (unknown or read error) defaults ON", () => {
  for (const promptsEnabled of [null, undefined]) {
    const actions = resolveNextAction(baseCtx, page("care_service", "care"), {
      ...OPTS,
      promptsEnabled,
    });
    assert.ok(actions.length > 0);
  }
});

test("a dismissal suppresses only that (contextKind, actionId) pair", () => {
  const p = page("property_listing", "property", "pl2");
  const actions = resolveNextAction(baseCtx, p, {
    ...OPTS,
    dismissed: [{ contextKind: "property_listing", actionId: "property-inspection" }],
  });
  assert.ok(actions.every((a) => a.id !== "property-inspection"));
  assert.ok(actions.some((a) => a.id === "property-save"));
  // The same actionId dismissed under a DIFFERENT context does not suppress here.
  const other = resolveNextAction(baseCtx, p, {
    ...OPTS,
    dismissed: [{ contextKind: "account_home", actionId: "property-inspection" }],
  });
  assert.ok(other.some((a) => a.id === "property-inspection"));
});

// ---------------------------------------------------------------------------
// 4. Cross-division stitch — consent-gated, distinct, henryDomain-linked
// ---------------------------------------------------------------------------

const completedCare: PageContext = {
  kind: "account_home",
  division: "account",
  recentCompletedActions: [{ kind: "care_booking", division: "care", at: "2026-07-20T00:00:00Z" }],
};

test("a completed care booking stitches to jobs, marked stitched, cross-division href", () => {
  const actions = resolveNextAction(baseCtx, completedCare, {
    ...OPTS,
    stitchConsent: true,
  });
  const stitch = actions.find((a) => a.stitched);
  assert.ok(stitch, "stitch expected");
  assert.equal(stitch.division, "jobs");
  assert.equal(stitch.ctaHref, "https://jobs.test/jobs?focus=care");
  assert.ok(stitch.reasonCodes.includes("cross_sell_division"));
});

test("the stitch FAILS SAFE: absent/false/unknown consent admits no stitch", () => {
  for (const stitchConsent of [undefined, false]) {
    const actions = resolveNextAction(baseCtx, completedCare, {
      ...OPTS,
      stitchConsent,
    });
    assert.ok(actions.every((a) => !a.stitched));
  }
});

test("learn completion stitches to jobs; marketplace purchase stitches to logistics", () => {
  const learnDone = resolveNextAction(
    baseCtx,
    {
      ...completedCare,
      recentCompletedActions: [{ kind: "learn_course", division: "learn", at: "2026-07-20T00:00:00Z" }],
    },
    { ...OPTS, stitchConsent: true },
  );
  assert.ok(learnDone.some((a) => a.stitched && a.division === "jobs"));

  const purchaseDone = resolveNextAction(
    baseCtx,
    {
      ...completedCare,
      recentCompletedActions: [
        { kind: "marketplace_purchase", division: "marketplace", at: "2026-07-20T00:00:00Z" },
      ],
    },
    { ...OPTS, stitchConsent: true },
  );
  assert.ok(purchaseDone.some((a) => a.stitched && a.division === "logistics"));
});

test("no stitch back into the division the viewer is standing in", () => {
  const actions = resolveNextAction(
    baseCtx,
    {
      kind: "jobs_detail",
      division: "jobs",
      entityId: "j1",
      recentCompletedActions: [{ kind: "care_booking", division: "care", at: "2026-07-20T00:00:00Z" }],
    },
    { ...OPTS, stitchConsent: true },
  );
  assert.ok(actions.every((a) => !a.stitched));
});

test("unknown completed-action kinds are ignored", () => {
  const actions = resolveNextAction(
    baseCtx,
    {
      ...completedCare,
      recentCompletedActions: [{ kind: "mystery_event", division: "care", at: "2026-07-20T00:00:00Z" }],
    },
    { ...OPTS, stitchConsent: true },
  );
  assert.ok(actions.every((a) => !a.stitched));
});

// ---------------------------------------------------------------------------
// 5. The V3-36 seam — provided sets consumed when present, fallback otherwise
// ---------------------------------------------------------------------------

test("a provided V3-36 recommendation supersedes the deterministic stitch copy", () => {
  const provided: Recommendation[] = [
    {
      id: "v336-jobs-1",
      division: "jobs",
      title: "provided-title",
      reasonCodes: ["lifecycle_stage_fit" as Recommendation["reasonCodes"][number]],
      confidence: "high",
      ctaHref: "https://jobs.test/jobs/via-v336",
      ctaLabel: "provided-cta",
    },
  ];
  const actions = resolveNextAction(baseCtx, completedCare, {
    ...OPTS,
    stitchConsent: true,
    providedRecommendations: provided,
  });
  const stitch = actions.find((a) => a.stitched);
  assert.ok(stitch);
  assert.equal(stitch.id, "v336-jobs-1");
  assert.equal(stitch.ctaHref, "https://jobs.test/jobs/via-v336");
  assert.ok(stitch.reasonCodes.includes("cross_sell_division"));
});

test("without the provided set the deterministic stitch stands (graceful fallback)", () => {
  const actions = resolveNextAction(baseCtx, completedCare, {
    ...OPTS,
    stitchConsent: true,
    providedRecommendations: undefined,
  });
  const stitch = actions.find((a) => a.stitched);
  assert.ok(stitch);
  assert.equal(stitch.id, "stitch-care-jobs");
});

// ---------------------------------------------------------------------------
// 6. Opacity, determinism, cap
// ---------------------------------------------------------------------------

test("numeric scores never cross the module boundary (deep-walk)", () => {
  const ctx: UserContext = { ...baseCtx, trustState: "needs_action", savedJobIds: ["a"] };
  const actions = resolveNextAction(ctx, completedCare, { ...OPTS, stitchConsent: true });
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, v] of Object.entries(value)) {
        assert.notEqual(key, "score", `numeric score leaked at ${path}.${key}`);
        // The public NextAction contract carries NO numeric field at all —
        // any number in the payload is a scoring leak.
        assert.ok(typeof v !== "number", `numeric value leaked at ${path}.${key}`);
        walk(v, `${path}.${key}`);
      }
    }
  };
  walk(actions, "actions");
});

test("resolution is deterministic — same inputs, same output", () => {
  const ctx: UserContext = { ...baseCtx, trustState: "pending_review", savedJobIds: ["a"] };
  const a = resolveNextAction(ctx, completedCare, { ...OPTS, stitchConsent: true });
  const b = resolveNextAction(ctx, completedCare, { ...OPTS, stitchConsent: true });
  assert.deepEqual(a, b);
});

test("never more than 2 actions; limit clamps to the 0..2 contract", () => {
  const ctx: UserContext = {
    ...baseCtx,
    trustState: "needs_action",
    profileCompleteness: 0.1,
    savedJobIds: ["a"],
  };
  const actions = resolveNextAction(ctx, completedCare, {
    ...OPTS,
    stitchConsent: true,
    limit: 99,
  });
  assert.ok(actions.length <= 2);
  const none = resolveNextAction(ctx, completedCare, { ...OPTS, limit: 0 });
  assert.deepEqual(none, []);
});

test("pickFloatingChipAction returns the first non-sensitive chip candidate only", () => {
  const ctx: UserContext = { ...baseCtx, trustState: "needs_action", savedJobIds: ["a"] };
  const actions = resolveNextAction(ctx, page("account_home", "account"), OPTS);
  const chip = pickFloatingChipAction(actions);
  if (chip) {
    assert.equal(chip.sensitive, false);
    assert.equal(chip.placement, "floating_chip");
  }
  assert.equal(pickFloatingChipAction([]), null);
});
