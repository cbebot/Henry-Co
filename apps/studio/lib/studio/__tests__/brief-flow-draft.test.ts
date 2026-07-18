import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  briefFlowDraftHasSubstance,
  canReuseBriefFlowRow,
  sanitizeBriefFlowDraft,
} from "@/lib/studio/brief-flow-draft";
import { emptyStudioBriefDraft } from "@/lib/studio/request-fields";
import { defaultStudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioService } from "@/lib/studio/types";

const services: StudioService[] = [
  {
    id: "svc-web",
    kind: "website",
    name: "Website",
    headline: "",
    summary: "",
    startingPrice: 500_000,
    deliveryWindow: "",
    stack: [],
    outcomes: [],
    scoreBoosts: [],
  },
];

function baseDraft() {
  return emptyStudioBriefDraft({
    config: defaultStudioRequestConfig(),
    services,
  });
}

describe("sanitizeBriefFlowDraft — the recovery envelope validator", () => {
  it("round-trips a real draft envelope unchanged in the fields that matter", () => {
    const draft = {
      ...baseDraft(),
      goals: "Calmer client onboarding with fewer emails.",
      scopeNotes: "Portal with approvals and files.",
      budgetBand: "₦1,500,000",
      selectedModules: ["Payments and invoicing"],
      pathway: "custom" as const,
    };
    const sanitized = sanitizeBriefFlowDraft(JSON.parse(JSON.stringify(draft)));
    assert.ok(sanitized);
    assert.equal(sanitized.goals, draft.goals);
    assert.equal(sanitized.budgetBand, draft.budgetBand);
    assert.deepEqual(sanitized.selectedModules, draft.selectedModules);
    assert.equal(sanitized.pathway, "custom");
    assert.equal(sanitized.serviceKind, "website");
  });

  it("rejects payloads that are not draft-shaped", () => {
    assert.equal(sanitizeBriefFlowDraft(null), null);
    assert.equal(sanitizeBriefFlowDraft("goals"), null);
    assert.equal(sanitizeBriefFlowDraft([]), null);
    assert.equal(sanitizeBriefFlowDraft({ pathway: "custom" }), null); // no serviceKind
    assert.equal(
      sanitizeBriefFlowDraft({ serviceKind: "website", pathway: "weird" }),
      null,
    );
    assert.equal(
      sanitizeBriefFlowDraft({ serviceKind: "not-a-kind", pathway: "custom" }),
      null,
    );
  });

  it("coerces hostile field types instead of crashing", () => {
    const sanitized = sanitizeBriefFlowDraft({
      serviceKind: "website",
      pathway: "package",
      stepIndex: "99",
      selectedModules: [1, { a: 2 }, "Real module", ""],
      goals: 42,
    });
    assert.ok(sanitized);
    assert.equal(sanitized.stepIndex, 3); // clamped
    assert.deepEqual(sanitized.selectedModules, ["1", "[object Object]", "Real module"]);
    assert.equal(sanitized.goals, "42");
  });
});

describe("canReuseBriefFlowRow — never write across identities", () => {
  const sessionId = "session-abc";

  it("signed-in: reuse only the same user's row", () => {
    assert.equal(
      canReuseBriefFlowRow({ user_id: "u1", session_id: sessionId }, { userId: "u1", sessionId }),
      true,
    );
    assert.equal(
      canReuseBriefFlowRow({ user_id: "u2", session_id: sessionId }, { userId: "u1", sessionId }),
      false,
    );
    // A signed-in user must NOT adopt an anonymous row via session alone —
    // (prevents cross-account leakage through a shared browser cookie)…
    assert.equal(
      canReuseBriefFlowRow({ user_id: null, session_id: sessionId }, { userId: "u1", sessionId }),
      false,
    );
  });

  it("anonymous: reuse only an anonymous row with the same session", () => {
    assert.equal(
      canReuseBriefFlowRow({ user_id: null, session_id: sessionId }, { userId: null, sessionId }),
      true,
    );
    assert.equal(
      canReuseBriefFlowRow(
        { user_id: null, session_id: "other-session" },
        { userId: null, sessionId },
      ),
      false,
    );
    // …and an anonymous visitor must never adopt a signed-in user's row.
    assert.equal(
      canReuseBriefFlowRow({ user_id: "u1", session_id: sessionId }, { userId: null, sessionId }),
      false,
    );
  });
});

describe("briefFlowDraftHasSubstance — junk drafts are not worth persisting", () => {
  it("an untouched default draft has no substance", () => {
    assert.equal(briefFlowDraftHasSubstance(baseDraft()), false);
  });

  it("any typed answer counts as substance", () => {
    assert.equal(
      briefFlowDraftHasSubstance({ ...baseDraft(), goals: "Grow bookings" }),
      true,
    );
    assert.equal(
      briefFlowDraftHasSubstance({ ...baseDraft(), selectedPackageId: "pkg-1" }),
      true,
    );
    assert.equal(
      briefFlowDraftHasSubstance({
        ...baseDraft(),
        domainIntentJson: '{"path":"new","desiredLabel":"riveroak"}',
      }),
      true,
    );
  });
});
