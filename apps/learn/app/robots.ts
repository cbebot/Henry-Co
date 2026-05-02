import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("learn", [
    "/admin",
    "/analytics",
    "/api/",
    "/auth",
    "/content",
    "/instructor",
    "/learner",
    "/login",
    "/owner",
    "/signup",
    "/support",
  ]);
}
