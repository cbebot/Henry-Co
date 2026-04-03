import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              try { cookieStore.set(name, value, options); } catch {}
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { full_name, phone } = await request.json();

    const admin = createAdminSupabase();
    const { error } = await admin
      .from("customer_profiles")
      .update({
        full_name: full_name || null,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
