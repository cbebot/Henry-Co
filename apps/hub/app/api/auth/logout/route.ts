import { NextResponse } from "next/server";
import { createHubSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createHubSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[henryco/hub-api] auth/logout:", error.message);
    return NextResponse.json({ error: "Sign-out failed. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
