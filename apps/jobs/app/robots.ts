import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("jobs", [
    "/admin",
    "/analytics",
    "/api/",
    "/auth",
    "/candidate",
    "/employer",
    "/login",
    "/moderation",
    "/owner",
    "/recruiter",
    "/signup",
  ]);
}
