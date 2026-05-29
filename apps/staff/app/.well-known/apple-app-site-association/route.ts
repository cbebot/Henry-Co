import {
  buildAppleAppSiteAssociation,
  wellKnownJsonResponse,
} from "@henryco/seo/deeplinks";

/**
 * V3-04 (S2) — iOS Universal Links manifest for this origin.
 * Served as `application/json` at `/.well-known/apple-app-site-association`
 * (no auth, no redirect — per Apple spec). Deep links here open the
 * HenryCo company-hub app (owner/staff surfaces).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET(): Response {
  return wellKnownJsonResponse(buildAppleAppSiteAssociation("companyHub"));
}
