import type { MetadataRoute } from "next";
import { createPublicRobots } from "@henryco/config";

export default function robots(): MetadataRoute.Robots {
  return createPublicRobots("studio", [
    "/api/",
    "/client",
    "/delivery",
    "/finance",
    "/login",
    "/owner",
    "/pm",
    "/project",
    "/proposals",
    "/sales",
    "/support",
  ]);
}
