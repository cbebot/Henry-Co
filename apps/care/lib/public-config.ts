import { getDivisionConfig } from "@henryco/config";
import { CARE_ACCENT } from "@/lib/care-theme";

const careDivision = getDivisionConfig("care");

export const BRAND = {
  name: "Henry & Co. Fabric Care",
  sub: "Garment care, home cleaning, and workplace upkeep",
  shortName: "Fabric Care",
  accent: CARE_ACCENT,
  dark: "#07111F",
  timezone: "Africa/Lagos",
  supportEmail: "care@henrycogroup.com",
  supportPhone: careDivision.supportPhone,
} as const;
