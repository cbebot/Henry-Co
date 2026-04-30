"use client";

import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import type { StudioRequestPresetResult } from "@/lib/studio/request-presets";
import type { StudioPackage, StudioService, StudioTeamProfile } from "@/lib/studio/types";

type Props = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  preferredTeamId?: string | null;
  presetHint?: StudioRequestPresetResult | null;
};

export function StudioRequestBuilder({
  services,
  packages,
  teams,
  requestConfig,
  preferredTeamId,
  presetHint,
}: Props) {
  const resolvedKind =
    presetHint?.serviceKind && services.some((s) => s.kind === presetHint.serviceKind)
      ? presetHint.serviceKind
      : (services[0]?.kind ?? "website");
  const initialServiceKind = resolvedKind;
  const initialProjectType =
    presetHint?.projectTypeLabel ||
    filterPricedOptions(requestConfig.projectTypes, initialServiceKind)[0]?.label ||
    "Custom digital program";
  const initialPlatform =
    filterPricedOptions(requestConfig.platformOptions, initialServiceKind)[0]?.label ||
    "Best-fit recommendation";
  const initialDesign =
    requestConfig.designOptions[0] || "Quiet luxury and high-trust";
  const initialTimeline =
    filterModifierOptions(requestConfig.timelineOptions, initialServiceKind)[0]?.label || "";
  const initialUrgency =
    filterModifierOptions(requestConfig.urgencyOptions, initialServiceKind)[0]?.label || "";
  const [stepIndex, setStepIndex] = useState(0);
  const [serviceKind, setServiceKind] = useState<StudioService["kind"]>(initialServiceKind);
  const [pathway, setPathway] = useState<"package" | "custom">(presetHint?.pathway ?? "custom");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(preferredTeamId ?? "");
  const [selectedProjectType, setSelectedProjectType] = useState(initialProjectType);
  const [selectedPlatform, setSelectedPlatform] = useState(initialPlatform);
  const [selectedDesign, setSelectedDesign] = useState(initialDesign);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("");
  const [budgetBand, setBudgetBand] = useState("");
  const [urgency, setUrgency] = useState(initialUrgency);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [goals, setGoals] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [inspirationSummary, setInspirationSummary] = useState("");
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [progressHint, setProgressHint] = useState<string | null>(null);
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
    scopeNotes,
    effectiveTimeline,
    effectiveUrgency,
  ]);

  function goToStep(nextIndex: number) {
    if (nextIndex === stepIndex) return;
    setIsStepTransitioning(true);
    setStepIndex(nextIndex);
    setProgressHint("Progress saved — you can leave and return any time while signed in.");
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

  const totalSteps = requestSteps.length;
  const progressPct = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const currentStep = requestSteps[stepIndex];

  return (
    <form action={submitStudioBriefAction} className="space-y-10">
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

      {/* Editorial brief header — no panel chrome, magazine progress strip */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
              Project brief
              <span className="mx-2 opacity-40">·</span>
              <span className="text-[var(--studio-ink-soft)]">
                Step {String(stepIndex + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
              </span>
            </p>
            <h2 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[2.1rem] md:text-[2.4rem]">
              {currentStep.title}
            </h2>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-7 text-[var(--studio-ink-soft)] sm:text-base">
              {currentStep.body}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
            {isStepTransitioning ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--studio-signal)]">
                <LoaderCircle className="h-3 w-3 animate-spin" />
                Loading
              </span>
            ) : (
              <span className="text-[var(--studio-ink-soft)]">{progressPct}% complete</span>
            )}
          </div>
        </div>

        {/* Premium step navigator — horizontal numbered rail with progress fill */}
        <nav aria-label="Brief steps" className="mt-8">
          <div className="relative">
            {/* hairline track */}
            <div className="absolute left-0 right-0 top-[18px] h-px bg-[var(--studio-line)]" />
            {/* progress fill */}
            <div
              className="absolute left-0 top-[18px] h-px bg-[var(--studio-signal)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
            <ol className="relative grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
              {requestSteps.map((step, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;
                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      onClick={() => goToStep(index)}
                      aria-current={isActive ? "step" : undefined}
                      className="group block w-full text-left"
                    >
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-mono font-semibold tracking-tight transition ${
                          isActive
                            ? "border-[var(--studio-signal)] bg-[var(--studio-signal)] text-[#031318] shadow-[0_0_0_4px_rgba(73,192,197,0.18)]"
                            : isComplete
                              ? "border-[var(--studio-signal)]/55 bg-transparent text-[var(--studio-signal)]"
                              : "border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] text-[var(--studio-ink-soft)] group-hover:border-[var(--studio-signal)]/40 group-hover:text-[var(--studio-ink)]"
                        }`}
                      >
                        {isComplete ? <Check className="h-4 w-4" /> : `0${index + 1}`}
                      </span>
                      <p
                        className={`mt-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] transition ${
                          isActive
                            ? "text-[var(--studio-signal)]"
                            : "text-[var(--studio-ink-soft)] group-hover:text-[var(--studio-ink)]"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p
                        className={`mt-2 text-sm leading-snug transition ${
                          isActive
                            ? "text-[var(--studio-ink)]"
                            : "text-[var(--studio-ink-soft)] group-hover:text-[var(--studio-ink)]"
                        }`}
                      >
                        {step.body}
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
            />
          ) : null}
          {stepIndex === 3 ? (
            <StudioRequestActivationStep
              teams={teams}
              selectedTeamId={selectedTeamId}
              setSelectedTeamId={setSelectedTeamId}
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
                  : "border-[var(--studio-line)] text-[var(--studio-ink)] hover:border-[var(--studio-signal)]/40 hover:bg-[rgba(0,0,0,0.04)]"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            {stepIndex < requestSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => goToStep(Math.min(stepIndex + 1, requestSteps.length - 1))}
                disabled={pathway === "package" && filteredPackages.length === 0}
                className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStepTransitioning ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                {isStepTransitioning ? "Loading next step" : "Continue"}
                {!isStepTransitioning ? <ArrowRight className="h-3.5 w-3.5" /> : null}
              </button>
            ) : null}
          </div>
        </div>

        <StudioRequestSidePanel
          pathway={pathway}
          readinessScore={readinessScore}
          pricingPreview={pricingPreview}
          recommendedTeamName={recommendedTeam?.name || "HenryCo team recommendation"}
        />
      </div>
    </form>
  );
}
