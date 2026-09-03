/**
 * SA-1 — server-side brief-draft envelope, PURE half (no React, no server
 * imports) so the sanitizer and the ownership rule are unit-tested.
 *
 * The server row stores the SAME frozen-v1 `StudioBriefDraft` shape the
 * composer keeps in localStorage (request-fields.ts). The v1 envelope stays
 * frozen: this module never adds fields to it — it only validates a raw
 * JSONB payload back into the shape, dropping anything unexpected.
 */

import { STUDIO_BRIEF_DRAFT_VERSION, type StudioBriefDraft } from "@/lib/studio/request-fields";

export const BRIEF_FLOW_DRAFT_SOURCES = ["composer", "guided", "copilot"] as const;
export type BriefFlowDraftSource = (typeof BRIEF_FLOW_DRAFT_SOURCES)[number];

export { STUDIO_BRIEF_DRAFT_VERSION };

const SERVICE_KINDS = [
  "website",
  "mobile_app",
  "ui_ux",
  "branding",
  "ecommerce",
  "internal_system",
  "custom_software",
] as const;

function asString(value: unknown, max = 600): string {
  return String(value ?? "").slice(0, max);
}

function asStringList(value: unknown, maxItems = 24, itemMax = 120): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim().slice(0, itemMax))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Validate a raw payload (client-supplied or read back from JSONB) into a
 * full frozen-v1 draft. Returns null when the payload is not even
 * draft-shaped — a null means "nothing to recover", never a crash.
 */
export function sanitizeBriefFlowDraft(raw: unknown): StudioBriefDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const serviceKind = SERVICE_KINDS.find((kind) => kind === r.serviceKind);
  if (!serviceKind) return null;
  const pathway = r.pathway === "package" ? "package" : r.pathway === "custom" ? "custom" : null;
  if (!pathway) return null;

  const stepIndexRaw = Number(r.stepIndex);
  const stepIndex = Number.isFinite(stepIndexRaw)
    ? Math.min(Math.max(0, Math.round(stepIndexRaw)), 3)
    : 0;

  return {
    stepIndex,
    serviceKind,
    pathway,
    selectedPackageId: asString(r.selectedPackageId, 120),
    selectedTeamId: asString(r.selectedTeamId, 120),
    selectedProjectType: asString(r.selectedProjectType, 160),
    selectedPlatform: asString(r.selectedPlatform, 160),
    selectedDesign: asString(r.selectedDesign, 200),
    preferredLanguage: asString(r.preferredLanguage, 60),
    selectedPages: asStringList(r.selectedPages),
    selectedModules: asStringList(r.selectedModules),
    selectedAddOns: asStringList(r.selectedAddOns),
    selectedTech: asStringList(r.selectedTech),
    selectedProgrammingLanguage: asString(r.selectedProgrammingLanguage, 120),
    selectedFramework: asString(r.selectedFramework, 120),
    selectedBackend: asString(r.selectedBackend, 120),
    selectedHosting: asString(r.selectedHosting, 120),
    businessType: asString(r.businessType, 160),
    budgetBand: asString(r.budgetBand, 80),
    urgency: asString(r.urgency, 120),
    timeline: asString(r.timeline, 120),
    goals: asString(r.goals, 2000),
    scopeNotes: asString(r.scopeNotes, 3000),
    inspirationSummary: asString(r.inspirationSummary, 2000),
    domainIntentJson: asString(r.domainIntentJson, 2000),
  };
}

/**
 * The persist.ts ownership rule, verbatim: a stored row may be reused only
 * when the signed-in user matches, or — for anonymous rows — when the row
 * is anonymous AND the session matches. "Never write across."
 */
export function canReuseBriefFlowRow(
  row: { user_id: string | null; session_id: string },
  identity: { userId: string | null; sessionId: string },
): boolean {
  if (identity.userId) return row.user_id === identity.userId;
  return row.user_id === null && row.session_id === identity.sessionId;
}

/** Whether a recovered draft carries anything a person actually typed —
 * defaults-only drafts are not worth restoring over an empty composer. */
export function briefFlowDraftHasSubstance(draft: StudioBriefDraft): boolean {
  return (
    draft.goals.trim().length > 0 ||
    draft.scopeNotes.trim().length > 0 ||
    draft.inspirationSummary.trim().length > 0 ||
    draft.businessType.trim().length > 0 ||
    draft.budgetBand.trim().length > 0 ||
    draft.selectedPackageId.trim().length > 0 ||
    draft.selectedPages.length > 0 ||
    draft.selectedModules.length > 0 ||
    draft.selectedAddOns.length > 0 ||
    draft.domainIntentJson.trim().length > 0
  );
}
