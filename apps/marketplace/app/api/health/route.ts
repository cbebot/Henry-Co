import { NextResponse } from "next/server";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const admin = createAdminSupabase();
  const shell = await getMarketplaceShellState();
  const [queueResult, automationResult, failedNotificationsResult] = await Promise.allSettled([
    admin.from("marketplace_notification_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    admin
      .from("marketplace_automation_runs")
      .select("id, status, completed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("marketplace_notification_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  return NextResponse.json(
    {
      ok: shell.schemaReady,
      status: shell.schemaReady ? "healthy" : "degraded",
      shell,
      notificationQueue:
        queueResult.status === "fulfilled" && !queueResult.value.error ? queueResult.value.count ?? 0 : null,
      failedNotifications:
        failedNotificationsResult.status === "fulfilled" && !failedNotificationsResult.value.error
          ? failedNotificationsResult.value.count ?? 0
          : null,
      lastAutomationRun:
        automationResult.status === "fulfilled" && !automationResult.value.error ? automationResult.value.data : null,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
