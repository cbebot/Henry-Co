/**
 * Brief Composer section model — PURE (no React, no server imports, no
 * side-effects) so it runs under `tsx --test` and is safe to import from
 * client components and tests alike.
 *
 * The composer presents the studio brief as six reviewable section cards
 * instead of a 4-step wizard. This module owns:
 *   - which draft fields belong to which section (`COMPOSER_SECTIONS`)
 *   - the collapsed-card prose summary (`sectionSummary`)
 *   - completeness, which drives collapsed-vs-open + badges
 *     (`sectionIsComplete`)
 *   - the mapping from `validateStep` error keys to the owning section
 *     (`sectionForErrorKey`)
 *   - the field-level diff between an AI-revised structured brief and the
 *     current draft (`diffStructuredAgainstDraft`)
 *   - the composed "describe a change" input for the existing one-shot
 *     co-pilot action (`composeChangeDescription`)
 *
 * Copy passes through an injected `t` so this module stays locale-agnostic
 * (the caller wires `translateSurfaceLabel`).
 */

import type { BriefCopilotStructured } from "../../../lib/studio/brief-copilot-structured";
import type { StudioBriefDraft } from "../../../lib/studio/request-fields";
import { inferServiceKindFromProjectType } from "../../../lib/studio/brief-chat";

// ─── Section registry ─────────────────────────────────────────────────────────

export type ComposerSectionKey =
  | "project"
  | "scope"
  | "stack"
  | "business"
  | "domain"
  | "goals";

export type ComposerSection = {
  key: ComposerSectionKey;
  /** Draft fields this section owns. Together the six sections cover every
   * brief field of `StudioBriefDraft` except `stepIndex` (legacy navigation
   * state, kept for envelope-v1 compatibility) and `selectedTeamId` (owned
   * by the submit block in the rail). */
  fields: (keyof StudioBriefDraft)[];
};

export const COMPOSER_SECTIONS: ComposerSection[] = [
  {
    key: "project",
    fields: [
      "serviceKind",
      "pathway",
      "selectedPackageId",
      "selectedProjectType",
      "selectedPlatform",
      "selectedDesign",
      "preferredLanguage",
    ],
  },
  {
    key: "scope",
    fields: ["selectedPages", "selectedModules", "selectedAddOns"],
  },
  {
    key: "stack",
    fields: [
      "selectedProgrammingLanguage",
      "selectedFramework",
      "selectedBackend",
      "selectedHosting",
      "selectedTech",
    ],
  },
  {
    key: "business",
    fields: ["businessType", "budgetBand", "urgency", "timeline"],
  },
  {
    key: "domain",
    fields: ["domainIntentJson"],
  },
  {
    key: "goals",
    fields: ["goals", "scopeNotes", "inspirationSummary"],
  },
];

// ─── Collapsed-card summaries ─────────────────────────────────────────────────

export type SectionSummaryContext = {
  /** Localizer — authored copy goes through this; buyer data stays raw. */
  t: (text: string) => string;
  /** Resolved package name when the draft is on the package lane. */
  packageName?: string | null;
};

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function countLabel(count: number, singular: string, plural: string, t: (s: string) => string) {
  return `${count} ${t(count === 1 ? singular : plural)}`;
}

/** Best-effort read of the serialized domain intent. Defensive — the JSON is
 * produced by the domain section but old drafts may carry anything. */
function parseDomainIntent(intentJson: string): {
  path: "new" | "have" | "later";
  desiredLabel: string;
} | null {
  if (!intentJson.trim()) return null;
  try {
    const parsed = JSON.parse(intentJson) as { path?: unknown; desiredLabel?: unknown };
    const path = parsed.path;
    if (path !== "new" && path !== "have" && path !== "later") return null;
    return { path, desiredLabel: String(parsed.desiredLabel ?? "").trim() };
  } catch {
    return null;
  }
}

/**
 * Short prose parts for a collapsed section card. The caller joins them with
 * a separator (" · "). Every part is non-empty.
 */
export function sectionSummary(
  section: ComposerSectionKey,
  draft: StudioBriefDraft,
  ctx: SectionSummaryContext,
): string[] {
  const { t } = ctx;

  if (section === "project") {
    const lane =
      draft.pathway === "package"
        ? ctx.packageName
          ? `${t("Package")} · ${ctx.packageName}`
          : t("Package")
        : t("Custom build");
    return [
      lane,
      draft.selectedProjectType,
      draft.selectedPlatform,
      draft.selectedDesign,
      draft.preferredLanguage,
    ].filter((part) => part.trim().length > 0);
  }

  if (section === "scope") {
    const parts: string[] = [];
    if (draft.selectedPages.length > 0) {
      parts.push(countLabel(draft.selectedPages.length, "page", "pages", t));
    }
    if (draft.selectedModules.length > 0) {
      parts.push(countLabel(draft.selectedModules.length, "feature", "features", t));
    }
    if (draft.selectedAddOns.length > 0) {
      parts.push(countLabel(draft.selectedAddOns.length, "add-on", "add-ons", t));
    }
    return parts.length > 0 ? parts : [t("Nothing selected yet")];
  }

  if (section === "stack") {
    const parts = [
      draft.selectedProgrammingLanguage,
      draft.selectedFramework,
      draft.selectedBackend,
      draft.selectedHosting,
    ].filter((part) => part.trim().length > 0);
    if (draft.selectedTech.length > 0) {
      parts.push(
        countLabel(draft.selectedTech.length, "stack preference", "stack preferences", t),
      );
    }
    return parts;
  }

  if (section === "business") {
    return [
      draft.businessType || t("Business type open"),
      draft.budgetBand || t("Budget open"),
      draft.urgency,
      draft.timeline,
    ].filter((part) => part.trim().length > 0);
  }

  if (section === "domain") {
    const intent = parseDomainIntent(draft.domainIntentJson);
    if (!intent) return [t("Not decided yet")];
    const head =
      intent.path === "have"
        ? t("Existing domain")
        : intent.path === "later"
          ? t("Decide with Henry Onyx")
          : t("New domain");
    return intent.desiredLabel ? [head, intent.desiredLabel] : [head];
  }

  // goals
  const parts = [
    truncate(draft.goals, 90),
    truncate(draft.scopeNotes, 90),
    truncate(draft.inspirationSummary, 60),
  ].filter((part) => part.length > 0);
  return parts.length > 0 ? parts : [t("Not written yet")];
}

// ─── Completeness ─────────────────────────────────────────────────────────────

/**
 * Whether a section carries enough information to start collapsed. Mirrors
 * the wizard's `validateStep` requirements where they exist (package pick,
 * scope selection, goals/notes length, budget) and adds calm judgement for
 * the rest (stack defaults are honest recommendations; a domain is decided
 * once a path — or a desired name — exists).
 */
export function sectionIsComplete(
  section: ComposerSectionKey,
  draft: StudioBriefDraft,
): boolean {
  if (section === "project") {
    return draft.pathway === "custom" || draft.selectedPackageId.trim().length > 0;
  }
  if (section === "scope") {
    return (
      draft.selectedPages.length + draft.selectedModules.length + draft.selectedAddOns.length >
      0
    );
  }
  if (section === "stack") {
    return true;
  }
  if (section === "business") {
    return draft.businessType.trim().length > 0 && draft.budgetBand.trim().length > 0;
  }
  if (section === "domain") {
    const intent = parseDomainIntent(draft.domainIntentJson);
    if (!intent) return false;
    if (intent.path === "new") return intent.desiredLabel.length > 0;
    return true;
  }
  // goals — same thresholds as validateStep("commercial")
  return draft.goals.trim().length >= 12 && draft.scopeNotes.trim().length >= 12;
}

// ─── validateStep error-key → owning section ─────────────────────────────────

const ERROR_KEY_TO_SECTION: Record<string, ComposerSectionKey> = {
  selectedPackageId: "project",
  scope: "scope",
  goals: "goals",
  scopeNotes: "goals",
  budgetBand: "business",
};

/** Maps a `validateStep` error key to the section card that owns the field.
 * Returns null for unknown keys so callers can fall back gracefully. */
export function sectionForErrorKey(errorKey: string): ComposerSectionKey | null {
  return ERROR_KEY_TO_SECTION[errorKey] ?? null;
}

// ─── AI-revise diff (structuredToDraft overlay semantics) ────────────────────

export type BriefFieldDiff = {
  field: keyof StudioBriefDraft;
  from: string | string[];
  to: string | string[];
};

/** structured field → draft field, in the same overlay order as
 * `structuredToDraft`. `selectedProgrammingLanguage` has no structured
 * counterpart, so the revise flow never touches it. */
const STRUCTURED_TO_DRAFT_FIELDS: Array<{
  structured: keyof BriefCopilotStructured;
  draft: keyof StudioBriefDraft;
}> = [
  { structured: "projectType", draft: "selectedProjectType" },
  { structured: "platformPreference", draft: "selectedPlatform" },
  { structured: "designDirection", draft: "selectedDesign" },
  { structured: "preferredLanguage", draft: "preferredLanguage" },
  { structured: "frameworkPreference", draft: "selectedFramework" },
  { structured: "backendPreference", draft: "selectedBackend" },
  { structured: "hostingPreference", draft: "selectedHosting" },
  { structured: "pageRequirements", draft: "selectedPages" },
  { structured: "requiredFeatures", draft: "selectedModules" },
  { structured: "addonServices", draft: "selectedAddOns" },
  { structured: "techPreferences", draft: "selectedTech" },
  { structured: "businessType", draft: "businessType" },
  { structured: "budgetBand", draft: "budgetBand" },
  { structured: "urgency", draft: "urgency" },
  { structured: "timeline", draft: "timeline" },
  { structured: "goals", draft: "goals" },
  { structured: "scopeNotes", draft: "scopeNotes" },
];

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = new Set(a.map((item) => item.trim()));
  return b.every((item) => left.has(item.trim()));
}

/**
 * Field-level diff between an AI-revised structured brief and the current
 * draft, using the same overlay semantics as `structuredToDraft`: a
 * structured field only *wins* when it is non-empty; empty strings and empty
 * arrays keep the draft value (so they never appear as removals). List
 * comparison is order-insensitive.
 *
 * When the proposed project type implies a different service kind (per the
 * chat on-ramp's `inferServiceKindFromProjectType`), a `serviceKind` change
 * rides along — without it the applied project type would fall out of the
 * kind-filtered option list and silently revert.
 */
export function diffStructuredAgainstDraft(
  structured: BriefCopilotStructured,
  draft: StudioBriefDraft,
): BriefFieldDiff[] {
  const diffs: BriefFieldDiff[] = [];

  for (const mapping of STRUCTURED_TO_DRAFT_FIELDS) {
    const next = structured[mapping.structured];
    const current = draft[mapping.draft];

    if (Array.isArray(next)) {
      const currentList = Array.isArray(current) ? current : [];
      if (next.length === 0) continue; // overlay: empty keeps the draft
      if (sameSet(next, currentList)) continue;
      diffs.push({ field: mapping.draft, from: [...currentList], to: [...next] });
      continue;
    }

    const nextValue = String(next ?? "").trim();
    const currentValue = String(current ?? "").trim();
    if (!nextValue) continue; // overlay: empty keeps the draft
    if (nextValue === currentValue) continue;
    diffs.push({ field: mapping.draft, from: currentValue, to: nextValue });
  }

  const projectTypeChanged = diffs.some((entry) => entry.field === "selectedProjectType");
  if (projectTypeChanged) {
    const inferredKind = inferServiceKindFromProjectType(structured.projectType);
    if (inferredKind !== draft.serviceKind) {
      diffs.push({ field: "serviceKind", from: draft.serviceKind, to: inferredKind });
    }
  }

  return diffs;
}

/** Collapses a diff list into the patch `Apply` writes onto the draft. */
export function patchFromDiffs(diffs: BriefFieldDiff[]): Partial<StudioBriefDraft> {
  const patch: Record<string, string | string[]> = {};
  for (const entry of diffs) {
    patch[entry.field] = Array.isArray(entry.to) ? [...entry.to] : entry.to;
  }
  return patch as Partial<StudioBriefDraft>;
}

// ─── Describe-a-change composition ────────────────────────────────────────────

/** The one-shot action refuses inputs above this length; composition stays
 * inside it so an honest brief never bounces for size alone. */
const MAX_DESCRIPTION_LENGTH = 1600;

type NoteBudget = { notes: number; keepInspiration: boolean; listMax: number };

function briefSnapshotJson(draft: StudioBriefDraft, budget: NoteBudget): string {
  const list = (values: string[]) =>
    values.length > budget.listMax
      ? [...values.slice(0, budget.listMax), `+${values.length - budget.listMax} more`]
      : values;

  const snapshot: Record<string, unknown> = {
    lane: draft.pathway,
    serviceKind: draft.serviceKind,
    projectType: draft.selectedProjectType,
    platform: draft.selectedPlatform,
    design: draft.selectedDesign,
    language: draft.preferredLanguage,
    pages: list(draft.selectedPages),
    features: list(draft.selectedModules),
    addons: list(draft.selectedAddOns),
    stack: {
      language: draft.selectedProgrammingLanguage,
      framework: draft.selectedFramework,
      backend: draft.selectedBackend,
      hosting: draft.selectedHosting,
      preferences: list(draft.selectedTech),
    },
    businessType: draft.businessType,
    budget: draft.budgetBand,
    urgency: draft.urgency,
    timeline: draft.timeline,
    goals: truncate(draft.goals, budget.notes),
    notes: truncate(draft.scopeNotes, budget.notes),
  };
  if (budget.keepInspiration && draft.inspirationSummary.trim()) {
    snapshot.inspiration = truncate(draft.inspirationSummary, Math.min(budget.notes, 120));
  }
  return JSON.stringify(snapshot);
}

/**
 * Composes the `description` for `generateStudioBriefDraftAction` in the
 * agreed frame: current brief (compact JSON) + the requested change + an
 * instruction to return the full updated brief. Tightens the snapshot in
 * steps until the whole description fits the action's input ceiling.
 */
export function composeChangeDescription(draft: StudioBriefDraft, request: string): string {
  const wrap = (json: string) =>
    `CURRENT BRIEF:\n${json}\n\nREQUESTED CHANGE:\n${request.trim()}\n\nReturn the FULL updated brief.`;

  const budgets: NoteBudget[] = [
    { notes: 160, keepInspiration: true, listMax: 12 },
    { notes: 90, keepInspiration: true, listMax: 8 },
    { notes: 60, keepInspiration: false, listMax: 6 },
    { notes: 40, keepInspiration: false, listMax: 4 },
  ];

  let composed = wrap(briefSnapshotJson(draft, budgets[0]));
  for (const budget of budgets) {
    composed = wrap(briefSnapshotJson(draft, budget));
    if (composed.length <= MAX_DESCRIPTION_LENGTH) return composed;
  }
  return composed;
}
