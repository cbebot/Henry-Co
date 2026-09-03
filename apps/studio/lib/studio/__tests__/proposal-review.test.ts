import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  composeProposalReviewCard,
  parseStatedBudgetCeiling,
} from "@/lib/studio/proposal-review";
import type { StudioBrief, StudioLead, StudioProposal } from "@/lib/studio/types";

function lead(overrides: Partial<StudioLead> = {}): StudioLead {
  return {
    id: "lead-1",
    createdAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z",
    userId: null,
    normalizedEmail: "client@example.com",
    customerName: "Ada Client",
    companyName: "River Oak Ltd",
    phone: null,
    serviceKind: "custom_software",
    status: "proposal_ready",
    readinessScore: 78,
    businessType: "Financial services",
    budgetBand: "₦3M – ₦8M",
    urgency: "Standard delivery lane",
    requestedPackageId: null,
    preferredTeamId: null,
    matchedTeamId: "team-1",
    ...overrides,
  };
}

function brief(overrides: Partial<StudioBrief> = {}): StudioBrief {
  return {
    id: "brief-1",
    leadId: "lead-1",
    createdAt: "2026-07-18T10:00:00.000Z",
    goals: "A client portal that reduces back-and-forth email.",
    scopeNotes: "Accounts, milestone views, approvals, files, and payment checkpoints.",
    businessType: "Financial services",
    budgetBand: "₦3M – ₦8M",
    urgency: "Standard delivery lane",
    timeline: "2 to 4 months",
    packageIntent: "custom",
    briefClass: "agency",
    techPreferences: [],
    requiredFeatures: ["Admin dashboard", "Payments"],
    referenceFiles: [],
    referenceLinks: [],
    domainIntent: null,
    ...overrides,
  };
}

function proposal(overrides: Partial<StudioProposal> = {}): StudioProposal {
  return {
    id: "prop-1",
    leadId: "lead-1",
    createdAt: "2026-07-18T10:05:00.000Z",
    updatedAt: "2026-07-18T10:05:00.000Z",
    accessKey: "k",
    status: "in_review",
    title: "Custom software scope for River Oak Ltd",
    summary: "",
    investment: 6_000_000,
    depositAmount: 2_400_000,
    currency: "NGN",
    validUntil: "2026-07-25T10:05:00.000Z",
    teamId: "team-1",
    serviceId: "svc-custom",
    packageId: null,
    scopeBullets: [],
    milestones: [],
    comparisonNotes: [],
    ...overrides,
  };
}

describe("parseStatedBudgetCeiling", () => {
  it("reads the fixed-input format", () => {
    assert.equal(parseStatedBudgetCeiling("₦1,500,000"), 1_500_000);
  });
  it("reads band formats at their most generous top end", () => {
    assert.equal(parseStatedBudgetCeiling("₦8M – ₦20M"), 20_000_000);
    assert.equal(parseStatedBudgetCeiling("₦20M+"), 20_000_000);
    assert.equal(parseStatedBudgetCeiling("Below ₦1M"), 1_000_000);
  });
  it("returns null when no figure exists", () => {
    assert.equal(parseStatedBudgetCeiling("Not sure yet"), null);
    assert.equal(parseStatedBudgetCeiling(""), null);
  });
});

describe("composeProposalReviewCard — deterministic judgment aids", () => {
  it("flags an estimate above the stated budget ceiling", () => {
    const card = composeProposalReviewCard({
      proposal: proposal({ investment: 12_000_000 }),
      lead: lead({ budgetBand: "₦3M – ₦8M" }),
      brief: brief(),
      customRequest: null,
    });
    assert.ok(card.signals.some((signal) => signal.includes("above the stated budget")));
  });

  it("stays calm when scope, budget, and timing read consistent", () => {
    const card = composeProposalReviewCard({
      proposal: proposal({ investment: 6_000_000 }),
      lead: lead(),
      brief: brief(),
      customRequest: null,
    });
    assert.ok(card.signals.some((signal) => signal.includes("Nothing unusual")));
    assert.equal(card.clientName, "Ada Client");
    assert.equal(card.investment, 6_000_000);
  });

  it("flags a thin brief and light scope notes", () => {
    const card = composeProposalReviewCard({
      proposal: proposal(),
      lead: lead({ readinessScore: 48 }),
      brief: brief({ scopeNotes: "A site." }),
      customRequest: null,
    });
    assert.ok(card.signals.some((signal) => signal.includes("Thin brief")));
    assert.ok(card.signals.some((signal) => signal.includes("Scope notes are light")));
  });

  it("surfaces an unverified new-domain want", () => {
    const card = composeProposalReviewCard({
      proposal: proposal(),
      lead: lead(),
      brief: brief({
        domainIntent: {
          path: "new",
          desiredLabel: "riveroak",
          checkedFqdn: null,
          checkStatus: "draft",
          suggestionsShown: [],
          lookupMode: "off",
          lastMessage: null,
        },
      }),
      customRequest: null,
    });
    assert.ok(card.signals.some((signal) => signal.includes("riveroak")));
  });
});
