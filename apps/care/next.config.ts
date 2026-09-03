import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defaultSecurityHeadersConfig, getHubUrl } from "@henryco/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  transpilePackages: ["@henryco/config", "@henryco/media", "@henryco/ui"],
  images: {
    remotePatterns: [
      {
        // Legacy absolute media (existing rows) served by the prior CDN.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Public care media served by @henryco/media from the Supabase public
        // bucket (restricted to the public object path). Private media is never
        // fetched by next/image — it is signed-URL only.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    root,
  },
  async headers() {
    return defaultSecurityHeadersConfig();
  },
  async redirects() {
    return [
      { source: "/privacy", destination: getHubUrl("/privacy"), permanent: true },
      { source: "/terms", destination: getHubUrl("/terms"), permanent: true },
    ];
  },
};

export default nextConfig;
