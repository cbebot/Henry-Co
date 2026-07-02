/**
 * Studio brief field contract — single source of truth for:
 *   - FormData field names consumed by `submitStudioBriefAction`
 *   - The persisted draft shape (localStorage envelope v1)
 *   - Default-value derivation helpers used by all brief entry points
 *     (manual builder, guided interview, chat on-ramp)
 *   - Per-step validation helpers (path / scope / commercial)
 *   - Activation-step helpers (nameOk / emailOk) — kept separate because
 *     activation fields are NOT persisted to the draft
 *
 * This module has NO React imports and NO side-effects so it is safe to
 * import from any on-ramp (server component, client component, or pure
 * function) without pulling in the React runtime.
 */

import {
  filterModifierOptions,
  filterPricedOptions,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-structured";
import type { StudioService } from "@/lib/studio/types";

// ─── Draft storage key + schema version ───────────────────────────────────────

/** localStorage key for the studio brief draft envelope. */
export const STUDIO_BRIEF_DRAFT_KEY = "studio-brief-new";

/**
 * Schema version for the draft envelope. Bump this when the shape of
 * `StudioBriefDraft` changes in a breaking way so stale envelopes are
 * silently ignored on restore.
 *
 * Version 1 — initial shape (2026-05-30). Drafts already stored in
 * users' localStorage at v1; do NOT change the field set without
 * bumping this.
 */
export const STUDIO_BRIEF_DRAFT_VERSION = 1;

// ─── FormData field name contract ─────────────────────────────────────────────

/**
 * Every FormData field name that `submitStudioBriefAction` reads.
 * Centralised here so the builder, any new on-ramp, and any future
 * server-side validation all use the exact same strings.
 */
export const REQUEST_FIELD_NAMES = {
  customerName: "customerName",
  companyName: "companyName",
  email: "email",
  phone: "phone",
  serviceKind: "serviceKind",
  businessType: "businessType",
  budgetBand: "budgetBand",
  urgency: "urgency",
  timeline: "timeline",
  goals: "goals",
  scopeNotes: "scopeNotes",
  packageIntent: "packageIntent",
  packageId: "packageId",
  preferredTeamId: "preferredTeamId",
  referenceLinks: "referenceLinks",
  techPreferences: "techPreferences",
  requiredFeatures: "requiredFeatures",
  projectType: "projectType",
  platformPreference: "platformPreference",
  preferredLanguage: "preferredLanguage",
  programmingLanguage: "programmingLanguage",
  frameworkPreference: "frameworkPreference",
  backendPreference: "backendPreference",
  hostingPreference: "hostingPreference",
  designDirection: "designDirection",
  pageRequirements: "pageRequirements",
  addonServices: "addonServices",
  inspirationSummary: "inspirationSummary",
  depositNow: "depositNow",
  domainIntentJson: "domainIntentJson",
  referenceFiles: "referenceFiles",
} as const;

// ─── Step ordering ─────────────────────────────────────────────────────────────

export const STEP_ORDER = ["path", "scope", "commercial", "activation"] as const;
export type StudioStepKey = (typeof STEP_ORDER)[number];

// ─── Draft shape ──────────────────────────────────────────────────────────────

/**
 * Persisted user-input shape for the studio brief draft.
 *
 * Captures every field the user types or selects across the 4-step
 * builder (Path / Scope / Commercial / Activation), plus the current
 * step index so a mid-flow reauth lands the user back on the right
 * step instead of step 1. Excluded from the envelope:
 *
 *   - `services`, `packages`, `teams`, `requestConfig`, `presetHint`
 *     and `copilotSeed` — all server- or runtime-supplied (props).
 *   - `isStepTransitioning`, `progressHint` — UI animation state.
 *   - Derived memos (effective*, filteredPackages, pricingPreview,
 *     readinessScore) — computed from the persisted fields above.
 *   - DOM refs (`topRef`).
 *   - Activation fields (customerName, email, phone, companyName,
 *     depositNow) — entered directly as builder-local useState, never
 *     persisted to the draft.
 *
 * The studio brief has no payment / KYC / password fields, so no
 * sensitive-data exclusion is needed beyond the categories above.
 *
 * Shape is FROZEN at v1 — drafts already exist in users' localStorage.
 * Do not add or remove fields without bumping STUDIO_BRIEF_DRAFT_VERSION.
 */
export type StudioBriefDraft = {
  stepIndex: number;
  serviceKind: StudioService["kind"];
  pathway: "package" | "custom";
  selectedPackageId: string;
  selectedTeamId: string;
  selectedProjectType: string;
  selectedPlatform: string;
  selectedDesign: string;
  preferredLanguage: string;
  selectedPages: string[];
  selectedModules: string[];
  selectedAddOns: string[];
  selectedTech: string[];
  selectedProgrammingLanguage: string;
  selectedFramework: string;
  selectedBackend: string;
  selectedHosting: string;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  inspirationSummary: string;
  domainIntentJson: string;
};

// ─── Default-value derivation ─────────────────────────────────────────────────

type EmptyDraftInput = {
  config: StudioRequestConfig;
  services: StudioService[];
  serviceKind?: StudioService["kind"] | null;
  preferredTeamId?: string | null;
};

/**
 * Produce a fully-populated draft with sensible defaults derived from the
 * current request config and service kind. Mirrors the `initialDraft`
 * useMemo logic that was previously inline in `request-builder.tsx`.
 *
 * All three on-ramps (manual builder, guided interview, chat) call this
 * as their base and may then overlay user-supplied values.
 */
export function emptyStudioBriefDraft({
  config,
  services,
  serviceKind,
  preferredTeamId,
}: EmptyDraftInput): StudioBriefDraft {
  const resolvedKind: StudioService["kind"] =
    serviceKind && services.some((s) => s.kind === serviceKind)
      ? serviceKind
      : (services[0]?.kind ?? "website");

  return {
    stepIndex: 0,
    serviceKind: resolvedKind,
    pathway: "custom",
    selectedPackageId: "",
    selectedTeamId: preferredTeamId ?? "",
    selectedProjectType:
      filterPricedOptions(config.projectTypes, resolvedKind)[0]?.label ??
      "Custom digital program",
    selectedPlatform:
      filterPricedOptions(config.platformOptions, resolvedKind)[0]?.label ??
      "Best-fit recommendation",
    selectedDesign: config.designOptions[0] ?? "Quiet luxury and high-trust",
    preferredLanguage: "English",
    selectedPages: [],
    selectedModules: [],
    selectedAddOns: [],
    selectedTech: [],
    selectedProgrammingLanguage:
      config.programmingLanguageOptions[0] ?? "Henry Onyx's recommendation",
    selectedFramework:
      filterPricedOptions(config.frameworkOptions, resolvedKind)[0]?.label ??
      "Henry Onyx's framework recommendation",
    selectedBackend:
      filterPricedOptions(config.backendOptions, resolvedKind)[0]?.label ??
      "Henry Onyx recommends the backend",
    selectedHosting: config.hostingOptions[0] ?? "Henry Onyx recommends the host",
    businessType: "",
    budgetBand: "",
    urgency:
      filterModifierOptions(config.urgencyOptions, resolvedKind)[0]?.label ?? "",
    timeline:
      filterModifierOptions(config.timelineOptions, resolvedKind)[0]?.label ?? "",
    goals: "",
    scopeNotes: "",
    inspirationSummary: "",
    domainIntentJson: "",
  };
}

// ─── Co-pilot seed → draft mapping ───────────────────────────────────────────

type StructuredToDraftInput = {
  config: StudioRequestConfig;
  services: StudioService[];
  serviceKind?: StudioService["kind"] | null;
  preferredTeamId?: string | null;
};

/**
 * Convert a `BriefCopilotStructured` result into a `StudioBriefDraft` by
 * starting from `emptyStudioBriefDraft` and overlaying any non-empty fields
 * from the structured co-pilot result.
 *
 * Anything the model omits falls back to the serviceKind default, so the
 * builder always restores a fully-valid form regardless of what the model
 * returned.
 */
export function structuredToDraft(
  structured: BriefCopilotStructured,
  input: StructuredToDraftInput,
): StudioBriefDraft {
  const base = emptyStudioBriefDraft(input);

  return {
    ...base,
    selectedProjectType: structured.projectType || base.selectedProjectType,
    selectedPlatform: structured.platformPreference || base.selectedPlatform,
    selectedDesign: structured.designDirection || base.selectedDesign,
    preferredLanguage: structured.preferredLanguage || base.preferredLanguage,
    selectedFramework: structured.frameworkPreference || base.selectedFramework,
    selectedBackend: structured.backendPreference || base.selectedBackend,
    selectedHosting: structured.hostingPreference || base.selectedHosting,
    selectedPages: structured.pageRequirements.length > 0
      ? structured.pageRequirements
      : base.selectedPages,
    selectedModules: structured.requiredFeatures.length > 0
      ? structured.requiredFeatures
      : base.selectedModules,
    selectedAddOns: structured.addonServices.length > 0
      ? structured.addonServices
      : base.selectedAddOns,
    selectedTech: structured.techPreferences.length > 0
      ? structured.techPreferences
      : base.selectedTech,
    businessType: structured.businessType || base.businessType,
    budgetBand: structured.budgetBand || base.budgetBand,
    urgency: structured.urgency || base.urgency,
    timeline: structured.timeline || base.timeline,
    goals: structured.goals || base.goals,
    scopeNotes: structured.scopeNotes || base.scopeNotes,
  };
}

// ─── Per-step validation ──────────────────────────────────────────────────────

/**
 * Validate a single builder step against the current draft state.
 *
 * Returns `{ ok: true, errors: {} }` when the step passes, or
 * `{ ok: false, errors: { fieldKey: message } }` listing every failing
 * field so the UI can show inline error copy.
 *
 * `activation` is intentionally NOT handled here — activation fields
 * (customerName, email, phone, companyName, depositNow) are entered as
 * builder-local useState and never persisted to the draft. Use `nameOk`
 * and `emailOk` for activation-step gating instead.
 */
export function validateStep(
  step: StudioStepKey,
  d: StudioBriefDraft,
): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (step === "path") {
    if (d.pathway === "package" && !d.selectedPackageId) {
      errors.selectedPackageId =
        "Choose a package to continue, or switch to a custom build.";
    }
  }

  if (step === "scope") {
    if (
      d.selectedPages.length + d.selectedModules.length + d.selectedAddOns.length ===
      0
    ) {
      errors.scope = "Pick at least one capability so we know what to build.";
    }
  }

  if (step === "commercial") {
    if (d.goals.trim().length < 12) {
      errors.goals =
        "Tell us the outcome you want — a sentence is plenty.";
    }
    if (d.scopeNotes.trim().length < 12) {
      errors.scopeNotes = "A line on scope keeps the estimate honest.";
    }
    if (!d.budgetBand.trim()) {
      errors.budgetBand = "A budget band sharpens the plan. A range is fine.";
    }
  }

  // `activation` — no draft-level validation. Use nameOk / emailOk below.

  return { ok: Object.keys(errors).length === 0, errors };
}

// ─── Activation-step field helpers ───────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true when `name` has at least 2 non-whitespace characters. */
export function nameOk(name: string): boolean {
  return name.trim().length >= 2;
}

/** Returns true when `email` matches a basic email pattern. */
export function emailOk(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
