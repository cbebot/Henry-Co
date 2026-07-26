import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TEMPLATE_SCOPE_GROWTH_LIMIT,
  classifyStudioBrief,
  resolveBriefSubmissionPlan,
} from "@/lib/studio/brief-class";

describe("classifyStudioBrief — the SA-D5 discriminator", () => {
  it("classifies a custom brief as agency regardless of price", () => {
    assert.equal(
      classifyStudioBrief({ packageIntent: "custom", packagePrice: null, estimatedTotal: 0 }),
      "agency",
    );
    assert.equal(
      classifyStudioBrief({
        packageIntent: "custom",
        packagePrice: 2_000_000,
        estimatedTotal: 1_000_000,
      }),
      "agency",
    );
  });

  it("classifies a package brief within the growth limit as template", () => {
    assert.equal(
      classifyStudioBrief({
        packageIntent: "package",
        packagePrice: 1_950_000,
        estimatedTotal: 1_950_000,
      }),
      "template",
    );
    // Exactly at the limit is still template (limit is exclusive).
    assert.equal(
      classifyStudioBrief({
        packageIntent: "package",
        packagePrice: 1_000_000,
        estimatedTotal: 1_000_000 * TEMPLATE_SCOPE_GROWTH_LIMIT,
      }),
      "template",
    );
  });

  it("escalates a package brief whose estimate outgrew the package to agency", () => {
    assert.equal(
      classifyStudioBrief({
        packageIntent: "package",
        packagePrice: 1_000_000,
        estimatedTotal: 1_000_000 * TEMPLATE_SCOPE_GROWTH_LIMIT + 1,
      }),
      "agency",
    );
  });

  it("treats an unresolved or zero-priced package as agency (judgment lane)", () => {
    assert.equal(
      classifyStudioBrief({ packageIntent: "package", packagePrice: null, estimatedTotal: 500_000 }),
      "agency",
    );
    assert.equal(
      classifyStudioBrief({ packageIntent: "package", packagePrice: 0, estimatedTotal: 500_000 }),
      "agency",
    );
  });
});

describe("resolveBriefSubmissionPlan — the SA-D5 routing law", () => {
  it("template without deposit keeps the shipped instant auto-send", () => {
    const plan = resolveBriefSubmissionPlan({ briefClass: "template", depositNow: false });
    assert.deepEqual(plan, {
      proposalStatus: "sent",
      leadStatus: "proposal_sent",
      createProjectNow: false,
      sendProposalNow: true,
      heldForReview: false,
    });
  });

  it("template with deposit keeps the shipped instant accept + workspace", () => {
    const plan = resolveBriefSubmissionPlan({ briefClass: "template", depositNow: true });
    assert.deepEqual(plan, {
      proposalStatus: "accepted",
      leadStatus: "won",
      createProjectNow: true,
      sendProposalNow: true,
      heldForReview: false,
    });
  });

  it("agency holds in_review with no proposal email and no workspace", () => {
    const plan = resolveBriefSubmissionPlan({ briefClass: "agency", depositNow: false });
    assert.deepEqual(plan, {
      proposalStatus: "in_review",
      leadStatus: "proposal_ready",
      createProjectNow: false,
      sendProposalNow: false,
      heldForReview: true,
    });
  });

  it("agency holds EVEN when the client offered the deposit immediately", () => {
    // The whole point of SA-D5: the first human look happens before the
    // client commits at a price. depositNow must never bypass the gate.
    const plan = resolveBriefSubmissionPlan({ briefClass: "agency", depositNow: true });
    assert.equal(plan.heldForReview, true);
    assert.equal(plan.proposalStatus, "in_review");
    assert.equal(plan.createProjectNow, false);
    assert.equal(plan.sendProposalNow, false);
  });
});
