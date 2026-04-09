import { NextResponse } from "next/server";
import { normalizeTrustedRedirect, resolveTrustedRedirect } from "@henryco/config";
import { createSupabaseServer } from "@/lib/supabase/server";

async function handleLogout(request: Request) {
  const url = new URL(request.url);
  const next = normalizeTrustedRedirect(url.searchParams.get("next") || "/login");
  const supabase = await createSupabaseServer();

  await supabase.auth.signOut();

  return NextResponse.redirect(resolveTrustedRedirect(url.origin, next));
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
