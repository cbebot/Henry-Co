import { resolveTrustedRedirect } from "@henryco/config";
import { NextResponse } from "next/server";
import { getAccountLearnUrl } from "@/lib/learn/links";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || getAccountLearnUrl();

  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(resolveTrustedRedirect(url.origin, next));
}
