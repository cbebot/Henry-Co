import { filterPricedOptions } from "@/lib/studio/request-config";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioServiceKind } from "@/lib/studio/types";

export type StudioRequestPresetResult = {
  serviceKind: StudioServiceKind;
  pathway: "package" | "custom";
  projectTypeLabel: string;
};

type PresetDef = {
  serviceKind: StudioServiceKind;
  pathway?: "package" | "custom";
  /** Prefer this label when it exists for the service kind */
  projectTypeLabel: string;
};

const PRESETS: Record<string, PresetDef> = {
  "business-website": {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Executive company website",
  },
  ecommerce: {
    serviceKind: "ecommerce",
    pathway: "custom",
    projectTypeLabel: "Premium e-commerce storefront",
  },
  booking: {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Marketplace or booking platform",
  },
  "real-estate": {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Executive company website",
  },
  logistics: {
    serviceKind: "internal_system",
    pathway: "custom",
    projectTypeLabel: "Internal operations dashboard",
  },
  school: {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Client portal or account workspace",
  },
  learning: {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Client portal or account workspace",
  },
  agency: {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Lead generation or campaign funnel",
  },
  community: {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Marketplace or booking platform",
  },
  services: {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Lead generation or campaign funnel",
  },
  church: {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Executive company website",
  },
  portfolio: {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Lead generation or campaign funnel",
  },
  marketplace: {
    serviceKind: "ecommerce",
    pathway: "custom",
    projectTypeLabel: "Premium e-commerce storefront",
  },
  "custom-app": {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Custom operations software",
  },
  mobile: {
    serviceKind: "mobile_app",
    pathway: "custom",
    projectTypeLabel: "Mobile app",
  },
  branding: {
    serviceKind: "branding",
    pathway: "custom",
    projectTypeLabel: "Brand system and digital identity",
  },
  "school-portal": {
    serviceKind: "website",
    pathway: "custom",
    projectTypeLabel: "Client portal or account workspace",
  },
  "community-platform": {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Marketplace or booking platform",
  },
  "web-app-starter": {
    serviceKind: "custom_software",
    pathway: "custom",
    projectTypeLabel: "Custom operations software",
  },
};

export function resolveStudioRequestPreset(
  rawKey: string | null | undefined,
  requestConfig: StudioRequestConfig
): StudioRequestPresetResult | null {
  const key = String(rawKey || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  const def = PRESETS[key];
  if (!def) return null;

  const types = filterPricedOptions(requestConfig.projectTypes, def.serviceKind);
  const match = types.find((t) => t.label === def.projectTypeLabel) ?? types[0];
  if (!match) return null;

  return {
    serviceKind: def.serviceKind,
    pathway: def.pathway ?? "custom",
    projectTypeLabel: match.label,
  };
}
