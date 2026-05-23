import { getDivisionConfig } from "@henryco/config";
import type { SiteNavigationConfig } from "./types";

const logistics = getDivisionConfig("logistics");

export const siteNavLogistics: SiteNavigationConfig = {
  siteId: "logistics",
  primaryNav: logistics.publicNav,
  // "Book a pickup" (primary) + "Get a quote" (secondary) are now CTAs
  // rather than primary-nav entries. Both are real routes
  // (`/book`, `/quote`) and remain reachable from every public page via
  // the chrome's CTA buttons — see audit at
  // `docs/v3/public-nav-intelligence-2026-05-23.md`.
  defaultCtas: {
    primary: { label: "Book a pickup", href: "/book" },
    secondary: { label: "Get a quote", href: "/quote" },
  },
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
