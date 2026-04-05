import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getNotificationBellFeed } from "@/lib/account-data";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 8), 3), 12);
    const payload = await getNotificationBellFeed(user.id, limit);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load notifications." }, { status: 500 });
  }
}
