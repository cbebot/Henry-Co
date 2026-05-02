/**
 * HenryCo branded-documents — design tokens.
 */

import { COMPANIES, type CompanyKey } from "@henryco/brand/registry";

export const palette = {
  ink: "#1A1814",
  inkSoft: "#5C5852",
  inkMuted: "#8C887F",
  paper: "#FBF7EE",
  paperElev: "#F2EDDF",
  line: "#E5DFCB",
  lineSoft: "#EFE9D8",
  copper: "#C9A227",
  copperDeep: "#9C7A18",
  ok: "#3F7A4D",
  warn: "#A56C18",
  err: "#9C2A2A",
  white: "#FFFFFF",
  shadow: "#1A18141A",
} as const;

export type DivisionKey = CompanyKey | "account" | "jobs" | "learn" | "studio" | "property";

export const divisionAccents: Record<DivisionKey, { accent: string; soft: string; ink: string }> = {
  hub:         { accent: COMPANIES.hub.accent,         soft: "#F4E5B7", ink: "#3A2D08" },
  care:        { accent: COMPANIES.care.accent,        soft: "#DDE3FF", ink: "#1B2057" },
  building:    { accent: COMPANIES.building.accent,    soft: "#D8D5FC", ink: "#1B1750" },
  marketplace: { accent: COMPANIES.marketplace.accent, soft: "#EBD9B4", ink: "#3D2B0A" },
  logistics:   { accent: COMPANIES.logistics.accent,   soft: "#F6D7C0", ink: "#48200A" },
  account:     { accent: "#C9A227",                    soft: "#F4E5B7", ink: "#3A2D08" },
  jobs:        { accent: "#5F6BFF",                    soft: "#DDE0FF", ink: "#1A1F66" },
  learn:       { accent: "#5FC5AB",                    soft: "#D7F2E9", ink: "#10493B" },
  studio:      { accent: "#A368D6",                    soft: "#E6D5F4", ink: "#39184F" },
  property:    { accent: "#3FA796",                    soft: "#CFE9E3", ink: "#0F4239" },
};

export function resolveDivisionAccent(division: string | null | undefined) {
  const key = (division || "hub").toLowerCase() as DivisionKey;
  return divisionAccents[key] ?? divisionAccents.hub;
}

export const fonts = {
  serif: "HenryCoSerif",
  sans: "HenryCoSans",
  mono: "HenryCoMono",
} as const;

export const typeScale = {
  hairline: 7,
  caption: 8.5,
  micro: 9.5,
  body: 10.5,
  bodyLarge: 12,
  subhead: 14,
  head: 18,
  display: 24,
  hero: 36,
  ceremony: 56,
} as const;

export const lineHeights = {
  tight: 1.15,
  body: 1.5,
  loose: 1.7,
} as const;

export const letterSpacing = {
  display: -0.02,
  head: -0.01,
  body: 0,
  kicker: 0.18,
  ceremony: -0.04,
} as const;

export const page = {
  width: 595.28,
  height: 841.89,
  margin: {
    top: 56,
    right: 56,
    bottom: 64,
    left: 56,
  },
  accentStripeHeight: 6,
} as const;

export const glyphs = {
  check: "M3 7l3 3 7-7",
  shield: "M8 1 L14 4 V8 C14 11 11 14 8 15 C5 14 2 11 2 8 V4 Z",
  qrCorner: "M0 0 H4 V4 H0 Z",
} as const;
