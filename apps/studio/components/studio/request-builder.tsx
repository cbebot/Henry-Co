"use client";

import { useMemo, useState } from "react";
import { requestSteps, urgencyOptions } from "@/components/studio/request-builder-data";
import { StudioRequestActivationStep } from "@/components/studio/request-activation-step";
import { StudioRequestCommercialStep } from "@/components/studio/request-commercial-step";
import { StudioRequestPathStep } from "@/components/studio/request-path-step";
import { StudioRequestScopeStep } from "@/components/studio/request-scope-step";
import { StudioRequestSidePanel } from "@/components/studio/request-side-panel";
import { submitStudioBriefAction } from "@/lib/studio/actions";
import { estimateStudioPricing } from "@/lib/studio/pricing";
import type { StudioPackage, StudioService, StudioTeamProfile } from "@/lib/studio/types";

type Props = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  preferredTeamId?: string | null;
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
  preferredTeamId,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [serviceKind, setServiceKind] = useState<StudioService["kind"]>(services[0]?.kind ?? "website");
  const [pathway, setPathway] = useState<"package" | "custom">("custom");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(preferredTeamId ?? "");
  const [selectedProjectType, setSelectedProjectType] = useState("Executive company website");
  const [selectedPlatform, setSelectedPlatform] = useState("Best-fit recommendation");
  const [selectedDesign, setSelectedDesign] = useState("Quiet luxury and high-trust");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("");
  const [budgetBand, setBudgetBand] = useState("");
  const [urgency, setUrgency] = useState("");
  const [timeline, setTimeline] = useState("");
  const [goals, setGoals] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [inspirationSummary, setInspirationSummary] = useState("");

  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (pkg) => services.find((service) => service.id === pkg.serviceId)?.kind === serviceKind
      ),
    [packages, serviceKind, services]
  );

  const selectedService = services.find((service) => service.kind === serviceKind) ?? services[0];
  const selectedPackage =
    filteredPackages.find((item) => item.id === selectedPackageId) ?? filteredPackages[0] ?? null;
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
          urgency,
        },
        customRequest:
          pathway === "custom"
            ? {
                projectType: selectedProjectType,
                platformPreference: selectedPlatform,
                pageRequirements: selectedPages,
                addonServices: selectedAddOns,
              }
            : null,
      }),
    [
      pathway,
      selectedAddOns,
      selectedModules,
      selectedPackage,
      selectedPages,
      selectedPlatform,
      selectedProjectType,
      selectedService,
      urgency,
    ]
  );

  const readinessScore = useMemo(() => {
    let score = pathway === "custom" ? 56 : 58;
    if (pathway === "package" && selectedPackage) score += 10;
    if (selectedProjectType) score += 4;
    if (selectedPlatform) score += 4;
    if (selectedDesign) score += 4;
    if (selectedPages.length >= 2) score += 8;
    if (selectedModules.length >= 3) score += 10;
    if (selectedAddOns.length >= 2) score += 6;
    if (selectedTech.length >= 1) score += 4;
    if (businessType) score += 4;
    if (budgetBand) score += 4;
    if (urgency) score += 4;
    if (timeline) score += 4;
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
    selectedPlatform,
    selectedProjectType,
    selectedTech.length,
    scopeNotes,
    timeline,
    urgency,
  ]);

  return (
    <form action={submitStudioBriefAction} className="space-y-6">
      <input type="hidden" name="preferredTeamId" value={selectedTeamId} />
      <input type="hidden" name="serviceKind" value={serviceKind} />
      <input type="hidden" name="packageIntent" value={pathway} />
      <input type="hidden" name="packageId" value={pathway === "package" ? selectedPackage?.id || "" : ""} />
      <input type="hidden" name="designDirection" value={selectedDesign} />

      <section className="studio-panel rounded-[2.8rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="studio-kicker">Premium brief funnel</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)] sm:text-4xl">
              Scope the project through a commercial intake, not a cluttered form.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--studio-ink-soft)] sm:text-base">
              Package buyers get a sharper fast-fit route. Custom buyers get a deliberate architecture
              funnel for websites, apps, portals, internal systems, and workflow-heavy software.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 px-5 py-4 text-sm leading-7 text-[var(--studio-ink-soft)] xl:max-w-sm">
            {requestSteps[stepIndex].title}
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-4">
          {requestSteps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => setStepIndex(index)}
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
              serviceKind={serviceKind}
              setServiceKind={setServiceKind}
              pathway={pathway}
              setPathway={setPathway}
              filteredPackages={filteredPackages}
              selectedPackage={selectedPackage}
              setSelectedPackageId={setSelectedPackageId}
              selectedProjectType={selectedProjectType}
              setSelectedProjectType={setSelectedProjectType}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              selectedDesign={selectedDesign}
              setSelectedDesign={setSelectedDesign}
            />
          ) : null}
          {stepIndex === 1 ? (
            <StudioRequestScopeStep
              pathway={pathway}
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
              businessType={businessType}
              setBusinessType={setBusinessType}
              budgetBand={budgetBand}
              setBudgetBand={setBudgetBand}
              urgency={urgency}
              setUrgency={setUrgency}
              timeline={timeline}
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
              onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
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
                onClick={() => setStepIndex((current) => Math.min(current + 1, requestSteps.length - 1))}
                className="studio-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Continue
              </button>
            ) : null}
          </div>
        </div>

        <StudioRequestSidePanel
          pathway={pathway}
          readinessScore={readinessScore}
          pricingPreview={pricingPreview}
          recommendedTeamName={recommendedTeam?.name || "HenryCo match layer"}
        />
      </div>
    </form>
  );
}
