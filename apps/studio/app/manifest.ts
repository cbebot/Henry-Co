import type { MetadataRoute } from "next";
import { getDivisionConfig } from "@henryco/config";

export default function manifest(): MetadataRoute.Manifest {
  const division = getDivisionConfig("studio");
  return {
    name: division.name,
    short_name: division.shortName,
    description: division.description,
    start_url: "/",
    display: "standalone",
    background_color: division.dark,
    theme_color: division.accent,
    icons: [],
  };
}
