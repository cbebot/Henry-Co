import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Studio marketing IA (routes match `apps/studio` public pages).
 *
 * "Workspace" links to `/client` — Studio's authenticated client portal.
 * Signed-out visitors clicking it are redirected by the proxy middleware
 * to the shared account login with `next=` set, so they land back on
 * the workspace after sign-in. This keeps the entry visible to clients
 * who have a project in flight without exposing portal data publicly.
 */
const studioPublicNav: PublicNavItem[] = [
  { href: "/pick", label: "Project types" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Packages" },
  { href: "/work", label: "Case Studies" },
  { href: "/teams", label: "Teams" },
  { href: "/process", label: "Process" },
  { href: "/trust", label: "Trust" },
  { href: "/client", label: "Workspace" },
  { href: "/contact", label: "Contact" },
];

export const siteNavStudio: SiteNavigationConfig = {
  siteId: "studio",
  primaryNav: studioPublicNav,
  defaultCtas: {
    aux: { href: "/contact", label: "Speak to Studio" },
    primary: { href: "/request", label: "Start a project" },
  },
  heroOffset: { mainClassNameDefault: "pt-0" },
  featureSlots: { account: true },
  headerZ: "site",
};
