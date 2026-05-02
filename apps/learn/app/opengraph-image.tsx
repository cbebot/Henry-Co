import { ImageResponse } from "next/og";
import { DefaultOgTemplate, OG_SIZE, OG_CONTENT_TYPE } from "@henryco/seo";
import { getDivisionConfig } from "@henryco/config";

export const runtime = "edge";
export const alt = getDivisionConfig("learn").name;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OG() {
  return new ImageResponse(<DefaultOgTemplate divisionKey="learn" />, { ...OG_SIZE });
}
