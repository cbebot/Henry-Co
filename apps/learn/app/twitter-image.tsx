import { getDivisionConfig } from "@henryco/config";
import { DefaultOgTemplate, OG_SIZE, OG_CONTENT_TYPE, renderDefaultOgImage } from "@henryco/seo";

// OG-SOCIAL-METADATA — delegates to the ONE shared Henry Onyx card
// (DefaultOgTemplate) + shared renderer (loads the brand serif). Edge runtime
// keeps it fast + publicly reachable; Next wires it into an absolute og:image.
export const runtime = "edge";
export const alt = getDivisionConfig("learn").name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return renderDefaultOgImage(<DefaultOgTemplate divisionKey="learn" />);
}
