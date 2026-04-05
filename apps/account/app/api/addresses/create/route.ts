import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
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

    const body = await request.json();
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, landmark, is_default } = body;

    if (!address_line1 || !city || !state) {
      return NextResponse.json({ error: "Address, city, and state are required" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // If setting as default, unset other defaults
    if (is_default) {
      await admin
        .from("customer_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
    }

    const { error } = await admin.from("customer_addresses").insert({
      user_id: user.id,
      label: label || "Home",
      full_name: full_name || null,
      phone: phone || null,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state,
      postal_code: postal_code || null,
      landmark: landmark || null,
      is_default: is_default || false,
    });

    if (error) {
      logApiError("addresses/create", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("addresses/create", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
