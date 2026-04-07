import "server-only";

import { parseHenryFeatureFlags, type SupportQueue } from "@henryco/intelligence";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { WorkspaceDivision } from "@/lib/types";
import type { WorkspaceTask } from "@/lib/types";

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toDate(value: unknown) {
  const parsed = new Date(String(value || ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hoursSince(value: unknown) {
  const d = toDate(value);
  if (!d) return Number.POSITIVE_INFINITY;
  return (Date.now() - d.getTime()) / 36e5;
}

function queueFromThread(thread: Record<string, unknown>): SupportQueue {
  const metadata = (thread.metadata as Record<string, unknown> | null) || null;
  const triageQueue = String(metadata?.triage_queue || "").toLowerCase();
  if (triageQueue === "finance" || triageQueue === "trust") return triageQueue;
  const category = String(thread.category || "").toLowerCase();
  if (category.includes("billing") || category.includes("wallet")) return "finance";
  if (category.includes("verify") || category.includes("kyc")) return "trust";
  return "general";
}

export async function getStaffIntelligenceSnapshot(allowedDivisions?: WorkspaceDivision[]) {
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  const admin = createStaffAdminSupabase();
  const divisionFilter = (allowedDivisions ?? []).filter(Boolean);
  const hasDivisionFilter = divisionFilter.length > 0;

  const supportQuery = admin
    .from("support_threads")
    .select("id, division, category, subject, status, priority, updated_at, metadata")
    .not("status", "in", "(resolved,closed)")
    .order("updated_at", { ascending: false })
    .limit(120);
  const notificationQuery = admin
    .from("customer_notifications")
    .select("id, division, title, category, priority, is_read, created_at")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(120);
  if (hasDivisionFilter) {
    supportQuery.in("division", divisionFilter);
    notificationQuery.in("division", divisionFilter);
  }

  const [supportRes, notificationsRes, securityRes] = await Promise.all([
    supportQuery,
    notificationQuery,
    admin
      .from("customer_security_log")
      .select("id, user_id, event_type, risk_level, created_at")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const support = (supportRes.data ?? []) as Array<Record<string, unknown>>;
  const notifications = (notificationsRes.data ?? []) as Array<Record<string, unknown>>;
  const security = (securityRes.data ?? []) as Array<Record<string, unknown>>;

  const tasks: WorkspaceTask[] = support.slice(0, 30).map((thread) => {
    const stale = hoursSince(thread.updated_at) >= 12;
    const priority = String(thread.priority || "normal").toLowerCase();
    const queue = queueFromThread(thread);
    const title = toText(thread.subject) || "Support thread";
    const status = stale ? "stale" : priority === "high" || priority === "urgent" ? "at_risk" : "active";
    return {
      id: `support:${toText(thread.id)}`,
      division: (toText(thread.division).toLowerCase() as WorkspaceTask["division"]) || "care",
      title,
      summary: `${toText(thread.category) || "general"} · ${toText(thread.status) || "open"}`,
      queue: `support-${queue}`,
      href: "/support",
      status,
      priority: stale ? 95 : priority === "high" || priority === "urgent" ? 85 : 65,
      suggestedAction:
        queue === "finance"
          ? "Confirm payment state and respond to customer."
          : queue === "trust"
            ? "Review verification evidence and decide next step."
            : "Respond and keep conversation moving.",
      evidence: [
        `Queue: ${queue}`,
        `Updated ${Math.round(hoursSince(thread.updated_at))}h ago`,
      ],
      createdAt: toText(thread.updated_at) || new Date().toISOString(),
    };
  });

  const riskAlerts = security
    .filter((row) => ["high", "medium"].includes(toText(row.risk_level).toLowerCase()))
    .slice(0, 20);

  return {
    flags,
    metrics: {
      openSupport: support.length,
      staleSupport: support.filter((thread) => hoursSince(thread.updated_at) >= 12).length,
      unreadNotifications: notifications.length,
      elevatedRisk: riskAlerts.length,
    },
    tasks: tasks.sort((a, b) => b.priority - a.priority),
    support,
    notifications,
    riskAlerts,
  };
}

