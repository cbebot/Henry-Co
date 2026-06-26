import { getSurfaceConfig } from "@henryco/config";
import { DefaultOgTemplate, OG_SIZE, OG_CONTENT_TYPE, renderDefaultOgImage } from "@henryco/seo";

// OG-SOCIAL-METADATA — account renders the ONE shared Henry Onyx card via the
// SURFACES registry. Edge runtime, publicly reachable (proxy exempts this route).
export const runtime = "edge";
export const alt = getSurfaceConfig("account").name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OG() {
  return renderDefaultOgImage(<DefaultOgTemplate surfaceKey="account" />);
}
