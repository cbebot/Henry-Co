import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[jobs][auth/logout] sign-out failed:", error.message);
    return NextResponse.json(
      { error: "sign_out_failed", message: "Sign out failed. Please try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
