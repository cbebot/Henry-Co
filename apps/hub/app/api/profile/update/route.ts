import { NextResponse } from "next/server";
import { buildLocaleCookieOptions, normalizeLocale } from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createHubSupabaseServer } from "@/lib/supabase/server";

const USER_FACING_SAVE = "We couldn't save your language preference right now. Please try again.";

export async function POST(request: Request) {
  try {
    const supabase = await createHubSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { language?: string | null };
    const language = normalizeLocale(body.language);
    const admin = createAdminSupabase();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("customer_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          language,
          updated_at: now,
          last_seen_at: now,
        },
        { onConflict: "id" },
      );

    if (error) {
      console.error("[henryco/hub-api] profile/update:", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        language,
      },
    });

    const response = NextResponse.json({ success: true, language });
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      "";
    const localeCookie = buildLocaleCookieOptions(language, host);
    response.cookies.set(localeCookie.name, localeCookie.value, {
      path: localeCookie.path,
      maxAge: localeCookie.maxAge,
      sameSite: localeCookie.sameSite,
      ...(localeCookie.domain ? { domain: localeCookie.domain } : {}),
    });

    return response;
  } catch (error) {
    console.error("[henryco/hub-api] profile/update:", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
