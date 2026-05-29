import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const intent = await admin.from("payment_intents").select("id, user_id, status").eq("id", id).single();
  const intentRow = intent.data as { id: string; user_id: string; status: string } | null;
  if (intent.error || !intentRow || intentRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Move pending → processing (the only legal client-driven step; the BEFORE UPDATE trigger enforces A2).
  // The .eq("status","pending") guard makes this a no-op-safe single-step advance.
  const update = await admin
    .from("payment_intents")
    .update({ status: "processing" } as never)
    .eq("id", id)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();
  if (update.error) {
    return NextResponse.json({ error: "Cannot finalize" }, { status: 409 });
  }
  const updatedRow = update.data as { id: string; status: string } | null;
  return NextResponse.json({ intentId: id, status: updatedRow?.status ?? intentRow.status }, { status: 200 });
}
