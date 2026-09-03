import { NextResponse } from "next/server";
import { buildHealthResponse } from "@henryco/observability/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Validates the env the CMS depends on (Supabase
 * service role + Cloudinary + DeepL) and probes Supabase, so a misconfigured
 * Vercel environment is caught here rather than at first write.
 */
export async function GET() {
  const body = await buildHealthResponse({
    extraRequiredEnv: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "DEEPL_API_KEY",
    ],
  });
  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
