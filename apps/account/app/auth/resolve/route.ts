import { NextResponse } from "next/server";
import { getAccountUrl, isRecoverableSupabaseAuthError } from "@henryco/config";
import { resolveAuthenticatedDestination } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

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
