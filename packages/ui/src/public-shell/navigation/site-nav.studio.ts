import type { PublicNavItem } from "../public-header";
import type { SiteNavigationConfig } from "./types";

/** Studio marketing IA (routes match `apps/studio` public pages).
 *
 * Audit (docs/v3/public-nav-intelligence-2026-05-23.md):
 *  - "Workspace" (→ `/client`) removed from primary nav. It already lives
 *    in the account chip menu and is also surfaced as a dedicated
 *    `renderMobileSheetAfterNav` slot in
 *    `apps/studio/components/studio/site-header.tsx`, so signed-in clients
 *    keep one-tap access to the portal without crowding the public bar.
 *  - "Contact" removed from primary nav — already the chrome's `aux` CTA
 *    ("Speak to Studio"), so it's still one click away on every page.
 *  - Resulting nav: 7 entries optimised for the primary engagement funnel
 *    (Project types → Services → Packages → Case studies → Process →
 *    Trust → Teams). The previous 9-item row was visually crowded and
 *    duplicated CTAs that already render as buttons.
 *  - Note: signed-out visitors clicking the chip's Workspace link are
 *    redirected by the proxy middleware to the shared account login with
 *    `next=` set, so they still land back on the workspace after sign-in.
 */
const studioPublicNav: PublicNavItem[] = [
  { href: "/pick", label: "Project types" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Packages" },
  { href: "/work", label: "Case studies" },
  { href: "/process", label: "Process" },
  { href: "/trust", label: "Trust" },
  { href: "/teams", label: "Teams" },
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
