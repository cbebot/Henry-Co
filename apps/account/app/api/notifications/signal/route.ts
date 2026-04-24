import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionBrand } from "@/lib/branding";
import { isHiddenNotification, notificationMessageHref, resolveSafeActionUrl } from "@/lib/notification-center";
import { resolveNotificationPresentation } from "@/lib/notification-localization";
import { getAccountAppLocale } from "@/lib/locale-server";

/**
 * Lightweight polling endpoint used by `NotificationSignalProvider`.
 *
 * Differences from `/api/notifications/recent`:
 *   - Accepts `?since=<ISO timestamp>` so the client only receives newly created
 *     unread notifications since its last seen baseline. This is what stops the
 *     initial unread backlog from spamming toasts.
 *   - Returns a smaller payload — only the fields the toast renders.
 *   - Caps `limit` to 6 (we never want a barrage of toasts at once anyway).
 *   - Always filters server-side for `is_read=false`, archived=null, deleted=null.
 */

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function parseSince(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const since = parseSince(url.searchParams.get("since"));
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 4), 1), 6);
    const locale = await getAccountAppLocale();

    const admin = createAdminSupabase();
    let query = admin
      .from("customer_notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gt("created_at", since);
    }

    const { data, error } = await query;

    if (error) {
      // Surface a quiet error — the client treats this as "no new signals" and
      // tries again on the next tick.
      return NextResponse.json(
        { items: [], serverTime: new Date().toISOString(), error: "fetch_failed" },
        { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const visible = rows.filter((row) => !isHiddenNotification(row));

    const items = await Promise.all(
      visible.map(async (row) => {
        const localized = resolveNotificationPresentation({ row, locale });
        const sourceKey =
          asNullableText(row.division) ||
          asNullableText(row.category) ||
          (asText(row.reference_type).startsWith("wallet_") ? "wallet" : null) ||
          "general";
        const source = await getDivisionBrand(sourceKey);
        const id = asText(row.id);

        return {
          id,
          title: localized.title,
          body: localized.body,
          created_at: asText(row.created_at),
          priority: asNullableText(row.priority),
          category: asNullableText(row.category) || asNullableText(row.division),
          message_href: notificationMessageHref(id),
          action_url: await resolveSafeActionUrl(row.action_url, sourceKey, source.primaryUrl),
          source: {
            key: source.key,
            label: source.label,
            accent: source.accent,
            logoUrl: source.logoUrl,
          },
        };
      }),
    );

    return NextResponse.json(
      {
        items,
        serverTime: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { items: [], serverTime: new Date().toISOString(), error: "internal" },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
