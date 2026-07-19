import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[logistics][auth/logout] sign-out failed:", error.message);
    return NextResponse.json({ ok: false, error: "logout_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
