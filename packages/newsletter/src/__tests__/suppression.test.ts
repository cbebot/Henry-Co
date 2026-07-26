import { test } from "node:test";
import assert from "node:assert/strict";

import { scopeMatchesCampaign, evaluateSuppression } from "../suppression";
import type {
  NewsletterCampaignClass,
  NewsletterSuppressionEntry,
} from "../types";

// ---------------------------------------------------------------------------
// scopeMatchesCampaign — the STAFF-6 semantics
//
// The bug: send paths treated a `transactional_only` suppression entry as
// "not suppressed" for EVERY campaign, so a marketing blast reached an
// address that had opted down to transactional-only. The canonical rule is
// that `transactional_only` suppresses every class EXCEPT
// `transactional_education`.
// ---------------------------------------------------------------------------

const MARKETING_CLASSES: NewsletterCampaignClass[] = [
  "company_wide",
  "division_digest",
  "lifecycle_journey",
  "announcement",
];

test("transactional_only SUPPRESSES every marketing/lifecycle class", () => {
  for (const cls of MARKETING_CLASSES) {
    assert.equal(
      scopeMatchesCampaign("transactional_only", cls),
      true,
      `transactional_only must suppress ${cls}`,
    );
  }
});

test("transactional_only ALLOWS only transactional_education", () => {
  assert.equal(
    scopeMatchesCampaign("transactional_only", "transactional_education"),
    false,
  );
});

test("all scope suppresses every class", () => {
  for (const cls of [...MARKETING_CLASSES, "transactional_education"] as NewsletterCampaignClass[]) {
    assert.equal(scopeMatchesCampaign("all", cls), true);
  }
});

test("marketing scope suppresses only marketing classes, not lifecycle or transactional", () => {
  assert.equal(scopeMatchesCampaign("marketing", "company_wide"), true);
  assert.equal(scopeMatchesCampaign("marketing", "division_digest"), true);
  assert.equal(scopeMatchesCampaign("marketing", "announcement"), true);
  assert.equal(scopeMatchesCampaign("marketing", "lifecycle_journey"), false);
  assert.equal(scopeMatchesCampaign("marketing", "transactional_education"), false);
});

// ---------------------------------------------------------------------------
// evaluateSuppression end-to-end — the canonical decision the send loops
// now defer to via scopeMatchesCampaign.
// ---------------------------------------------------------------------------

function activeSubscriber() {
  return {
    email: "opted-down@example.com",
    status: "active" as const,
    hardBounceCount: 0,
    softBounceCount: 0,
    lastBouncedAt: null,
  };
}

const transactionalOnlyEntry: NewsletterSuppressionEntry = {
  email: "opted-down@example.com",
  reason: "manual_optout",
  scope: "transactional_only",
  note: null,
  expiresAt: null,
} as NewsletterSuppressionEntry;

test("evaluateSuppression: transactional_only entry BLOCKS a company_wide (marketing) send", () => {
  const decision = evaluateSuppression({
    subscriber: activeSubscriber(),
    campaignClass: "company_wide",
    suppressionEntries: [transactionalOnlyEntry],
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.scope, "transactional_only");
});

test("evaluateSuppression: transactional_only entry ALLOWS a transactional_education send", () => {
  const decision = evaluateSuppression({
    subscriber: activeSubscriber(),
    campaignClass: "transactional_education",
    suppressionEntries: [transactionalOnlyEntry],
  });
  assert.equal(decision.allowed, true);
});
