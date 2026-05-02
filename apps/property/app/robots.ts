import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("property", [
    "/account",
    "/admin",
    "/agent",
    "/api/",
    "/login",
    "/moderation",
    "/operations",
    "/owner",
    "/support",
  ]);
}
