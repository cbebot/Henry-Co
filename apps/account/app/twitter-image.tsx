import { ImageResponse } from "next/og";
import { DefaultOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from "@henryco/seo";
import { getSurfaceConfig } from "@henryco/config";

// OG-SOCIAL-METADATA — account was previously missing a twitter-image, so X had
// no dedicated `twitter:image`. This mirrors the opengraph-image route (same
// shared card) so the summary_large_image card has its own 1200x630 image.
export const runtime = "edge";
export const alt = getSurfaceConfig("account").name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function TwitterImage() {
  return new ImageResponse(<DefaultOgTemplate surfaceKey="account" />, { ...OG_SIZE });
}
