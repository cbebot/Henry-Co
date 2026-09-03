import type { NextConfig } from "next";
import path from "node:path";
import { defaultSecurityHeadersConfig } from "@henryco/config";

const nextConfig: NextConfig = {
  transpilePackages: ["@henryco/config", "@henryco/ui"],
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async headers() {
    // Reuse the platform's hardened header baseline; the owner CMS is a private
    // surface, so the login route additionally sets noindex via metadata.
    return defaultSecurityHeadersConfig();
  },
};

export default nextConfig;
