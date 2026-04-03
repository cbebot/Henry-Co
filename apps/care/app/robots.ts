import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/workspace/",
          "/owner",
          "/manager",
          "/support",
          "/rider",
          "/staff",
        ],
      },
    ],
  };
}
