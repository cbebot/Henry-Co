import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defaultSecurityHeadersConfig, getHubUrl } from "@henryco/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  transpilePackages: ["@henryco/config", "@henryco/ui"],
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
