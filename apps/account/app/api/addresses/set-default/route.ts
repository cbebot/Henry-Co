/**
 * V2-ADDR-01 — Set an address as default. The DB trigger handles demoting
 * the previous default; we just flip is_default = true on the chosen row.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              try {
                cookieStore.set(name, value, options);
              } catch {}
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = (await request.json()) as { id: string };
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data, error } = await supabase
      .from("user_addresses")
      .update({ is_default: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, is_default")
      .single();

    if (error) {
      logApiError("addresses/set-default", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ address: data });
  } catch (err) {
    logApiError("addresses/set-default", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
