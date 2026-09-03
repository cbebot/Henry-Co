"use client";

import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { requestSteps } from "@/components/studio/request-builder-data";
import { StudioRequestActivationStep } from "@/components/studio/request-activation-step";
import { StudioRequestCommercialStep } from "@/components/studio/request-commercial-step";
import { StudioRequestPathStep } from "@/components/studio/request-path-step";
import { StudioRequestScopeStep } from "@/components/studio/request-scope-step";
import { StudioRequestSidePanel } from "@/components/studio/request-side-panel";
import { submitStudioBriefAction } from "@/lib/studio/actions";
import { estimateStudioPricing } from "@/lib/studio/pricing";
import {
  filterModifierOptions,
  filterPricedOptions,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";
import {
  STEP_ORDER,
  STUDIO_BRIEF_DRAFT_KEY,
  STUDIO_BRIEF_DRAFT_VERSION,
  emptyStudioBriefDraft,
  structuredToDraft,
  validateStep,
  type StudioBriefDraft,
} from "@/lib/studio/request-fields";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-structured";
import type { StudioRequestPresetResult } from "@/lib/studio/request-presets";
import type { StudioPackage, StudioService, StudioTeamProfile } from "@/lib/studio/types";

type Props = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  preferredTeamId?: string | null;
  presetHint?: StudioRequestPresetResult | null;
  /** Structured brief output from the Brief Co-pilot. When provided,
   * seeds the form's initial state so the user lands on a brief that's
   * already drafted rather than an empty form. The parent (brief-request
   * entry) re-mounts this component with a new `key` whenever a fresh
   * seed arrives, so the seed is consumed exactly at mount. */
  copilotSeed?: BriefCopilotStructured | null;
  /** Step (0-based) the builder should mount on. Defaults to 0 (Path).
   * When the path was already chosen upstream — /pick → /request?path=custom,
   * or a template/preset hint — pass 1 to skip step 1 and land on Scope. */
  initialStepIndex?: number;
  /** Pathway preselect — when the path was chosen upstream we know the
   * lane and don't want a re-pick. Defaults to presetHint?.pathway or "custom". */
  initialPathway?: "package" | "custom";
};

export function StudioRequestBuilder({
  services,
  packages,
  teams,
  requestConfig,
  preferredTeamId,
  presetHint,
  copilotSeed,
  initialStepIndex = 0,
  initialPathway,
}: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  // Initial draft envelope — delegates default + co-pilot-seed derivation
  // to the shared `request-fields` contract so the manual builder, guided
  // interview, and chat on-ramps all start from one source of truth. The
  // hook restores any saved envelope on mount; when a fresh `copilotSeed`
  // is delivered (the parent re-mounts this component with a new `key`),
  // we skip restoration so the seed wins.
  const initialDraft = useMemo<StudioBriefDraft>(
    () => {
      const seedInput = {
        config: requestConfig,
        services,
        serviceKind: presetHint?.serviceKind,
        preferredTeamId,
      };
      const base = copilotSeed
        ? structuredToDraft(copilotSeed, seedInput)
        : emptyStudioBriefDraft(seedInput);
      return {
        ...base,
        // Step + pathway overrides — the path may have been chosen
        // upstream (/pick → /request?path=custom, or a preset hint), so
        // we honour the explicit initial values exactly as before.
        stepIndex: Math.min(Math.max(0, initialStepIndex), 3),
        pathway: initialPathway ?? presetHint?.pathway ?? "custom",
        // Preset project-type hint — only meaningful on the non-seeded
        // path. When a co-pilot seed is present its projectType already
        // won inside structuredToDraft, so we leave `base` untouched.
        selectedProjectType:
          !copilotSeed && presetHint?.projectTypeLabel
            ? presetHint.projectTypeLabel
            : base.selectedProjectType,
      };
    },
    // The initial value is captured once on mount. Parent re-mounts
    // with a new `key` when a fresh copilot seed arrives, so this
    // closure picks up the new seed each mount. Subsequent prop
    // changes mid-mount do not re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // When a fresh copilot seed is delivered, the parent re-mounts the
  // builder via a new `key`. In that case, the user explicitly asked
  // for a freshly drafted brief and any older saved draft should NOT
  // resurrect over the seed values. Skip restore on seeded mounts.
  const draft = useFormDraft<StudioBriefDraft>(STUDIO_BRIEF_DRAFT_KEY, initialDraft, {
    skipRestore: Boolean(copilotSeed),
    version: STUDIO_BRIEF_DRAFT_VERSION,
  });
  const {
    stepIndex,
    serviceKind,
    pathway,
    selectedPackageId,
    selectedTeamId,
    selectedProjectType,
    selectedPlatform,
    selectedDesign,
    preferredLanguage,
    selectedPages,
    selectedModules,
    selectedAddOns,
    selectedTech,
    selectedProgrammingLanguage,
    selectedFramework,
    selectedBackend,
    selectedHosting,
    businessType,
    budgetBand,
    urgency,
    timeline,
    goals,
    scopeNotes,
    inspirationSummary,
    domainIntentJson,
  } = draft.value;

  // Per-field setters update the single envelope. Each matches the
  // `(value: T) => void` signature the child step components already
  // expect via `RequestBuilderSelectionProps`, so no downstream
  // refactor is required.
  const setStepIndex = useCallback(
    (next: number) =>
      draft.setValue((prev) =>
        prev.stepIndex === next ? prev : { ...prev, stepIndex: next },
      ),
    [draft],
  );
  const setServiceKind = useCallback(
    (next: StudioService["kind"]) =>
      draft.setValue((prev) =>
        prev.serviceKind === next ? prev : { ...prev, serviceKind: next },
      ),
    [draft],
  );
  const setPathway = useCallback(
    (next: "package" | "custom") =>
      draft.setValue((prev) =>
        prev.pathway === next ? prev : { ...prev, pathway: next },
      ),
    [draft],
  );
  const setSelectedPackageId = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedPackageId === next ? prev : { ...prev, selectedPackageId: next },
      ),
    [draft],
  );
  const setSelectedTeamId = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedTeamId === next ? prev : { ...prev, selectedTeamId: next },
      ),
    [draft],
  );
  const setSelectedProjectType = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedProjectType === next
          ? prev
          : { ...prev, selectedProjectType: next },
      ),
    [draft],
  );
  const setSelectedPlatform = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedPlatform === next ? prev : { ...prev, selectedPlatform: next },
      ),
    [draft],
  );
  const setSelectedDesign = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedDesign === next ? prev : { ...prev, selectedDesign: next },
      ),
    [draft],
  );
  const setPreferredLanguage = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.preferredLanguage === next
          ? prev
          : { ...prev, preferredLanguage: next },
      ),
    [draft],
  );
  const setSelectedPages = useCallback(
    (next: string[]) => draft.setValue((prev) => ({ ...prev, selectedPages: next })),
    [draft],
  );
  const setSelectedModules = useCallback(
    (next: string[]) =>
      draft.setValue((prev) => ({ ...prev, selectedModules: next })),
    [draft],
  );
  const setSelectedAddOns = useCallback(
    (next: string[]) =>
      draft.setValue((prev) => ({ ...prev, selectedAddOns: next })),
    [draft],
  );
  const setSelectedTech = useCallback(
    (next: string[]) => draft.setValue((prev) => ({ ...prev, selectedTech: next })),
    [draft],
  );
  const setSelectedProgrammingLanguage = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedProgrammingLanguage === next
          ? prev
          : { ...prev, selectedProgrammingLanguage: next },
      ),
    [draft],
  );
  const setSelectedFramework = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedFramework === next
          ? prev
          : { ...prev, selectedFramework: next },
      ),
    [draft],
  );
  const setSelectedBackend = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedBackend === next ? prev : { ...prev, selectedBackend: next },
      ),
    [draft],
  );
  const setSelectedHosting = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.selectedHosting === next ? prev : { ...prev, selectedHosting: next },
      ),
    [draft],
  );
  const setBusinessType = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.businessType === next ? prev : { ...prev, businessType: next },
      ),
    [draft],
  );
  const setBudgetBand = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.budgetBand === next ? prev : { ...prev, budgetBand: next },
      ),
    [draft],
  );
  const setUrgency = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.urgency === next ? prev : { ...prev, urgency: next },
      ),
    [draft],
  );
  const setTimeline = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.timeline === next ? prev : { ...prev, timeline: next },
      ),
    [draft],
  );
  const setGoals = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.goals === next ? prev : { ...prev, goals: next },
      ),
    [draft],
  );
  const setScopeNotes = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.scopeNotes === next ? prev : { ...prev, scopeNotes: next },
      ),
    [draft],
  );
  const setInspirationSummary = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.inspirationSummary === next
          ? prev
          : { ...prev, inspirationSummary: next },
      ),
    [draft],
  );
  const setDomainIntentJson = useCallback(
    (next: string) =>
      draft.setValue((prev) =>
        prev.domainIntentJson === next ? prev : { ...prev, domainIntentJson: next },
      ),
    [draft],
  );

  // UI / animation state — not user input, not persisted.
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [progressHint, setProgressHint] = useState<string | null>(null);
  // Inline validation messages keyed by field anchor (`data-field`). Set
  // by a blocked Continue / Submit, cleared on any step navigation.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement | null>(null);

  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (pkg) => services.find((service) => service.id === pkg.serviceId)?.kind === serviceKind,
      ),
    [packages, serviceKind, services],
  );

  const selectedService = services.find((service) => service.kind === serviceKind) ?? services[0];
  const availableProjectTypes = useMemo(
    () => filterPricedOptions(requestConfig.projectTypes, serviceKind),
    [requestConfig.projectTypes, serviceKind],
  );
  const availablePlatforms = useMemo(
    () => filterPricedOptions(requestConfig.platformOptions, serviceKind),
    [requestConfig.platformOptions, serviceKind],
  );
  const availableUrgencyOptions = useMemo(
    () => filterModifierOptions(requestConfig.urgencyOptions, serviceKind),
    [requestConfig.urgencyOptions, serviceKind],
  );
  const availableTimelineOptions = useMemo(
    () => filterModifierOptions(requestConfig.timelineOptions, serviceKind),
    [requestConfig.timelineOptions, serviceKind],
  );
  const effectiveProjectType =
    availableProjectTypes.find((option) => option.label === selectedProjectType)?.label ||
    availableProjectTypes[0]?.label ||
    selectedProjectType;
  const effectivePlatform =
    availablePlatforms.find((option) => option.label === selectedPlatform)?.label ||
    availablePlatforms[0]?.label ||
    selectedPlatform;
  const effectiveUrgency =
    availableUrgencyOptions.find((option) => option.label === urgency)?.label ||
    availableUrgencyOptions[0]?.label ||
    urgency;
  const effectiveTimeline =
    availableTimelineOptions.find((option) => option.label === timeline)?.label ||
    availableTimelineOptions[0]?.label ||
    timeline;
  const effectivePackageId =
    filteredPackages.find((pkg) => pkg.id === selectedPackageId)?.id ||
    filteredPackages[0]?.id ||
    "";
  const selectedPackage =
    filteredPackages.find((item) => item.id === effectivePackageId) ?? filteredPackages[0] ?? null;
  const recommendedTeam =
    teams.find((team) => team.id === selectedTeamId) ??
    teams.find((team) => team.scoreBiases.some((bias) => serviceKind.includes(bias))) ??
    teams[0] ??
    null;

  /**
   * When the project's service kind changes (e.g. Website → Mobile app),
   * reset framework / backend selections that no longer apply. Avoids the
   * UX hazard of a stale "Next.js" choice after switching to mobile.
   */
  useEffect(() => {
    const validFrameworks = filterPricedOptions(requestConfig.frameworkOptions, serviceKind);
    if (
      selectedFramework &&
      !validFrameworks.find((option) => option.label === selectedFramework)
    ) {
      setSelectedFramework(validFrameworks[0]?.label ?? "Henry Onyx's framework recommendation");
    }
    const validBackends = filterPricedOptions(requestConfig.backendOptions, serviceKind);
    if (selectedBackend && !validBackends.find((option) => option.label === selectedBackend)) {
      setSelectedBackend(validBackends[0]?.label ?? "Henry Onyx recommends the backend");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceKind]);

  const pricingPreview = useMemo(
    () =>
      estimateStudioPricing(
        {
          service: selectedService,
          package: pathway === "package" ? selectedPackage : null,
          brief: {
            requiredFeatures: selectedModules,
            urgency: effectiveUrgency,
            timeline: effectiveTimeline,
          },
          customRequest:
            pathway === "custom" || selectedAddOns.length > 0
              ? {
                  projectType: effectiveProjectType,
                  platformPreference: effectivePlatform,
                  pageRequirements: selectedPages,
                  addonServices: selectedAddOns,
                }
              : null,
          techStack: {
            framework: selectedFramework,
            backend: selectedBackend,
          },
        },
        requestConfig,
      ),
    [
      pathway,
      requestConfig,
      selectedAddOns,
      selectedModules,
      selectedPackage,
      selectedPages,
      effectivePlatform,
      effectiveProjectType,
      selectedService,
      effectiveTimeline,
      effectiveUrgency,
      selectedFramework,
      selectedBackend,
    ],
  );

  const readinessScore = useMemo(() => {
    let score = pathway === "custom" ? 56 : 58;
    if (pathway === "package" && selectedPackage) score += 10;
    if (effectiveProjectType) score += 4;
    if (effectivePlatform) score += 4;
    if (selectedDesign) score += 4;
    if (selectedPages.length >= 2) score += 8;
    if (selectedModules.length >= 3) score += 10;
    if (selectedAddOns.length >= 2) score += 6;
    if (selectedTech.length >= 1) score += 4;
    // Tech-stack picks signal a serious operator; the score reflects that.
    if (selectedProgrammingLanguage && selectedProgrammingLanguage !== "Henry Onyx's recommendation")
      score += 3;
    if (selectedFramework && selectedFramework !== "Henry Onyx's framework recommendation")
      score += 3;
    if (selectedBackend && selectedBackend !== "Henry Onyx recommends the backend") score += 3;
    if (selectedHosting && selectedHosting !== "Henry Onyx recommends the host") score += 2;
    if (businessType) score += 4;
    if (budgetBand) score += 4;
    if (effectiveUrgency) score += 4;
    if (effectiveTimeline) score += 4;
    if (goals.trim().length > 80) score += 8;
    if (scopeNotes.trim().length > 60) score += 8;
    if (inspirationSummary.trim().length > 30) score += 4;
    if (recommendedTeam) score += 4;
    return Math.min(score, 100);
  }, [
    budgetBand,
    businessType,
    goals,
    inspirationSummary,
    pathway,
    recommendedTeam,
    selectedAddOns.length,
    selectedDesign,
    selectedModules.length,
    selectedPackage,
    selectedPages.length,
    effectivePlatform,
    effectiveProjectType,
    selectedTech.length,
    selectedProgrammingLanguage,
    selectedFramework,
    selectedBackend,
    selectedHosting,
    scopeNotes,
    effectiveTimeline,
    effectiveUrgency,
  ]);

  function goToStep(nextIndex: number) {
    if (nextIndex === stepIndex) return;
    // Errors belong to the step that raised them; drop them the moment we
    // move so a commercial error never lingers over the path step.
    setErrors({});
    setIsStepTransitioning(true);
    setStepIndex(nextIndex);
    setProgressHint(t("Progress saved — you can leave and return any time while signed in."));
    if (typeof window !== "undefined") {
      window.setTimeout(() => setProgressHint(null), 6000);
      window.requestAnimationFrame(() => {
        if (topRef.current) {
          const targetTop = topRef.current.getBoundingClientRect().top + window.scrollY - 104;
          window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
        }
      });
      window.setTimeout(() => setIsStepTransitioning(false), 260);
    }
  }

  /**
   * Scroll the first errored field into view. The FieldError components
   * expose a `[data-field="…"]` anchor that only mounts once its message is
   * present, so we defer the lookup to the next frame (after React flushes
   * the error state) and pick the topmost anchor in document order.
   */
  const scrollToFirstError = useCallback((errs: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const keys = Object.keys(errs);
    if (keys.length === 0) return;
    window.requestAnimationFrame(() => {
      const node = keys
        .map((key) => document.querySelector<HTMLElement>(`[data-field="${key}"]`))
        .filter((el): el is HTMLElement => el !== null)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      if (!node) return;
      const targetTop = node.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    });
  }, []);

  /**
   * Per-step gate for Continue. Validates only the current draft-backed
   * step (path / scope / commercial); on failure it surfaces the inline
   * errors and scrolls to the first one instead of advancing.
   */
  function handleContinue() {
    const v = validateStep(STEP_ORDER[stepIndex], draft.value);
    if (!v.ok) {
      setErrors(v.errors);
      scrollToFirstError(v.errors);
      return;
    }
    setErrors({});
    goToStep(Math.min(stepIndex + 1, requestSteps.length - 1));
  }

  /**
   * Full-draft gate for Submit. The activation step owns the submit button
   * but every prior step is unmounted, so a user who jumped to Review via
   * the step rail could otherwise post an incomplete brief through the
   * hidden-input mirror — re-pricing the deposit from defaults. We re-run
   * every draft-backed step here; the first failure cancels the server
   * action (`preventDefault`), jumps back to that step, and surfaces the
   * errors. Activation's name / email / phone are natively gated by their
   * HTML5 `required` + `type="email"` inputs, which fire before this.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // The brief may only be posted from the final (activation) step, which
    // owns the real submit button and the required name / email / phone
    // inputs. A stray Enter in the budget text field on an earlier step
    // would otherwise implicitly submit a contact-less brief — swallow it.
    if (stepIndex !== STEP_ORDER.length - 1) {
      event.preventDefault();
      return;
    }
    for (let i = 0; i < STEP_ORDER.length - 1; i++) {
      const v = validateStep(STEP_ORDER[i], draft.value);
      if (!v.ok) {
        event.preventDefault();
        // goToStep clears errors on navigation, so set them AFTER it —
        // both batch into one render and the later write must win.
        goToStep(i);
        setErrors(v.errors);
        scrollToFirstError(v.errors);
        return;
      }
    }
    // V3-01: the server action redirects to /pay, /project, or /proposals
    // on success; there is no JS success callback, so we clear the draft
    // synchronously now. The localStorage write completes before the
    // request begins. If the action throws server-side validation the user
    // returns without the draft, but the gating above catches every
    // client-side failure case before the submit fires.
    draft.clear();
  }

  /**
   * On the custom lane, the first package that fits the current service
   * kind is offered in the side panel as a calm "lock this in instead"
   * shortcut. Null on the package lane (the lane toggle is canonical there)
   * or when no package matches the current service kind.
   */
  const recommendedPackage =
    pathway === "custom" && filteredPackages[0]
      ? { name: filteredPackages[0].name, price: filteredPackages[0].price }
      : null;
  const lockInRecommendedPackage = useCallback(() => {
    const pkg = filteredPackages[0];
    if (!pkg) return;
    setPathway("package");
    setSelectedPackageId(pkg.id);
  }, [filteredPackages, setPathway, setSelectedPackageId]);

  const totalSteps = requestSteps.length;
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const currentStep = requestSteps[stepIndex];
  // Drives Continue's muted look + aria-disabled. The button stays
  // clickable so a blocked click still teaches *why* via inline errors.
  const currentStepValid = validateStep(STEP_ORDER[stepIndex], draft.value).ok;

  return (
    <form
      action={submitStudioBriefAction}
      className="space-y-10"
      onSubmit={handleSubmit}
    >
      <div ref={topRef} />
      <input type="hidden" name="preferredTeamId" value={selectedTeamId} />
      <input type="hidden" name="serviceKind" value={serviceKind} />
      <input type="hidden" name="packageIntent" value={pathway} />
      <input
        type="hidden"
        name="packageId"
        value={pathway === "package" ? effectivePackageId : ""}
      />
      <input type="hidden" name="designDirection" value={selectedDesign} />
      <input type="hidden" name="preferredLanguage" value={preferredLanguage} />
      <input type="hidden" name="programmingLanguage" value={selectedProgrammingLanguage} />
      <input type="hidden" name="frameworkPreference" value={selectedFramework} />
      <input type="hidden" name="backendPreference" value={selectedBackend} />
      <input type="hidden" name="hostingPreference" value={selectedHosting} />
      {/* The step panels below are conditionally mounted — only the active
        step is in the DOM. At submit time that step is Activation (it owns
        the submit button), so every other step's named inputs are absent
        from the posted FormData. The shell therefore mirrors every contract
        field as an always-mounted hidden input; without this the user's
        project type, scope, budget, timeline, and feature choices are
        silently dropped, and the server re-prices the deposit from an
        incomplete brief. Multi-value fields emit one hidden input per
        selection so the action's getAll(...) reads the full list. */}
      <input type="hidden" name="projectType" value={effectiveProjectType} />
      <input type="hidden" name="platformPreference" value={effectivePlatform} />
      <input type="hidden" name="businessType" value={businessType} />
      <input type="hidden" name="budgetBand" value={budgetBand} />
      <input type="hidden" name="urgency" value={effectiveUrgency} />
      <input type="hidden" name="timeline" value={effectiveTimeline} />
      <input type="hidden" name="goals" value={goals} />
      <input type="hidden" name="scopeNotes" value={scopeNotes} />
      <input type="hidden" name="inspirationSummary" value={inspirationSummary} />
      {/* Domain intent is built inside the (unmounted-at-submit) domain
        section; the section lifts its serialized intent up via
        onIntentChange so this always-mounted mirror carries it. */}
      <input type="hidden" name="domainIntentJson" value={domainIntentJson} />
      {selectedPages.map((value) => (
        <input key={`page-${value}`} type="hidden" name="pageRequirements" value={value} />
      ))}
      {selectedModules.map((value) => (
        <input key={`feature-${value}`} type="hidden" name="requiredFeatures" value={value} />
      ))}
      {selectedAddOns.map((value) => (
        <input key={`addon-${value}`} type="hidden" name="addonServices" value={value} />
      ))}
      {selectedTech.map((value) => (
        <input key={`tech-${value}`} type="hidden" name="techPreferences" value={value} />
      ))}

      {/* Editorial brief header — no panel chrome, magazine progress strip */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
              {t("Project brief")}
              <span className="mx-2 opacity-40">·</span>
              <span className="text-[var(--studio-ink-soft)]">
                {t("Step")} {String(stepIndex + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
              </span>
            </p>
            <h2 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[2.1rem] md:text-[2.4rem]">
              {t(currentStep.title)}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-[var(--studio-ink-soft)] sm:text-base">
              {t(currentStep.body)}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
            {isStepTransitioning ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--studio-signal)]">
                <LoaderCircle className="h-3 w-3 animate-spin" />
                {t("Loading")}
              </span>
            ) : (
              <span className="text-[var(--studio-ink-soft)]">{progressPct}% {t("complete")}</span>
            )}
          </div>
        </div>

        {/* Compact step navigator — number disc + label only. The
         * step body already lives in the H2 paragraph above so we don't
         * repeat it inside each card (the prior "long cards" issue:
         * the same paragraph rendered four times stacked on mobile,
         * pushing the actual brief fields below the fold). */}
        <nav aria-label={t("Brief steps")} className="mt-7">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[18px] h-px bg-[var(--studio-line)]" />
            <div
              className="absolute left-0 top-[18px] h-px bg-[var(--studio-signal)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
            <ol className="relative grid grid-cols-4 gap-x-2 gap-y-2 sm:gap-x-3">
              {requestSteps.map((step, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;
                return (
                  <li key={step.key} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => goToStep(index)}
                      aria-current={isActive ? "step" : undefined}
                      className="group block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 rounded-lg"
                    >
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-mono font-semibold tracking-tight transition ${
                          isActive
                            ? "border-[var(--studio-signal)] bg-[var(--studio-signal)] text-[color:var(--home-accent-ink)]"
                            : isComplete
                              ? "border-[var(--studio-signal)]/55 bg-transparent text-[var(--studio-signal)]"
                              : "border-[var(--studio-line)] bg-[color:var(--home-surface-04)] text-[var(--studio-ink-soft)] group-hover:border-[var(--studio-signal)]/40 group-hover:text-[var(--studio-ink)]"
                        }`}
                      >
                        {isComplete ? <Check className="h-4 w-4" /> : `0${index + 1}`}
                      </span>
                      <p
                        className={`mt-2.5 truncate text-[10.5px] font-semibold uppercase tracking-[0.18em] transition sm:tracking-[0.22em] ${
                          isActive
                            ? "text-[var(--studio-signal)]"
                            : "text-[var(--studio-ink-soft)] group-hover:text-[var(--studio-ink)]"
                        }`}
                      >
                        {t(step.label)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        {progressHint ? (
          <p
            role="status"
            className="mt-6 flex items-start gap-2 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
          >
            <Check
              className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]"
              aria-hidden
            />
            <span>{progressHint}</span>
          </p>
        ) : null}
      </section>

      {/* Step body + side panel */}
      <div className="grid gap-10 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-8">
          {stepIndex === 0 ? (
            <StudioRequestPathStep
              services={services}
              packages={packages}
              requestConfig={requestConfig}
              serviceKind={serviceKind}
              setServiceKind={setServiceKind}
              pathway={pathway}
              setPathway={setPathway}
              filteredPackages={filteredPackages}
              selectedPackage={selectedPackage}
              setSelectedPackageId={setSelectedPackageId}
              selectedProjectType={effectiveProjectType}
              setSelectedProjectType={setSelectedProjectType}
              selectedPlatform={effectivePlatform}
              setSelectedPlatform={setSelectedPlatform}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
              preferredLanguage={preferredLanguage}
              setPreferredLanguage={setPreferredLanguage}
              errors={errors}
            />
          ) : null}
          {stepIndex === 1 ? (
            <StudioRequestScopeStep
              requestConfig={requestConfig}
              pathway={pathway}
              serviceKind={serviceKind}
              selectedPackage={selectedPackage}
              selectedPages={selectedPages}
              setSelectedPages={setSelectedPages}
              selectedModules={selectedModules}
              setSelectedModules={setSelectedModules}
              selectedAddOns={selectedAddOns}
              setSelectedAddOns={setSelectedAddOns}
              selectedTech={selectedTech}
              setSelectedTech={setSelectedTech}
              selectedProgrammingLanguage={selectedProgrammingLanguage}
              setSelectedProgrammingLanguage={setSelectedProgrammingLanguage}
              selectedFramework={selectedFramework}
              setSelectedFramework={setSelectedFramework}
              selectedBackend={selectedBackend}
              setSelectedBackend={setSelectedBackend}
              selectedHosting={selectedHosting}
              setSelectedHosting={setSelectedHosting}
              errors={errors}
            />
          ) : null}
          {stepIndex === 2 ? (
            <StudioRequestCommercialStep
              requestConfig={requestConfig}
              businessType={businessType}
              setBusinessType={setBusinessType}
              budgetBand={budgetBand}
              setBudgetBand={setBudgetBand}
              urgency={effectiveUrgency}
              setUrgency={setUrgency}
              timeline={effectiveTimeline}
              setTimeline={setTimeline}
              goals={goals}
              setGoals={setGoals}
              scopeNotes={scopeNotes}
              setScopeNotes={setScopeNotes}
              inspirationSummary={inspirationSummary}
              setInspirationSummary={setInspirationSummary}
              setDomainIntentJson={setDomainIntentJson}
              errors={errors}
            />
          ) : null}
          {stepIndex === 3 ? (
            <StudioRequestActivationStep
              teams={teams}
              selectedTeamId={selectedTeamId}
              setSelectedTeamId={setSelectedTeamId}
              review={{
                pathway,
                packageName: selectedPackage?.name ?? null,
                projectType: effectiveProjectType,
                platform: effectivePlatform,
                design: selectedDesign,
                preferredLanguage,
                pages: selectedPages,
                modules: selectedModules,
                addOns: selectedAddOns,
                tech: selectedTech,
                programmingLanguage: selectedProgrammingLanguage,
                framework: selectedFramework,
                backend: selectedBackend,
                hosting: selectedHosting,
                businessType,
                budgetBand,
                urgency: effectiveUrgency,
                timeline: effectiveTimeline,
                goals,
                scopeNotes,
                inspirationSummary,
                domainIntentJson,
                readinessScore,
                pricing: pricingPreview,
              }}
            />
          ) : null}

          {/* Footer step controls — editorial */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--studio-line)] pt-6">
            <button
              type="button"
              onClick={() => goToStep(Math.max(stepIndex - 1, 0))}
              disabled={stepIndex === 0}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                stepIndex === 0
                  ? "cursor-not-allowed border-[var(--studio-line)] text-[var(--studio-ink-soft)] opacity-40"
                  : "border-[var(--studio-line)] text-[var(--studio-ink)] hover:border-[var(--studio-signal)]/40 hover:bg-[color:var(--home-surface-04)]"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("Back")}
            </button>
            {stepIndex < requestSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleContinue}
                aria-disabled={!currentStepValid}
                className={`bg-[color:var(--home-accent)] text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)] transition-colors inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                  currentStepValid ? "" : "opacity-60"
                }`}
              >
                {isStepTransitioning ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {isStepTransitioning ? t("Loading next step") : t("Continue")}
                {!isStepTransitioning ? <ArrowRight className="h-3.5 w-3.5" /> : null}
              </button>
            ) : null}
          </div>
        </div>

        <StudioRequestSidePanel
          pathway={pathway}
          readinessScore={readinessScore}
          pricingPreview={pricingPreview}
          recommendedTeamName={recommendedTeam?.name || t("Henry Onyx team recommendation")}
          recommendedPackage={recommendedPackage}
          onLockPackage={lockInRecommendedPackage}
        />
      </div>
    </form>
  );
}
