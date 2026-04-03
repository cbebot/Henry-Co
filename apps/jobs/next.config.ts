import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(appDir, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: root,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@henryco/brand", "@henryco/config", "@henryco/ui"],
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
    ],
  },
  turbopack: {
    root,
  },
};

export default nextConfig;
