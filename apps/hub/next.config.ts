import type { NextConfig } from "next";
import path from "node:path";
import { defaultSecurityHeadersConfig } from "@henryco/config";

const nextConfig: NextConfig = {
  transpilePackages: ["@henryco/config", "@henryco/ui", "@henryco/notifications"],
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async headers() {
    return defaultSecurityHeadersConfig();
  },
  // The canonical legal routes are /privacy and /terms. These 308s catch the
  // conventional long-form URLs (and any external inbound links that assume
  // them) so they resolve instead of 404ing. Page rendering is untouched.
  async redirects() {
    return [
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-of-service", destination: "/terms", permanent: true },
    ];
  },
};

export default nextConfig;
