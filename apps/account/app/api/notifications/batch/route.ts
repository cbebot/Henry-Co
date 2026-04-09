import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = getSharedCookieDomain(
    headerStore.get("x-forwarded-host") || headerStore.get("host")
  );
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: cookieDomain
        ? {
            domain: cookieDomain,
            path: "/",
            sameSite: "lax",
            secure: true,
          }
        : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(tokens) {
          for (const { name, value, options } of tokens) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Read-only in some route contexts.
            }
          }
        },
      },
    }
  );

  return supabase.auth.getUser();
}

export async function POST(request: Request) {
  try {
    const {
      data: { user },
    } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const ids = Array.from(
      new Set(
        Array.isArray(body?.ids)
          ? body.ids.map((value: unknown) => String(value || "").trim()).filter(Boolean)
          : []
      )
    );
    const isRead = body?.isRead !== false;
    const admin = createAdminSupabase();
    let query = admin
      .from("customer_notifications")
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("user_id", user.id);

    if (ids.length > 0) {
      query = query.in("id", ids);
    } else if (isRead) {
      query = query.eq("is_read", false);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: ids.length || "all" });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
