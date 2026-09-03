import { NextResponse } from "next/server";
import { buildHealthResponse, healthStatusCode } from "@henryco/observability/health";
import { getMarketplaceShellState } from "@/lib/marketplace/data";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-10 S8 + A6 — apps/marketplace /api/health.
 *
 * Returns the canonical V3-10 envelope (ok / checks / version / deploy)
 * AND preserves the legacy marketplace-specific fields the existing
 * smoke test reads (`shell`, `notificationQueue`, `failedNotifications`,
 * `lastAutomationRun`). The canonical `ok` flag is the source of truth
 * for HTTP status; the legacy `shell.schemaReady` no longer dictates
 * the 200/503 split.
 *
 * Standard health response is at the top of the body — the smoke test
 * reads `body.ok` which now reflects the V3-10 Supabase + env probe.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const baseHealth = await buildHealthResponse();
  const status = healthStatusCode(baseHealth);

  // Extended marketplace fields (notification-queue depth, automation runs) are
  // operational internals — only an ops-authenticated caller receives them.
  // Public callers get the canonical V3-10 health envelope (ok/checks/version),
  // which is what the smoke test reads for its 200/503 signal.
  const opsSecret = String(process.env.CRON_SECRET || "").trim();
  const isOps =
    opsSecret.length > 0 &&
    request.headers.get("authorization") === `Bearer ${opsSecret}`;
  if (!isOps) {
    return NextResponse.json(baseHealth, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Best-effort marketplace-specific status. Failures here are surfaced
  // as null fields, not as health failures — the canonical V3-10
  // contract is supabase + env only.
  let shell: Awaited<ReturnType<typeof getMarketplaceShellState>> | null = null;
  let notificationQueue: number | null = null;
  let failedNotifications: number | null = null;
  let lastAutomationRun: Record<string, unknown> | null = null;

  try {
    const admin = createAdminSupabase();
    shell = await getMarketplaceShellState();
    const [queueResult, automationResult, failedNotificationsResult] = await Promise.allSettled([
      admin
        .from("marketplace_notification_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued"),
      admin
        .from("marketplace_automation_runs")
        .select("id, status, completed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("marketplace_notification_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
    ]);

    if (queueResult.status === "fulfilled" && !queueResult.value.error) {
      notificationQueue = queueResult.value.count ?? 0;
    }
    if (failedNotificationsResult.status === "fulfilled" && !failedNotificationsResult.value.error) {
      failedNotifications = failedNotificationsResult.value.count ?? 0;
    }
    if (automationResult.status === "fulfilled" && !automationResult.value.error) {
      lastAutomationRun = automationResult.value.data as Record<string, unknown> | null;
    }
  } catch {
    // Marketplace-specific probe failure does not block the standard
    // health response — the canonical body still reports supabase/env.
  }

  return NextResponse.json(
    {
      ...baseHealth,
      shell,
      notificationQueue,
      failedNotifications,
      lastAutomationRun,
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
