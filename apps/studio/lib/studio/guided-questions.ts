/**
 * Guided interview question graph — the adaptive "answer a few questions"
 * on-ramp at /request/guided.
 *
 * This is a PURE data + helper module (no React, no side-effects) so it can
 * be imported from the guided UI, a server action, or the chat on-ramp
 * (Stage 4) without pulling in the React runtime. Canonical English prompts
 * and option values live here; the UI localizes labels/details at render via
 * `translateSurfaceLabel`. The option `value` stays the canonical English
 * label because that string is the storage key pricing lookups depend on
 * (`findPricedOptionByLabel`, `sumOptionCosts`) — only the displayed text is
 * translated.
 *
 * Every guided path converges on the same `BriefCopilotStructured` shape the
 * co-pilot produces, so the handoff into the builder reuses `structuredToDraft`
 * exactly like the chat lane does.
 */

import {
  filterPricedOptions,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-action";
import type { StudioService, StudioServiceKind } from "@/lib/studio/types";

// ─── Answer + option + question shapes ────────────────────────────────────────

/** Accumulated answers, keyed by question id. Single/text → string, multi → string[]. */
export type GuidedAnswers = Record<string, string | string[]>;

export type GuidedOption = {
  /** Canonical English value persisted into the brief draft. Localize
   * `label`/`detail` for display only — never the value. */
  value: string;
  label: string;
  detail?: string;
};

export type GuidedQuestionKind = "single" | "multi" | "text";

export type GuidedQuestion = {
  id: string;
  prompt: string;
  help?: string;
  kind: GuidedQuestionKind;
  /** Placeholder for `text` questions; ignored otherwise. */
  placeholder?: string;
  /** Option resolver for `single`/`multi`. Undefined for `text`. */
  options?: (
    config: StudioRequestConfig,
    serviceKind: StudioServiceKind,
    services: StudioService[],
  ) => GuidedOption[];
  /** When set, the question only applies to these service kinds. */
  appliesTo?: StudioServiceKind[];
};

// ─── Service-kind labels (the first question) ─────────────────────────────────

/**
 * Buyer-facing labels for each service kind, voiced to match the studio
 * service catalogue (Executive Websites, Commerce Systems, Brand Systems…)
 * but phrased as a "what are we building?" choice.
 */
export const SERVICE_KIND_LABELS: Record<
  StudioServiceKind,
  { label: string; detail: string }
> = {
  website: {
    label: "A website",
    detail: "Executive site, services, and lead capture built for credibility.",
  },
  ecommerce: {
    label: "An online store",
    detail: "Sell products with catalogue, checkout, and order operations.",
  },
  mobile_app: {
    label: "A mobile app",
    detail: "iOS and Android product, or a companion to your platform.",
  },
  custom_software: {
    label: "Custom software",
    detail: "A bespoke platform built around how you actually operate.",
  },
  internal_system: {
    label: "An internal system",
    detail: "A dashboard or tool that replaces spreadsheet chaos.",
  },
  ui_ux: {
    label: "Product UX and UI",
    detail: "Flow architecture, interface systems, and design direction.",
  },
  branding: {
    label: "A brand identity",
    detail: "Naming, visual language, and premium launch assets.",
  },
};

/** Display order for the service-kind chips — most common first. */
const SERVICE_KIND_ORDER: StudioServiceKind[] = [
  "website",
  "ecommerce",
  "mobile_app",
  "custom_software",
  "internal_system",
  "ui_ux",
  "branding",
];

function presentServiceKinds(services: StudioService[]): StudioServiceKind[] {
  const present = new Set(services.map((service) => service.kind));
  const ordered = SERVICE_KIND_ORDER.filter((kind) => present.has(kind));
  return ordered.length > 0 ? ordered : [...SERVICE_KIND_ORDER];
}

// ─── The question graph ───────────────────────────────────────────────────────

export const GUIDED_QUESTIONS: GuidedQuestion[] = [
  {
    id: "serviceKind",
    prompt: "What are we building?",
    help: "Pick the closest fit. You can refine every detail in the builder.",
    kind: "single",
    options: (_config, _serviceKind, services) =>
      presentServiceKinds(services).map((kind) => ({
        value: kind,
        label: SERVICE_KIND_LABELS[kind].label,
        detail: SERVICE_KIND_LABELS[kind].detail,
      })),
  },
  {
    id: "projectType",
    prompt: "Which best describes it?",
    help: "This sets the starting scope and the honest price.",
    kind: "single",
    options: (config, serviceKind) =>
      filterPricedOptions(config.projectTypes, serviceKind).map((option) => ({
        value: option.label,
        label: option.label,
        detail: option.description,
      })),
  },
  {
    id: "pages",
    prompt: "Which pages do you need?",
    help: "Choose the surfaces that matter — add or trim later.",
    kind: "multi",
    appliesTo: ["website", "ecommerce"],
    options: (config, serviceKind) =>
      filterPricedOptions(config.pageOptions, serviceKind).map((option) => ({
        value: option.label,
        label: option.label,
        detail: option.description,
      })),
  },
  {
    id: "features",
    prompt: "Which capabilities matter most?",
    help: "The working parts behind the screens.",
    kind: "multi",
    options: (config, serviceKind) =>
      filterPricedOptions(config.moduleOptions, serviceKind).map((option) => ({
        value: option.label,
        label: option.label,
        detail: option.description,
      })),
  },
  {
    id: "addons",
    prompt: "What should we include?",
    help: "Supporting work that rounds out the deliverable.",
    kind: "multi",
    appliesTo: ["branding", "ui_ux"],
    options: (config, serviceKind) =>
      filterPricedOptions(config.addOnOptions, serviceKind).map((option) => ({
        value: option.label,
        label: option.label,
        detail: option.description,
      })),
  },
  {
    id: "budget",
    prompt: "What budget band fits this?",
    help: "A range is fine — it keeps the plan honest.",
    kind: "single",
    options: (config) =>
      config.budgetOptions.map((band) => ({ value: band, label: band })),
  },
  {
    id: "timeline",
    prompt: "When do you need it live?",
    help: "Tighter timelines may carry a delivery adjustment.",
    kind: "single",
    options: (config) =>
      config.timelineOptions.map((option) => ({
        value: option.label,
        label: option.label,
        detail: option.description,
      })),
  },
  {
    id: "goals",
    prompt: "What outcome are you hoping for?",
    help: "One or two sentences on the result you want.",
    kind: "text",
    placeholder:
      "e.g. A site that makes us look more credible and turns visits into qualified inquiries.",
  },
];

/** Minimum characters the free-text goal answer must reach to advance. */
export const GUIDED_GOAL_MIN_LENGTH = 12;

// ─── Resolution + applicability ───────────────────────────────────────────────

function asString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function asList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return [];
}

/** The service kind chosen in answer 1, or the first kind the catalog offers. */
export function resolveGuidedServiceKind(
  answers: GuidedAnswers,
  services: StudioService[],
): StudioServiceKind {
  const raw = asString(answers.serviceKind) as StudioServiceKind;
  const present = presentServiceKinds(services);
  if (present.includes(raw)) return raw;
  return present[0] ?? "website";
}

function questionOptions(
  question: GuidedQuestion,
  config: StudioRequestConfig,
  serviceKind: StudioServiceKind,
  services: StudioService[],
): GuidedOption[] {
  return question.options ? question.options(config, serviceKind, services) : [];
}

/**
 * A question applies when (a) it isn't restricted to other service kinds, and
 * (b) — for option-backed questions — there is at least one option to show.
 * The empty-options rule is what auto-skips the features step for branding /
 * ui_ux (which have no module options) without any special-casing.
 */
export function isGuidedQuestionApplicable(
  question: GuidedQuestion,
  serviceKind: StudioServiceKind,
  config: StudioRequestConfig,
  services: StudioService[],
): boolean {
  if (question.appliesTo && !question.appliesTo.includes(serviceKind)) return false;
  if (question.kind === "text") return true;
  return questionOptions(question, config, serviceKind, services).length > 0;
}

/** The ordered list of questions that apply given the answers so far. */
export function applicableGuidedQuestions(
  answers: GuidedAnswers,
  config: StudioRequestConfig,
  services: StudioService[],
): GuidedQuestion[] {
  const serviceKind = resolveGuidedServiceKind(answers, services);
  return GUIDED_QUESTIONS.filter((question) =>
    isGuidedQuestionApplicable(question, serviceKind, config, services),
  );
}

function hasAnswer(answers: GuidedAnswers, question: GuidedQuestion): boolean {
  if (question.kind === "multi") return asList(answers[question.id]).length > 0;
  return asString(answers[question.id]).length > 0;
}

/**
 * The first applicable question still missing an answer, or null when the
 * interview is complete. The UI uses this to resume a restored draft at the
 * right spot; it also satisfies the graph-walk contract the chat lane reuses.
 */
export function resolveNextQuestion(
  answers: GuidedAnswers,
  config: StudioRequestConfig,
  services: StudioService[],
): GuidedQuestion | null {
  for (const question of applicableGuidedQuestions(answers, config, services)) {
    if (!hasAnswer(answers, question)) return question;
  }
  return null;
}

// ─── Synthesis → structured brief ─────────────────────────────────────────────

/**
 * Build a free-text paragraph from the answers — the input the brief co-pilot
 * action enriches. Always clears the action's MIN_INPUT_LENGTH (30 chars) and
 * MIN_WORD_COUNT (8 words) guards because project type, budget, timeline, and
 * the typed goal are concatenated.
 */
export function buildGuidedDescription(
  answers: GuidedAnswers,
  config: StudioRequestConfig,
  services: StudioService[],
): string {
  const serviceKind = resolveGuidedServiceKind(answers, services);
  const kindLabel = SERVICE_KIND_LABELS[serviceKind].label
    .replace(/^an? /i, "")
    .toLowerCase();
  const projectType = asString(answers.projectType);
  const pages = asList(answers.pages);
  const features = asList(answers.features);
  const addons = asList(answers.addons);
  const budget = asString(answers.budget);
  const timeline = asString(answers.timeline);
  const goals = asString(answers.goals);

  const parts: string[] = [
    `We need ${projectType ? projectType.toLowerCase() : kindLabel} — a ${kindLabel} project.`,
  ];
  if (pages.length) parts.push(`Pages: ${pages.join(", ")}.`);
  if (features.length) parts.push(`Key capabilities: ${features.join(", ")}.`);
  if (addons.length) parts.push(`Include: ${addons.join(", ")}.`);
  if (budget) parts.push(`Budget band: ${budget}.`);
  if (timeline) parts.push(`Timeline: ${timeline}.`);
  if (goals) parts.push(`Goal: ${goals}`);
  return parts.join(" ").trim();
}

/**
 * Convert guided answers directly into a `BriefCopilotStructured`. This is the
 * faithful, model-free source of truth for the user's explicit choices — used
 * both as the deterministic fallback when the co-pilot action declines
 * (rate-limited / too-short) and as the overlay whose values always win over
 * model inference (`mergeGuidedStructured`).
 *
 * Guarantees the handed-off draft passes `validateStep`: `scopeNotes` and
 * `goals` always reach the 12-char minimum, and at least one of pages /
 * features / add-ons carries a selection for every service kind.
 */
export function guidedAnswersToStructured(
  answers: GuidedAnswers,
  config: StudioRequestConfig,
  services: StudioService[],
): BriefCopilotStructured {
  const serviceKind = resolveGuidedServiceKind(answers, services);
  const kindLabel = SERVICE_KIND_LABELS[serviceKind].label.toLowerCase();

  const projectType =
    asString(answers.projectType) ||
    filterPricedOptions(config.projectTypes, serviceKind)[0]?.label ||
    "Custom digital program";
  const pageRequirements = asList(answers.pages);
  const requiredFeatures = asList(answers.features);
  const addonServices = asList(answers.addons);
  const budgetBand = asString(answers.budget);
  const timeline = asString(answers.timeline);

  const goalsRaw = asString(answers.goals);
  const goals =
    goalsRaw.length >= GUIDED_GOAL_MIN_LENGTH
      ? goalsRaw
      : `Deliver ${kindLabel} that moves the business forward.`;

  const platformPreference =
    filterPricedOptions(config.platformOptions, serviceKind)[0]?.label ||
    "Best-fit recommendation";
  const frameworkPreference =
    filterPricedOptions(config.frameworkOptions, serviceKind)[0]?.label ||
    "Henry & Co.'s framework recommendation";
  const backendPreference =
    filterPricedOptions(config.backendOptions, serviceKind)[0]?.label ||
    "Henry & Co. recommends the backend";

  const scopeBits = [
    projectType,
    pageRequirements.length ? `${pageRequirements.length} pages` : "",
    requiredFeatures.length ? `${requiredFeatures.length} capabilities` : "",
    addonServices.length ? `${addonServices.length} add-ons` : "",
  ].filter(Boolean);
  const scopeNotes = `Guided brief — ${scopeBits.join(", ")}. Confirm integrations, content ownership, and launch constraints before submitting.`;

  return {
    projectType,
    platformPreference,
    designDirection: config.designOptions[0] || "Quiet luxury and high-trust",
    preferredLanguage: "English",
    frameworkPreference,
    backendPreference,
    hostingPreference: config.hostingOptions[0] || "Henry & Co. recommends the host",
    pageRequirements,
    requiredFeatures,
    addonServices,
    techPreferences: [],
    businessType: "",
    budgetBand,
    urgency: "",
    timeline,
    goals,
    scopeNotes,
    summary: `${projectType} — guided brief.`,
    confidence: 0.62,
    uncertainties: [],
  };
}

/**
 * Overlay the user's explicit guided answers (`local`) on top of the model's
 * enriched result (`enriched`). The user's concrete choices — project type,
 * pages, features, add-ons, budget, timeline, goal — always win; the model's
 * richer scope prose is kept only when it's substantive.
 */
export function mergeGuidedStructured(
  local: BriefCopilotStructured,
  enriched: BriefCopilotStructured,
): BriefCopilotStructured {
  return {
    ...enriched,
    projectType: local.projectType || enriched.projectType,
    pageRequirements: local.pageRequirements.length
      ? local.pageRequirements
      : enriched.pageRequirements,
    requiredFeatures: local.requiredFeatures.length
      ? local.requiredFeatures
      : enriched.requiredFeatures,
    addonServices: local.addonServices.length
      ? local.addonServices
      : enriched.addonServices,
    budgetBand: local.budgetBand || enriched.budgetBand,
    timeline: local.timeline || enriched.timeline,
    goals: local.goals || enriched.goals,
    scopeNotes:
      enriched.scopeNotes && enriched.scopeNotes.trim().length >= GUIDED_GOAL_MIN_LENGTH
        ? enriched.scopeNotes
        : local.scopeNotes,
  };
}
