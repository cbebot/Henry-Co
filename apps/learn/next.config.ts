import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defaultSecurityHeadersConfig, getHubUrl } from "@henryco/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  transpilePackages: ["@henryco/aware", "@henryco/config", "@henryco/media", "@henryco/ui"],
  images: {
    remotePatterns: [
      {
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
      { source: "/about", destination: getHubUrl("/about"), permanent: false },
      { source: "/contact", destination: getHubUrl("/contact"), permanent: false },
      { source: "/privacy", destination: getHubUrl("/privacy"), permanent: true },
      { source: "/terms", destination: getHubUrl("/terms"), permanent: true },
    ];
  },
};

export default nextConfig;
