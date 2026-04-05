"use client";

import { Check, LoaderCircle } from "lucide-react";
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

function stepClass(active: boolean) {
  return active
    ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
    : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.2)]";
}

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
        (pkg) => services.find((service) => service.id === pkg.serviceId)?.kind === serviceKind
      ),
    [packages, serviceKind, services]
  );

  const selectedService = services.find((service) => service.kind === serviceKind) ?? services[0];
  const availableProjectTypes = useMemo(
    () => filterPricedOptions(requestConfig.projectTypes, serviceKind),
    [requestConfig.projectTypes, serviceKind]
  );
  const availablePlatforms = useMemo(
    () => filterPricedOptions(requestConfig.platformOptions, serviceKind),
    [requestConfig.platformOptions, serviceKind]
  );
  const availableUrgencyOptions = useMemo(
    () => filterModifierOptions(requestConfig.urgencyOptions, serviceKind),
    [requestConfig.urgencyOptions, serviceKind]
  );
  const availableTimelineOptions = useMemo(
    () => filterModifierOptions(requestConfig.timelineOptions, serviceKind),
    [requestConfig.timelineOptions, serviceKind]
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
      estimateStudioPricing({
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
      }, requestConfig),
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
    ]
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
    setProgressHint("Progress saved—you can leave and return anytime while signed in.");
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

  return (
    <form action={submitStudioBriefAction} className="space-y-6">
      <div ref={topRef} />
      <input type="hidden" name="preferredTeamId" value={selectedTeamId} />
      <input type="hidden" name="serviceKind" value={serviceKind} />
      <input type="hidden" name="packageIntent" value={pathway} />
      <input type="hidden" name="packageId" value={pathway === "package" ? effectivePackageId : ""} />
      <input type="hidden" name="designDirection" value={selectedDesign} />

      <section className="studio-panel rounded-[2.8rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="studio-kicker">Project brief</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)] sm:text-4xl">
              Answer in plain language—we organise the details for you.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--studio-ink-soft)] sm:text-base">
              Packages give a faster lane when the work matches something we have done before. Custom gives
              more room when your product is unique. Either way, you can pause and come back.
            </p>
            {progressHint ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-3 rounded-[1.35rem] border border-[rgba(151,244,243,0.28)] bg-[rgba(151,244,243,0.08)] px-4 py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]" aria-hidden />
                <span>{progressHint}</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 px-5 py-4 text-sm leading-7 text-[var(--studio-ink-soft)] xl:max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                Step {stepIndex + 1} of {requestSteps.length}
              </span>
              {isStepTransitioning ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--studio-signal)]" />
              ) : null}
            </div>
            <div className="mt-3 font-medium text-[var(--studio-ink)]">
              {requestSteps[stepIndex].label}
            </div>
            <div className="mt-2">{requestSteps[stepIndex].title}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-4">
          {requestSteps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => goToStep(index)}
              className={`rounded-[1.5rem] border px-4 py-4 text-left transition duration-200 ${stepClass(index === stepIndex)}`}
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                0{index + 1}
              </div>
              <div className="mt-3 text-base font-semibold text-[var(--studio-ink)]">{step.label}</div>
              <p className="mt-2 text-sm leading-6 text-[var(--studio-ink-soft)]">{step.body}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
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

          <div className="flex items-center justify-between gap-3 px-2">
            <button
              type="button"
              onClick={() => goToStep(Math.max(stepIndex - 1, 0))}
              disabled={stepIndex === 0}
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                stepIndex === 0
                  ? "cursor-not-allowed border-[var(--studio-line)] text-[var(--studio-ink-soft)] opacity-50"
                  : "border-[var(--studio-line)] text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.28)]"
              }`}
            >
              Back
            </button>
            {stepIndex < requestSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => goToStep(Math.min(stepIndex + 1, requestSteps.length - 1))}
                className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {isStepTransitioning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isStepTransitioning ? "Loading next step..." : "Continue"}
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
