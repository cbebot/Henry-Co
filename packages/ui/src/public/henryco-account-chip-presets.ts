/**
 * Canonical HenryCo public account chip + dropdown styling for all division marketing sites.
 * Use these presets so every public shell shares one identity system (with per-site overrides after spread).
 *
 * - **standard** — adaptive theme (light/dark) for most public headers (Care, Jobs, Learn, Property, Logistics, Studio).
 * - **onDarkMarketing** — solid dark dropdown + on-dark chip for glass / noir shells (Hub inner pages, Marketplace).
 */
export const HenryCoPublicAccountPresets = {
  standard: {
    dropdownTone: "theme" as const,
    chipSurface: "theme" as const,
  },
  onDarkMarketing: {
    dropdownTone: "solidDark" as const,
    chipSurface: "onDark" as const,
  },
} as const;

export type HenryCoPublicAccountPresetKey = keyof typeof HenryCoPublicAccountPresets;
