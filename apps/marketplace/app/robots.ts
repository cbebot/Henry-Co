import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("marketplace", [
    "/account",
    "/admin",
    "/api/",
    "/cart",
    "/checkout",
    "/finance",
    "/login",
    "/moderation",
    "/operations",
    "/owner",
    "/signup",
    "/support",
    "/track/",
    "/vendor",
  ]);
}
