import type { StudioPackage, StudioService, StudioTeamProfile } from "@/lib/studio/types";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioPricingSummary } from "@/lib/studio/pricing";

export type StudioRequestPathway = "package" | "custom";

/**
 * A read-only restatement of everything the buyer chose, assembled by the
 * builder from its effective values + live pricing, and handed to the Review
 * step so the final screen can confirm the whole brief (and the exact price /
 * deposit) before the client commits. The pricing field is the *same* object
 * the side panel renders — one money source, no divergence.
 */
export type StudioBriefReviewSummary = {
  pathway: StudioRequestPathway;
  packageName: string | null;
  projectType: string;
  platform: string;
  design: string;
  preferredLanguage: string;
  pages: string[];
  modules: string[];
  addOns: string[];
  tech: string[];
  programmingLanguage: string;
  framework: string;
  backend: string;
  hosting: string;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  inspirationSummary: string;
  domainIntentJson: string;
  readinessScore: number;
  pricing: StudioPricingSummary;
};

export type RequestBuilderSelectionProps = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  serviceKind: StudioService["kind"];
  setServiceKind: (value: StudioService["kind"]) => void;
  pathway: StudioRequestPathway;
  setPathway: (value: StudioRequestPathway) => void;
  filteredPackages: StudioPackage[];
  selectedPackage: StudioPackage | null;
  setSelectedPackageId: (value: string) => void;
  selectedProjectType: string;
  setSelectedProjectType: (value: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (value: string) => void;
  selectedDesign: string;
  setSelectedDesign: (value: string) => void;
  preferredLanguage: string;
  setPreferredLanguage: (value: string) => void;
  selectedPages: string[];
  setSelectedPages: (value: string[]) => void;
  selectedModules: string[];
  setSelectedModules: (value: string[]) => void;
  selectedAddOns: string[];
  setSelectedAddOns: (value: string[]) => void;
  selectedTech: string[];
  setSelectedTech: (value: string[]) => void;
  selectedProgrammingLanguage: string;
  setSelectedProgrammingLanguage: (value: string) => void;
  selectedFramework: string;
  setSelectedFramework: (value: string) => void;
  selectedBackend: string;
  setSelectedBackend: (value: string) => void;
  selectedHosting: string;
  setSelectedHosting: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  budgetBand: string;
  setBudgetBand: (value: string) => void;
  urgency: string;
  setUrgency: (value: string) => void;
  timeline: string;
  setTimeline: (value: string) => void;
  goals: string;
  setGoals: (value: string) => void;
  scopeNotes: string;
  setScopeNotes: (value: string) => void;
  inspirationSummary: string;
  setInspirationSummary: (value: string) => void;
  /** Serialized StudioDomainIntent, lifted from the domain section so the
   * form shell can mirror it as a hidden input. The section owns the value;
   * the builder only stores and re-emits it (see request-builder shell). */
  domainIntentJson: string;
  setDomainIntentJson: (value: string) => void;
  selectedTeamId: string;
  setSelectedTeamId: (value: string) => void;
};
