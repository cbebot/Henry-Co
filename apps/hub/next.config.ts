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
    return defaultSecurityHeadersConfig();
  },
};

export default nextConfig;
