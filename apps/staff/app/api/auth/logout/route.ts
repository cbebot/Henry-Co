import { NextResponse } from "next/server";
import { createStaffSupabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createStaffSupabaseServer();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
