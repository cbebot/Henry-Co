import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. The CMS's only hard dependency is the public
 * Supabase project (URL + anon key) — it uses owner-RLS, NOT the service role,
 * and Cloudinary/DeepL are optional features. So we report ready when the anon
 * Supabase env is present and the REST endpoint answers. We intentionally do
 * NOT require the service role here (the shared observability probe does, which
 * is wrong for this app).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const envOk = Boolean(url && anon);

  let supabaseOk = false;
  if (envOk) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anon as string },
        cache: "no-store",
      });
      supabaseOk = res.ok;
    } catch {
      supabaseOk = false;
    }
  }

  const ok = envOk && supabaseOk;
  return NextResponse.json(
    {
      ok,
      checks: { env: envOk ? "pass" : "fail", supabase: supabaseOk ? "pass" : "fail" },
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET)
        ? "configured"
        : "absent",
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
