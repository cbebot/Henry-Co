import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { removeSavedPropertyForUser } from "@/lib/property-module";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!listingId) {
    return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
  }

  await removeSavedPropertyForUser(user.id, listingId);
  return NextResponse.json({ ok: true });
}
