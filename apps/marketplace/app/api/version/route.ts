import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      app: "henryco-marketplace",
      version: process.env.npm_package_version || "0.1.0",
      commitSha:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
        "development",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
