import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defaultSecurityHeadersConfig, getHubUrl } from "@henryco/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@henryco/aware", "@henryco/brand", "@henryco/config", "@henryco/media", "@henryco/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
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
      { source: "/privacy", destination: "/policies/privacy", permanent: true },
      { source: "/terms", destination: "/policies/terms", permanent: true },
    ];
  },
};

export default nextConfig;
