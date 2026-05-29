import {
  buildAndroidAssetLinks,
  wellKnownJsonResponse,
} from "@henryco/seo/deeplinks";

/**
 * V3-04 (S2) — Android App Links (Digital Asset Links) manifest for this
 * origin. Served as `application/json` at `/.well-known/assetlinks.json`
 * (no auth, no redirect). Deep links here open the HenryCo super-app.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET(): Response {
  return wellKnownJsonResponse(buildAndroidAssetLinks("superApp"));
}
