import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@henryco/config", "@henryco/ui"],
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
