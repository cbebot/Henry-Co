"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { useFormDraft } from "@henryco/lifecycle/drafts";
import { formatNaira } from "@/components/studio/request-builder-data";
import { StudioDomainLaunchSection } from "@/components/studio/studio-domain-launch";
import { StudioRequestPathStep } from "@/components/studio/request-path-step";
import { submitStudioBriefAction } from "@/lib/studio/actions";
import { sectionsNeedingAttention } from "@/lib/studio/brief-attention";
import { saveStudioBriefFlowDraftAction } from "@/lib/studio/brief-draft-actions";
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
import { DescribeChange } from "./describe-change";
import { SectionCard } from "./section-card";
import {
  BusinessSectionEditor,
  GoalsSectionEditor,
  ScopeSectionEditor,
  StackSectionEditor,
} from "./section-editors";
import { MobilePricingBar, PricingRailPanel } from "./pricing-rail";
import {
  COMPOSER_SECTIONS,
  sectionForErrorKey,
  sectionIsComplete,
  sectionSummary,
  type ComposerSectionKey,
} from "./sections";
import { SubmitBlock } from "./submit-block";

const SUBMIT_BLOCK_ID = "studio-brief-submit";

type Props = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  preferredTeamId?: string | null;
  presetHint?: StudioRequestPresetResult | null;
  /** Structured brief output from the Brief Co-pilot. Seeds the initial
   * draft exactly like the wizard did — the parent re-mounts with a new
   * `key` when a fresh seed arrives, so the seed is consumed at mount. */
  copilotSeed?: BriefCopilotStructured | null;
  /** Kept for envelope parity with the wizard's on-ramps. The composer has
   * no steps — the value is clamped into the draft (v1 shape carries it)
   * and never used for navigation. */
  initialStepIndex?: number;
  /** Pathway preselect — when the path was chosen upstream we know the
   * lane and don't want a re-pick. Defaults to presetHint?.pathway or "custom". */
  initialPathway?: "package" | "custom";
  /** The signed-in person's own name + email (server-resolved). When present, the
   * submit block greets them instead of re-asking — a known client never re-enters
   * details we already hold. Null for anonymous prospects (the full form shows). */
  viewerIdentity?: { name: string; email: string } | null;
  /** SA-1 — server-resolved live-lookup flag. Defaults to false so any
   * unplumbed mount fails HIDDEN, never as a dead button. */
  domainLookupEnabled?: boolean;
  /** SA-1 — abandoned-brief recovery: the newest server-persisted draft for
   * this session/user, loaded by the page. A local same-device draft still
   * wins (useFormDraft restores over the initial value); this fills in
   * after a device change or cleared storage. */
  serverDraft?: StudioBriefDraft | null;
};

function computeInitialOpen(
  draft: StudioBriefDraft,
  attention: Partial<Record<ComposerSectionKey, string>> = {},
): Record<ComposerSectionKey, boolean> {
  const open = {} as Record<ComposerSectionKey, boolean>;
  for (const section of COMPOSER_SECTIONS) {
    // A card with data starts collapsed (summary + Adjust); an empty card
    // sits open, inviting the missing detail. SA-1: a card the copilot
    // flagged as uncertain ALSO opens — those are the follow-ups that
    // materially change the build; everything inferred stays collapsed.
    open[section.key] =
      !sectionIsComplete(section.key, draft) || Boolean(attention[section.key]);
  }
  return open;
}

/**
 * BriefComposer — `/request/build` as a brief you review, not a form you
 * fill. Six section cards + a live pricing rail replace the 4-step wizard;
 * the draft envelope (key/version/shape), the submit action, and the
 * always-mounted hidden-input mirror are preserved bit-for-bit so every
 * on-ramp (chat coach, co-pilot, guided interview, old saved drafts) and
 * the server-side re-pricing keep working unchanged.
 */
export function BriefComposer({
  services,
  packages,
  teams,
  requestConfig,
  preferredTeamId,
  presetHint,
  copilotSeed,
  initialStepIndex = 0,
  initialPathway,
  viewerIdentity,
  domainLookupEnabled = false,
  serverDraft = null,
}: Props) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Initial draft envelope — the same derivation the wizard used, delegating
  // defaults + co-pilot-seed overlay to the shared request-fields contract.
  // SA-1 recovery order: a fresh copilot seed wins outright; otherwise a
  // server-recovered draft is restored AS-IS (it is user state — the page's
  // default lane/step must not overwrite what the person already chose);
  // otherwise the empty draft with the page's lane/step hints.
  const initialDraft = useMemo<StudioBriefDraft>(
    () => {
      const seedInput = {
        config: requestConfig,
        services,
        serviceKind: presetHint?.serviceKind,
        preferredTeamId,
      };
      if (!copilotSeed && serverDraft) {
        return serverDraft;
      }
      const base = copilotSeed
        ? structuredToDraft(copilotSeed, seedInput)
        : emptyStudioBriefDraft(seedInput);
      return {
        ...base,
        // stepIndex stays clamped into the envelope for v1 compatibility —
        // the composer never navigates by it.
        stepIndex: Math.min(Math.max(0, initialStepIndex), 3),
        pathway: initialPathway ?? presetHint?.pathway ?? "custom",
        selectedProjectType:
          !copilotSeed && presetHint?.projectTypeLabel
            ? presetHint.projectTypeLabel
            : base.selectedProjectType,
      };
    },
    // Captured once on mount; a fresh copilot seed arrives via a parent
    // re-mount with a new `key`, exactly like the wizard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const draft = useFormDraft<StudioBriefDraft>(STUDIO_BRIEF_DRAFT_KEY, initialDraft, {
    skipRestore: Boolean(copilotSeed),
    version: STUDIO_BRIEF_DRAFT_VERSION,
  });
  const {
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

  const setValue = draft.setValue;
  /** Single-field update onto the envelope; no-ops on equal values so
   * effect-driven writes (domain intent lift) never loop. */
  const setField = useMemo(() => {
    return function set<K extends keyof StudioBriefDraft>(
      key: K,
      value: StudioBriefDraft[K],
    ) {
      setValue((prev) => (Object.is(prev[key], value) ? prev : { ...prev, [key]: value }));
    };
  }, [setValue]);
  const setDomainIntentJson = useCallback(
    (next: string) => setField("domainIntentJson", next),
    [setField],
  );
  const applyPatch = useCallback(
    (patch: Partial<StudioBriefDraft>) => setValue((prev) => ({ ...prev, ...patch })),
    [setValue],
  );

  // Inline validation messages keyed by field anchor (`data-field`). Set by
  // a blocked submit, cleared when the user edits a section.
  const [errors, setErrors] = useState<Record<string, string>>({});

  // SA-1 — the copilot's own uncertainty flags, routed to the sections that
  // answer them. Deterministic keyword mapping, no model call.
  const copilotAttention = useMemo(
    () => sectionsNeedingAttention(copilotSeed?.uncertainties ?? []),
    // Seed is consumed at mount (parent re-keys for a fresh one).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Which cards are expanded. Computed once after the draft restore settles
  // (complete → collapsed, empty or copilot-uncertain → open); user toggles
  // take over from there.
  const [openSections, setOpenSections] = useState<Record<ComposerSectionKey, boolean> | null>(
    null,
  );
  const openInitialized = useRef(false);
  useEffect(() => {
    if (!draft.isRestored || openInitialized.current) return;
    openInitialized.current = true;
    setOpenSections(computeInitialOpen(draft.value, copilotAttention));
  }, [draft.isRestored, draft.value, copilotAttention]);

  // SA-1 — server-persist the draft as it's filled (abandoned-brief
  // recovery). Debounced fire-and-forget; the server drops drafts with no
  // substance, re-checks ownership, and never throws. Local state stays
  // the source of truth — this is a durable shadow, not a round-trip.
  const serverSaveTimer = useRef<number | null>(null);
  const lastServerSave = useRef<string>("");
  useEffect(() => {
    if (!draft.isRestored || typeof window === "undefined") return;
    const serialized = JSON.stringify(draft.value);
    if (serialized === lastServerSave.current) return;
    if (serverSaveTimer.current) window.clearTimeout(serverSaveTimer.current);
    serverSaveTimer.current = window.setTimeout(() => {
      lastServerSave.current = serialized;
      void saveStudioBriefFlowDraftAction({ draft: draft.value, source: "composer" });
    }, 2500);
    return () => {
      if (serverSaveTimer.current) window.clearTimeout(serverSaveTimer.current);
    };
  }, [draft.isRestored, draft.value]);

  const toggleSection = useCallback((key: ComposerSectionKey) => {
    setOpenSections((prev) => {
      const base = prev ?? ({} as Record<ComposerSectionKey, boolean>);
      return { ...base, [key]: !base[key] };
    });
  }, []);

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
   * When the service kind changes (e.g. Website → Mobile app), reset
   * framework / backend selections that no longer apply — same guard the
   * wizard carries against a stale "Next.js" pick after switching lanes.
   */
  useEffect(() => {
    const validFrameworks = filterPricedOptions(requestConfig.frameworkOptions, serviceKind);
    if (
      selectedFramework &&
      !validFrameworks.find((option) => option.label === selectedFramework)
    ) {
      setField(
        "selectedFramework",
        validFrameworks[0]?.label ?? "Henry Onyx's framework recommendation",
      );
    }
    const validBackends = filterPricedOptions(requestConfig.backendOptions, serviceKind);
    if (selectedBackend && !validBackends.find((option) => option.label === selectedBackend)) {
      setField("selectedBackend", validBackends[0]?.label ?? "Henry Onyx recommends the backend");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceKind]);

  // The same honest client-side estimate the wizard computed — one money
  // source shared with the server's re-pricing inputs.
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

  /** Scroll to the first errored field anchor (or the owning section card
   * when no field anchor mounted yet). Same mechanism as the wizard. */
  const scrollToFirstError = useCallback(
    (errs: Record<string, string>, fallbackSection: ComposerSectionKey | null) => {
      if (typeof window === "undefined") return;
      const keys = Object.keys(errs);
      if (keys.length === 0 && !fallbackSection) return;
      window.requestAnimationFrame(() => {
        const node =
          keys
            .map((key) => document.querySelector<HTMLElement>(`[data-field="${key}"]`))
            .filter((el): el is HTMLElement => el !== null)
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] ??
          (fallbackSection
            ? document.querySelector<HTMLElement>(`[data-section="${fallbackSection}"]`)
            : null);
        if (!node) return;
        const targetTop = node.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
      });
    },
    [],
  );

  /**
   * Full-draft gate for Submit — the same validateStep sweep the wizard ran,
   * surfaced per section instead of per step: the first failing step's
   * errors map to their owning cards, those cards open, and the view scrolls
   * to the first error. Contact fields keep their native HTML5 gating.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    for (let i = 0; i < STEP_ORDER.length - 1; i++) {
      const v = validateStep(STEP_ORDER[i], draft.value);
      if (!v.ok) {
        event.preventDefault();
        const owning = new Set<ComposerSectionKey>();
        for (const key of Object.keys(v.errors)) {
          const section = sectionForErrorKey(key);
          if (section) owning.add(section);
        }
        setOpenSections((prev) => {
          const base = prev ?? computeInitialOpen(draft.value, copilotAttention);
          const next = { ...base };
          for (const section of owning) next[section] = true;
          return next;
        });
        setErrors(v.errors);
        scrollToFirstError(v.errors, [...owning][0] ?? null);
        return;
      }
    }
    // Same contract as the wizard: the server action redirects on success
    // (no JS callback), so the draft clears synchronously before the
    // request begins; client-side gating above catches every failure case.
    draft.clear();
  }

  /**
   * One screen, many text inputs: a stray Enter in the budget or a domain
   * field must not post the brief. Text inputs outside the submit block
   * swallow the implicit submission; textareas, buttons, and the contact
   * fields beside the real submit button keep native behaviour.
   */
  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement | null;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.closest("[data-allow-enter-submit]")) return;
    event.preventDefault();
  }

  const packagePriceLabel =
    pathway === "package" && selectedPackage ? formatNaira(selectedPackage.price) : null;
  const summaryContext = {
    t,
    packageName: selectedPackage?.name ?? null,
    packagePriceLabel,
  };
  const sectionAttention = useMemo(() => {
    // Validation errors win over copilot follow-up hints — both render on
    // the collapsed card as the "needs your eye" line.
    const map: Partial<Record<ComposerSectionKey, string>> = { ...copilotAttention };
    for (const [key, message] of Object.entries(errors)) {
      const section = sectionForErrorKey(key);
      if (section) map[section] = message;
    }
    return map;
  }, [errors, copilotAttention]);
  const followUpCount = Object.keys(copilotAttention).length;

  const isOpen = (key: ComposerSectionKey) => openSections?.[key] ?? false;
  const clearSectionErrors = () => {
    if (Object.keys(errors).length > 0) setErrors({});
  };

  const cards: { key: ComposerSectionKey; title: string; bare?: boolean }[] = [
    { key: "project", title: t("Project"), bare: true },
    { key: "scope", title: t("Scope") },
    { key: "stack", title: t("Stack") },
    { key: "business", title: t("Business & timeline") },
    { key: "domain", title: t("Domain"), bare: true },
    { key: "goals", title: t("Goals & notes") },
  ];

  return (
    <form
      action={submitStudioBriefAction}
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="space-y-10 pb-24 2xl:pb-0"
    >
      {/* Always-mounted hidden mirror of every contract field — copied from
        the wizard shell. Section editors are conditionally mounted (only
        open cards are in the DOM), so the mirror is what actually posts the
        brief; without it the user's project type, scope, budget, timeline,
        and feature choices would be silently dropped and the server would
        re-price the deposit from an incomplete brief. Multi-value fields
        emit one hidden input per selection so the action's getAll(...)
        reads the full list — and the editors deliberately carry no `name`
        so an open card never double-posts a value. */}
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
      <input type="hidden" name="projectType" value={effectiveProjectType} />
      <input type="hidden" name="platformPreference" value={effectivePlatform} />
      <input type="hidden" name="businessType" value={businessType} />
      {/* SA-1 — on the package lane the budget question isn't asked; the
        package's fixed price posts as the budget band so the lead record
        stays meaningful downstream. */}
      <input
        type="hidden"
        name="budgetBand"
        value={budgetBand || (pathway === "package" ? packagePriceLabel ?? "" : "")}
      />
      <input type="hidden" name="urgency" value={effectiveUrgency} />
      <input type="hidden" name="timeline" value={effectiveTimeline} />
      <input type="hidden" name="goals" value={goals} />
      <input type="hidden" name="scopeNotes" value={scopeNotes} />
      <input type="hidden" name="inspirationSummary" value={inspirationSummary} />
      {/* Domain intent is built inside the (possibly collapsed) domain
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

      {/* Editorial header — the brief reads as a document under review. */}
      <section>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          {t("Project brief")}
        </p>
        <h2 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[2.1rem] md:text-[2.4rem]">
          {t("Your brief, ready to review.")}
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-[var(--studio-ink-soft)] sm:text-base">
          {t(
            "Most of it is already drafted. Open a card to adjust a detail, or describe the change and preview it before it lands. Pricing updates as you go.",
          )}
        </p>
        {copilotSeed && followUpCount > 0 ? (
          <p className="mt-3 flex items-start gap-2 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <span>
              {t("Drafted from your conversation.")}{" "}
              {followUpCount === 1
                ? t("One follow-up is open below — it changes what we build.")
                : t("The open cards below are the follow-ups that change what we build.")}
            </span>
          </p>
        ) : null}
      </section>

      <div className="grid gap-10 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6" onInput={clearSectionErrors}>
          <DescribeChange draft={draft.value} onApply={applyPatch} />

          {cards.map((card, index) => {
            const complete = sectionIsComplete(card.key, draft.value);
            const open = isOpen(card.key);
            return (
              <SectionCard
                key={card.key}
                sectionKey={card.key}
                kicker={String(index + 1).padStart(2, "0")}
                title={card.title}
                summaryParts={sectionSummary(card.key, draft.value, summaryContext)}
                attention={open ? null : (sectionAttention[card.key] ?? null)}
                incompleteLabel={complete ? null : t("Needs detail")}
                open={open}
                onToggle={() => toggleSection(card.key)}
                adjustLabel={t("Adjust")}
                closeLabel={t("Done")}
                bare={card.bare}
              >
                {card.key === "project" ? (
                  <StudioRequestPathStep
                    services={services}
                    packages={packages}
                    requestConfig={requestConfig}
                    serviceKind={serviceKind}
                    setServiceKind={(value) => setField("serviceKind", value)}
                    pathway={pathway}
                    setPathway={(value) => setField("pathway", value)}
                    filteredPackages={filteredPackages}
                    selectedPackage={selectedPackage}
                    setSelectedPackageId={(value) => setField("selectedPackageId", value)}
                    selectedProjectType={effectiveProjectType}
                    setSelectedProjectType={(value) => setField("selectedProjectType", value)}
                    selectedPlatform={effectivePlatform}
                    setSelectedPlatform={(value) => setField("selectedPlatform", value)}
                    selectedDesign={selectedDesign}
                    setSelectedDesign={(value) => setField("selectedDesign", value)}
                    preferredLanguage={preferredLanguage}
                    setPreferredLanguage={(value) => setField("preferredLanguage", value)}
                    errors={errors}
                  />
                ) : null}
                {card.key === "scope" ? (
                  <ScopeSectionEditor
                    requestConfig={requestConfig}
                    serviceKind={serviceKind}
                    pathway={pathway}
                    selectedPackage={selectedPackage}
                    selectedPages={selectedPages}
                    setSelectedPages={(value) => setField("selectedPages", value)}
                    selectedModules={selectedModules}
                    setSelectedModules={(value) => setField("selectedModules", value)}
                    selectedAddOns={selectedAddOns}
                    setSelectedAddOns={(value) => setField("selectedAddOns", value)}
                    errors={errors}
                  />
                ) : null}
                {card.key === "stack" ? (
                  <StackSectionEditor
                    requestConfig={requestConfig}
                    serviceKind={serviceKind}
                    selectedProgrammingLanguage={selectedProgrammingLanguage}
                    setSelectedProgrammingLanguage={(value) =>
                      setField("selectedProgrammingLanguage", value)
                    }
                    selectedFramework={selectedFramework}
                    setSelectedFramework={(value) => setField("selectedFramework", value)}
                    selectedBackend={selectedBackend}
                    setSelectedBackend={(value) => setField("selectedBackend", value)}
                    selectedHosting={selectedHosting}
                    setSelectedHosting={(value) => setField("selectedHosting", value)}
                    selectedTech={selectedTech}
                    setSelectedTech={(value) => setField("selectedTech", value)}
                  />
                ) : null}
                {card.key === "business" ? (
                  <BusinessSectionEditor
                    requestConfig={requestConfig}
                    pathway={pathway}
                    packagePriceLabel={packagePriceLabel}
                    businessType={businessType}
                    setBusinessType={(value) => setField("businessType", value)}
                    budgetBand={budgetBand}
                    setBudgetBand={(value) => setField("budgetBand", value)}
                    urgency={effectiveUrgency}
                    setUrgency={(value) => setField("urgency", value)}
                    timeline={effectiveTimeline}
                    setTimeline={(value) => setField("timeline", value)}
                    errors={errors}
                  />
                ) : null}
                {card.key === "domain" ? (
                  <StudioDomainLaunchSection
                    onIntentChange={setDomainIntentJson}
                    lookupEnabled={domainLookupEnabled}
                  />
                ) : null}
                {card.key === "goals" ? (
                  <GoalsSectionEditor
                    goals={goals}
                    setGoals={(value) => setField("goals", value)}
                    scopeNotes={scopeNotes}
                    setScopeNotes={(value) => setField("scopeNotes", value)}
                    inspirationSummary={inspirationSummary}
                    setInspirationSummary={(value) => setField("inspirationSummary", value)}
                    errors={errors}
                  />
                ) : null}
              </SectionCard>
            );
          })}
        </div>

        <aside className="space-y-6 self-start 2xl:sticky 2xl:top-28">
          <PricingRailPanel
            pathway={pathway}
            readinessScore={readinessScore}
            pricing={pricingPreview}
          />
          <SubmitBlock
            id={SUBMIT_BLOCK_ID}
            teams={teams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={(value) => setField("selectedTeamId", value)}
            viewerIdentity={viewerIdentity ?? null}
          />
        </aside>
      </div>

      <MobilePricingBar pricing={pricingPreview} targetId={SUBMIT_BLOCK_ID} />
    </form>
  );
}
