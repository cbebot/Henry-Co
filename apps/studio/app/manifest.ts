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
    icons: [
      { src: "/brand/monogram.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icon", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
      {
        src: "/brand/icon-512-maskable.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
