import { NextResponse } from "next/server";
import { buildHealthResponse } from "@henryco/observability/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. The CMS's hard dependency is Supabase (URL + anon
 * key), which `buildHealthResponse` validates and probes. Cloudinary is an
 * optional feature (image upload degrades to a URL field when absent), and the
 * console uses owner-RLS rather than the service role — so neither is required
 * here. A misconfigured Supabase environment is still caught before first write.
 */
export async function GET() {
  const body = await buildHealthResponse({ extraRequiredEnv: [] });
  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
