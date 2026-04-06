import { NextResponse } from "next/server";
import { getAccountUrl } from "@henryco/config";
import { resolveAuthenticatedDestination } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(getAccountUrl("/login"));
    const next = url.searchParams.get("next");
    if (next) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  const destination = await resolveAuthenticatedDestination({
    user,
    next: url.searchParams.get("next"),
    origin: url.origin,
  });

  return NextResponse.redirect(destination);
}
