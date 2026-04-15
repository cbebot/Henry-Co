import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("jobs", [
    "/analytics",
    "/api/",
    "/candidate",
    "/employer",
    "/login",
    "/recruiter",
  ]);
}
