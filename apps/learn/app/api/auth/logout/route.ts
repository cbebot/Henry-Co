import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    console.error("[learn][auth/logout] sign-out failed:", error.message);
    return NextResponse.json(
      { error: "logout_failed", message: "We couldn't sign you out. Try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
