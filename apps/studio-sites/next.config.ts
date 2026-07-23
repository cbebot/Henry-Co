import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defaultSecurityHeadersConfig } from "@henryco/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  transpilePackages: ["@henryco/config", "@henryco/studio-bundle"],
  turbopack: { root },
  async headers() {
    // The renderer serves generated client sites; the ecosystem security
    // headers apply by construction (the artifact carries no scripts).
    return defaultSecurityHeadersConfig();
  },
};

export default nextConfig;
