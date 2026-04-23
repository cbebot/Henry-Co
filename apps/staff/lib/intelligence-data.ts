import "server-only";

import { parseHenryFeatureFlags, type SupportQueue } from "@henryco/intelligence";
import { getDivisionUrl } from "@henryco/config";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { WorkspaceDivision } from "@/lib/types";
import type { WorkspaceTask } from "@/lib/types";

type IntelligenceOptions = {
  includeSecuritySignals?: boolean;
};

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
  const category = String(thread.category || "").toLowerCase();
  const subject = String(thread.subject || "").toLowerCase();
  if (
    category.includes("billing") ||
    category.includes("wallet") ||
    subject.includes("invoice") ||
    subject.includes("refund") ||
    subject.includes("payout")
  ) {
    return "finance";
  }
  if (
    category.includes("verify") ||
    category.includes("kyc") ||
    subject.includes("trust") ||
    subject.includes("fraud") ||
    subject.includes("identity")
  ) {
    return "trust";
  }
  return "general";
}

function withParams(base: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return `${base}${base.includes("?") ? "&" : "?"}${query}`;
}

function supportHrefForThread(thread: Record<string, unknown>, queue: SupportQueue) {
  const division = toText(thread.division).toLowerCase();
  const threadId = toText(thread.id);
  const staffFallback = withParams("/support", {
    division: division || "account",
    queue: `support-${queue}`,
    thread: threadId,
  });

  if (!threadId) return staffFallback;

  if (division === "care") {
    return withParams(`${getDivisionUrl("care")}/support/inbox`, { thread: threadId });
  }
  if (division === "marketplace") {
    return `${getDivisionUrl("marketplace")}/support/${encodeURIComponent(threadId)}`;
  }
  if (division === "studio") return `${getDivisionUrl("studio")}/support/${encodeURIComponent(threadId)}`;
  if (division === "property") {
    return withParams(`${getDivisionUrl("property")}/support`, { thread: threadId });
  }
  if (division === "learn") {
    return withParams(`${getDivisionUrl("learn")}/support`, { thread: threadId });
  }
  if (division === "logistics") {
    return withParams(`${getDivisionUrl("logistics")}/support`, { thread: threadId });
  }

  return staffFallback;
}

function normalizeTaskDivision(value: unknown): WorkspaceTask["division"] {
  const division = toText(value).toLowerCase();

  if (division === "care") return "care";
  if (division === "marketplace") return "marketplace";
  if (division === "studio") return "studio";
  if (division === "jobs") return "jobs";
  if (division === "property") return "property";
  if (division === "learn") return "learn";
  if (division === "logistics") return "logistics";

  return "care";
}

export async function getStaffIntelligenceSnapshot(
  allowedDivisions?: WorkspaceDivision[],
  options: IntelligenceOptions = {}
) {
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  const admin = createStaffAdminSupabase();
  const divisionFilter = (allowedDivisions ?? []).filter(Boolean);
  const hasDivisionFilter = divisionFilter.length > 0;
  const includeSecuritySignals = options.includeSecuritySignals === true;

  const supportQuery = admin
    .from("support_threads")
    .select("id, division, category, subject, status, priority, updated_at, assigned_to")
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
    supportQuery.or(`division.in.(${divisionFilter.join(",")}),division.eq.account,division.is.null`);
    notificationQuery.in("division", divisionFilter);
  }

  const [supportRes, notificationsRes, securityRes] = await Promise.all([
    supportQuery,
    notificationQuery,
    includeSecuritySignals
      ? admin
          .from("customer_security_log")
          .select("id, user_id, event_type, risk_level, created_at")
          .order("created_at", { ascending: false })
          .limit(120)
      : Promise.resolve({ data: [] }),
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
      division: normalizeTaskDivision(thread.division),
      title,
      summary: `${toText(thread.category) || "general"} · ${toText(thread.status) || "open"}`,
      queue: `support-${queue}`,
      href: supportHrefForThread(thread, queue),
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

