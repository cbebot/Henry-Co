import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  transpilePackages: ["@henryco/config", "@henryco/ui"],
  turbopack: {
    root,
  },
};

export default nextConfig;
