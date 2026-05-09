import type { StaffDivision } from "@henryco/auth/staff";

/**
 * Division accent colors — pulled inline so this package doesn't have
 * to import the whole COMPANY config blob just to render rail accents.
 *
 * Source of truth: `packages/config/company.ts:COMPANY.divisions[*].accent`.
 * If a division's accent changes there, mirror here.
 */
export const STAFF_DIVISION_ACCENT: Record<StaffDivision, string> = {
  care: "#1F8B4C",
  marketplace: "#C04A1F",
  property: "#0E5A6F",
  studio: "#6F2E9C",
  jobs: "#16A34A",
  learn: "#1D4ED8",
  logistics: "#C9A227",
  hub: "#0A0A0A",
  staff: "#0A0A0A",
  account: "#0A0A0A",
  security: "#B91C1C",
  system: "#0A0A0A",
};
