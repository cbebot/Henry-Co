import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HenryCo Account",
    short_name: "HenryCo",
    description:
      "Your HenryCo account — single sign-on across all Henry & Co. divisions, with activity, payments, and notifications in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#C9A227",
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
