import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Lock,
  Mail,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import WhatsAppHealthConsole from "@/components/owner/WhatsAppHealthConsole";
import ConfirmButton from "@/components/feedback/ConfirmButton";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { getSecurityLogs, type SecurityLogRow } from "@/lib/admin/care-admin";
import { reconcileStaffDirectory } from "@/lib/auth/staff-identity";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { getWhatsAppHealthStatus } from "@/lib/support/whatsapp-health";
import { getWhatsAppDiagnostics } from "@/lib/support/whatsapp-observability";
import {
  clearStaffReauthAction,
  forceStaffReauthAction,
  setStaffArchivedAction,
  setStaffFrozenAction,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Security | Henry & Co. Fabric Care",
  description:
    "Owner audit surface for access activity, transport health, freeze controls, and staff security posture.",
};

type NotificationRow = {
  id: string;
  template_key: string;
  recipient: string;
  subject: string;
  status: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type TransportRow = {
  id: string;
  event_type: string;
  email: string | null;
  success: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase admin env vars.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(value?: string | null) {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function shortUA(ua?: string | null) {
  const value = String(ua || "").trim();
  if (!value) return "—";
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

function deviceTypeFromUA(ua?: string | null) {
  const value = String(ua || "").toLowerCase();
  if (!value) return "Unknown device";
  if (/iphone|ipad|android|mobile/.test(value)) return "Mobile";
  if (/windows|macintosh|linux|x11/.test(value)) return "Desktop";
  return "Other";
}

function roleTone(role?: string | null) {
  const key = String(role || "customer").toLowerCase();

  if (key === "owner") return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
  if (key === "manager") return "border-blue-300/30 bg-blue-500/10 text-blue-700 dark:text-blue-100";
  if (key === "rider") return "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100";
  if (key === "support") return "border-purple-300/30 bg-purple-500/10 text-purple-700 dark:text-purple-100";

  return "border-zinc-300/50 bg-zinc-500/10 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70";
}

function eventTone(success: boolean) {
  return success
    ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
    : "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
}

function notificationTone(status?: string | null) {
  const key = String(status || "").toLowerCase();
  if (key === "sent") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100";
  }
  if (key === "failed") {
    return "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100";
  }
  return "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100";
}

function matchesQuery(value: unknown, q: string) {
  if (!q) return true;
  return JSON.stringify(value).toLowerCase().includes(q.toLowerCase());
}

function formatEventLabel(value?: string | null) {
  const text = String(value || "").trim().replaceAll("_", " ");
  return text || "event";
}

function summarizeLocation(row: Pick<SecurityLogRow, "ip_address" | "city" | "country">) {
  return [row.ip_address, row.city, row.country].filter(Boolean).join(" • ") || "—";
}

function extractTarget(row: SecurityLogRow) {
  const details = (row.details || {}) as Record<string, unknown>;

  return (
    String(
      details.target_email ||
        details.target_user_id ||
        details.booking_id ||
        details.expense_id ||
        details.review_id ||
        details.payment_request_id ||
        details.source_id ||
        ""
    ).trim() || "—"
  );
}

function logMatchesRole(
  row: {
    role?: string | null;
    actor_role?: string | null;
  },
  roleFilter: string
) {
  if (!roleFilter) return true;
  const role = String(row.role || "").toLowerCase();
  const actorRole = String(row.actor_role || "").toLowerCase();
  return role === roleFilter || actorRole === roleFilter;
}

function logMatchesEvent(row: Pick<SecurityLogRow, "event_type">, eventFilter: string) {
  if (!eventFilter) return true;
  return String(row.event_type || "").toLowerCase() === eventFilter;
}

async function getNotificationRows(): Promise<NotificationRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_notification_queue")
      .select("id, template_key, recipient, subject, status, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    return (data || []) as NotificationRow[];
  } catch {
    return [];
  }
}

async function getTransportRows(): Promise<TransportRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_security_logs")
      .select("id, event_type, email, success, details, created_at")
      .order("created_at", { ascending: false })
      .limit(180);

    return (data || []) as TransportRow[];
  } catch {
    return [];
  }
}

function transportSummary(row?: TransportRow | null) {
  if (!row) return "—";
  const details = (row.details || {}) as Record<string, unknown>;
  return (
    String(
      details.whatsapp_response_summary ||
        details.whatsapp_reason ||
        details.reason ||
        details.signal_title ||
        ""
    ).trim() || "No additional provider detail was captured."
  );
}

export default async function OwnerSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    role?: string;
    event?: string;
  }>;
}) {
  const auth = await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/security");

  const params = (await searchParams) ?? {};
  const q = String(params.q || "").trim();
  const success = String(params.success || "all").trim() as "all" | "success" | "failed";
  const roleFilter = String(params.role || "").trim().toLowerCase();
  const eventFilter = String(params.event || "").trim().toLowerCase();

  const [directory, logs, notifications, whatsapp, transportRows, whatsappDiagnostics] = await Promise.all([
    reconcileStaffDirectory(),
    getSecurityLogs({
      q,
      success,
      limit: 250,
    }),
    getNotificationRows(),
    getWhatsAppHealthStatus(),
    getTransportRows(),
    getWhatsAppDiagnostics(24),
  ]);

  const filteredStaff = directory.rows
    .filter((row) => (roleFilter ? String(row.role || "").toLowerCase() === roleFilter : true))
    .filter((row) => matchesQuery(row, q));

  const filteredLogs = logs
    .filter((row) => logMatchesRole(row, roleFilter))
    .filter((row) => logMatchesEvent(row, eventFilter))
    .filter((row) => matchesQuery(row, q));

  const suspicious = filteredLogs.filter(
    (row) =>
      !row.success ||
      String(row.event_type).toLowerCase().includes("failed") ||
      String(row.event_type).toLowerCase().includes("blocked") ||
      String(row.event_type).toLowerCase().includes("denied")
  );

  const failedAuth = filteredLogs.filter(
    (row) =>
      String(row.event_type).toLowerCase().includes("login") &&
      !row.success
  ).length;

  const emailSent = notifications.filter((row) => String(row.status).toLowerCase() === "sent").length;
  const emailQueued = notifications.filter((row) => String(row.status).toLowerCase() === "queued").length;
  const emailFailed = notifications.filter((row) => String(row.status).toLowerCase() === "failed").length;

  const eventOptions = Array.from(
    new Set(logs.map((row) => String(row.event_type || "").toLowerCase()).filter(Boolean))
  ).sort();

  const emailConfigured = Boolean(String(process.env.BREVO_API_KEY || "").trim());
  const whatsappStatus = String(whatsapp.phone?.status || "unknown").toUpperCase();
  const ownerAlertEmail = String(process.env.OWNER_ALERT_EMAIL || "").trim() || "Fallback to owner role recipients";
  const ownerAlertWhatsApp = String(process.env.OWNER_ALERT_WHATSAPP || "").trim() || "Not configured";
  const recentOwnerAlerts = transportRows.filter((row) =>
    ["owner_alert_email_sent", "owner_alert_email_failed", "owner_alert_whatsapp_sent", "owner_alert_whatsapp_failed", "owner_digest_sent", "owner_digest_failed"].includes(
      String(row.event_type || "").toLowerCase()
    )
  );
  const recentWhatsAppActivity = transportRows.filter((row) => {
    const details = (row.details || {}) as Record<string, unknown>;
    return Boolean(String(details.whatsapp_status || "").trim()) || String(row.event_type || "").toLowerCase().includes("whatsapp");
  });
  const lastWhatsAppSuccess =
    recentWhatsAppActivity.find((row) => {
      const details = (row.details || {}) as Record<string, unknown>;
      return String(details.whatsapp_status || "").toLowerCase() === "sent" || String(row.event_type || "").toLowerCase().endsWith("_whatsapp_sent");
    }) ?? null;
  const lastWhatsAppFailure =
    recentWhatsAppActivity.find((row) => {
      const details = (row.details || {}) as Record<string, unknown>;
      return String(details.whatsapp_status || "").toLowerCase() === "failed" || String(row.event_type || "").toLowerCase().endsWith("_whatsapp_failed");
    }) ?? null;

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Owner security center
        </div>
        <h1 className="mt-2 text-4xl font-black text-zinc-950 dark:text-white sm:text-5xl">
          Audit real access, transport, and account state.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          This surface now combines login visibility, sensitive-action logs, mail transport health,
          and direct account controls so the owner can see what changed, who triggered it, and what still needs intervention.
        </p>

        {!emailConfigured ? (
          <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
            Production mail transport is not armed on this deployment yet. Transactional emails are being queued,
            but live external delivery still requires `BREVO_API_KEY` in the Care Vercel project.
          </div>
        ) : null}
      </section>

      <section className="flex flex-wrap gap-2">
        {[
          ["Overview", "#overview"],
          ["Transport", "#transport"],
          ["Filters", "#filters"],
          ["Signals", "#signals"],
          ["Audit", "#audit"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm transition hover:border-[color:var(--accent)]/30 hover:text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
          >
            {label}
          </Link>
        ))}
      </section>

      <section id="overview" className="scroll-mt-28 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Metric icon={Activity} label="Logged events" value={filteredLogs.length} note="Filtered security stream" />
        <Metric icon={ShieldAlert} label="Suspicious" value={suspicious.length} note="Blocked, failed, or denied" />
        <Metric icon={Lock} label="Frozen staff" value={filteredStaff.filter((x) => x.is_frozen).length} note="Blocked from normal access" />
        <Metric icon={Clock3} label="Reauth pending" value={filteredStaff.filter((x) => x.force_reauth_after).length} note="Fresh sign-in required" />
        <Metric icon={AlertTriangle} label="Failed auth" value={failedAuth} note="Recent login friction" />
        <Metric icon={Mail} label="Queued mail" value={emailQueued} note={`${emailSent} sent / ${emailFailed} failed`} />
      </section>

      <section id="transport" className="scroll-mt-28 grid gap-6 2xl:grid-cols-[0.96fr_1.04fr]">
        <Panel
          eyebrow="Meta WhatsApp"
          title="Cloud sender health"
          subtitle="This now shows the real configured sender state and lets the owner run refresh, registration, and probe actions directly."
        >
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoTile label="Readiness" value={whatsapp.readiness.replaceAll("_", " ")} />
              <InfoTile label="Phone status" value={whatsappStatus || "UNKNOWN"} />
              <InfoTile
                label="Display number"
                value={String(whatsapp.phone?.display_phone_number || "Not resolved")}
              />
              <InfoTile
                label="WABA review"
                value={String(whatsapp.businessAccount?.account_review_status || "Unknown")}
              />
              <InfoTile
                label="Last WhatsApp success"
                value={lastWhatsAppSuccess ? relativeTime(lastWhatsAppSuccess.created_at) : "No success logged yet"}
                note={transportSummary(lastWhatsAppSuccess)}
              />
              <InfoTile
                label="Last WhatsApp error"
                value={lastWhatsAppFailure ? relativeTime(lastWhatsAppFailure.created_at) : "No recent provider error"}
                note={transportSummary(lastWhatsAppFailure)}
              />
            </div>

            <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Environment presence
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <InfoTile
                  label="Access token"
                  value={whatsapp.environment.accessTokenConfigured ? "Configured" : "Missing"}
                />
                <InfoTile
                  label="Phone number ID"
                  value={whatsapp.environment.phoneNumberIdConfigured ? "Configured" : "Missing"}
                />
                <InfoTile
                  label="Business account ID"
                  value={whatsapp.environment.businessAccountIdConfigured ? "Configured" : "Missing"}
                />
                <InfoTile
                  label="Registration PIN"
                  value={whatsapp.environment.registrationPinConfigured ? "Configured" : "Missing"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Current blockers
                </div>
                <div className="mt-3 grid gap-2">
                  {whatsapp.blockers.length > 0 ? (
                    whatsapp.blockers.map((blocker) => (
                      <div
                        key={blocker}
                        className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm leading-7 text-red-700 dark:text-red-100"
                      >
                        {blocker}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm leading-7 text-emerald-700 dark:text-emerald-100">
                      No active blockers. The Meta sender is currently ready.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Operational notes
                </div>
                <div className="mt-3 grid gap-2">
                  {whatsapp.notes.length > 0 ? (
                    whatsapp.notes.map((note) => (
                      <div
                        key={note}
                        className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm leading-7 text-amber-700 dark:text-amber-100"
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
                      No additional Meta notes were returned for this sender.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <WhatsAppHealthConsole initialStatus={whatsapp} initialDiagnostics={whatsappDiagnostics} />
          </div>
        </Panel>

        <Panel
          eyebrow="Notification rail"
          title="Email transport and owner alerting"
          subtitle="Recent transactional dispatches, env-backed owner targets, and the latest executive alert history."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={Mail} label="Sent" value={emailSent} note="Delivered through the active email transport" />
            <Metric icon={Clock3} label="Queued" value={emailQueued} note="Waiting for transport or retry" />
            <Metric icon={AlertTriangle} label="Failed" value={emailFailed} note="Needs owner or provider attention" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoTile label="Owner alert email" value={ownerAlertEmail} />
            <InfoTile label="Owner alert WhatsApp" value={ownerAlertWhatsApp} />
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
              Recent owner alert activity
            </div>
            <div className="mt-3 grid gap-3">
              {recentOwnerAlerts.length > 0 ? (
                recentOwnerAlerts.slice(0, 8).map((row) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-black/10 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${eventTone(row.success)}`}>
                        {row.success ? "sent" : "failed"}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                        {formatEventLabel(row.event_type)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-zinc-800 dark:text-white/78">
                      {transportSummary(row)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                      {row.email || "WhatsApp target"} • {formatDateTime(row.created_at)}
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState text="No owner alerts have been dispatched yet from the current automation sweep." />
              )}
            </div>
          </div>

          <div className="mt-5 grid max-h-[28rem] gap-3 overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.slice(0, 18).map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${notificationTone(row.status)}`}>
                      {row.status}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                      {row.template_key}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                    {row.subject}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-zinc-500 dark:text-white/45">
                    {row.recipient} • {formatDateTime(row.created_at)}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No notification records are available right now." />
            )}
          </div>
        </Panel>
      </section>

      <section id="filters" className="scroll-mt-28 rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <form className="grid gap-4 2xl:grid-cols-[1.15fr_0.7fr_0.7fr_0.9fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by actor, IP, route, event, recipient, booking, review, or device..."
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          />

          <select
            name="role"
            defaultValue={roleFilter}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="rider">Rider</option>
            <option value="support">Support</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>

          <select
            name="success"
            defaultValue={success}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="all">All outcomes</option>
            <option value="success">Successful only</option>
            <option value="failed">Failed only</option>
          </select>

          <select
            name="event"
            defaultValue={eventFilter}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
          >
            <option value="">All event types</option>
            {eventOptions.map((event) => (
              <option key={event} value={event}>
                {formatEventLabel(event)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 text-sm font-semibold text-[#07111F]"
          >
            Filter
          </button>
        </form>
      </section>

      <section id="signals" className="scroll-mt-28 grid gap-8 2xl:grid-cols-[1.02fr_0.98fr]">
        <Panel
          eyebrow="Risk lane"
          title="Priority security signals"
          subtitle="The events that deserve owner attention first."
        >
          <div className="grid max-h-[min(52rem,65vh)] gap-4 overflow-y-auto pr-1">
            {suspicious.length > 0 ? (
              suspicious.slice(0, 24).map((row) => (
                <article
                  key={row.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${eventTone(row.success)}`}>
                      {row.success ? "success" : "failed"}
                    </span>
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                      {formatEventLabel(row.event_type)}
                    </span>
                    {(row.actor_role || row.role) ? (
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${roleTone(row.actor_role || row.role)}`}>
                        {row.actor_role || row.role}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoTile label="When" value={`${formatDateTime(row.created_at)} • ${relativeTime(row.created_at)}`} />
                    <InfoTile label="Target" value={extractTarget(row)} />
                    <InfoTile label="Route" value={row.route || "—"} />
                    <InfoTile label="Location" value={summarizeLocation(row)} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/10 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                      <Smartphone className="h-4 w-4 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
                      Device / user-agent
                    </div>
                    <div className="mt-2 text-sm text-zinc-800 dark:text-white/80">
                      {shortUA(row.user_agent)}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No suspicious events matched the current filter." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Staff controls"
          title="Freeze, archive, or force reauth"
          subtitle="Live account controls backed by the same role/auth model the dashboards use."
        >
          <div className="grid max-h-[min(52rem,65vh)] gap-4 overflow-y-auto pr-1">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => {
                const isSelf = member.id === auth.profile.id;

                return (
                  <article
                    key={member.id}
                    className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                        {member.full_name || "Unnamed profile"}
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${roleTone(member.role)}`}>
                        {member.role || "staff"}
                      </span>

                      {member.is_frozen ? (
                        <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                          frozen
                        </span>
                      ) : null}

                      {member.is_archived ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          archived
                        </span>
                      ) : null}

                      {member.force_reauth_after ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          reauth pending
                        </span>
                      ) : null}

                      {!member.profile_exists ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          profile missing
                        </span>
                      ) : null}

                      {isSelf ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-100">
                          current owner
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoTile label="Email" value={member.email || "—"} />
                      <InfoTile label="Last sign in" value={formatDateTime(member.last_sign_in_at)} />
                      <InfoTile label="State" value={member.is_archived ? "Archived" : member.is_frozen ? "Frozen" : "Active"} />
                      <InfoTile label="Archived at" value={formatDateTime(member.deleted_at)} />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <form action={setStaffFrozenAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="frozen" value={member.is_frozen ? "false" : "true"} />
                        <input type="hidden" name="source_route" value="/owner/security" />
                        <ConfirmButton
                          type="submit"
                          disabled={isSelf || member.is_archived}
                          confirmTitle={member.is_frozen ? "Unfreeze this account?" : "Freeze this account?"}
                          confirmDescription="Freezing blocks workspace access until an owner restores it."
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                            member.is_frozen
                              ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                              : "border border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100"
                          }`}
                        >
                          {member.is_frozen ? "Unfreeze account" : "Freeze account"}
                        </ConfirmButton>
                      </form>

                      <form action={setStaffArchivedAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="archived" value={member.is_archived ? "false" : "true"} />
                        <input type="hidden" name="source_route" value="/owner/security" />
                        <ConfirmButton
                          type="submit"
                          disabled={isSelf}
                          confirmTitle={member.is_archived ? "Restore this archived account?" : "Archive this account?"}
                          confirmDescription={
                            member.is_archived
                              ? "Restoring access clears the archive flag and allows normal sign-in again."
                              : "Archive is the safe-delete model. It blocks access but preserves historical records."
                          }
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                            member.is_archived
                              ? "border border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100"
                              : "border border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                          }`}
                        >
                          {member.is_archived ? "Restore access" : "Archive access"}
                        </ConfirmButton>
                      </form>

                      <form action={forceStaffReauthAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="source_route" value="/owner/security" />
                        <PendingSubmitButton
                          label="Force re-login"
                          pendingLabel="Forcing re-login"
                          disabled={isSelf}
                          variant="secondary"
                          className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-100"
                        />
                      </form>

                      <form action={clearStaffReauthAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="source_route" value="/owner/security" />
                        <PendingSubmitButton
                          label="Clear reauth flag"
                          pendingLabel="Clearing reauth flag"
                          disabled={isSelf}
                          variant="secondary"
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </form>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState text="No staff matched the current filter." />
            )}
          </div>
        </Panel>
      </section>

      <section id="audit" className="scroll-mt-28 grid gap-8 2xl:grid-cols-[1.08fr_0.92fr]">
        <Panel
          eyebrow="Audit stream"
          title="Recent access and sensitive actions"
          subtitle="A denser stream for scanning actor, route, target, and device context."
        >
          <div className="grid max-h-[min(56rem,70vh)] gap-4 overflow-y-auto pr-1">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((row) => (
                <article
                  key={row.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${eventTone(row.success)}`}>
                      {row.success ? "success" : "failed"}
                    </span>
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                      {formatEventLabel(row.event_type)}
                    </span>
                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                      {deviceTypeFromUA(row.user_agent)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="Time" value={`${formatDateTime(row.created_at)} • ${relativeTime(row.created_at)}`} />
                    <InfoTile label="Actor" value={row.email || row.actor_role || row.role || "—"} />
                    <InfoTile label="Target" value={extractTarget(row)} />
                    <InfoTile label="Route" value={row.route || "—"} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Location" value={summarizeLocation(row)} />
                    <InfoTile label="Device signature" value={shortUA(row.user_agent)} />
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No security log entries matched the current filter." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Transport health"
          title="Email queue and delivery status"
          subtitle="Operational visibility for queued, sent, and failed transactional email events."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InfoTile label="Sent" value={String(emailSent)} />
            <InfoTile label="Queued" value={String(emailQueued)} />
            <InfoTile label="Failed" value={String(emailFailed)} />
          </div>

          <div className="mt-5 grid max-h-[min(44rem,55vh)] gap-4 overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.map((row) => {
                const payload = (row.payload || {}) as Record<string, unknown>;
                const reason = String(payload.transport_reason || payload.reason || "").trim();

                return (
                  <article
                    key={row.id}
                    className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${notificationTone(row.status)}`}>
                        {row.status}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        {formatEventLabel(row.template_key)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <InfoTile label="Recipient" value={row.recipient || "—"} />
                      <InfoTile label="Subject" value={row.subject || "—"} />
                      <InfoTile label="Created" value={`${formatDateTime(row.created_at)} • ${relativeTime(row.created_at)}`} />
                    </div>

                    {reason ? (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-white/75 p-4 text-sm leading-6 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75">
                        {reason}
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <EmptyState text="No queued notification records are visible yet." />
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
        <Icon className="h-5 w-5 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45 sm:text-xs">
        {label}
      </div>
      <div className="mt-1 text-3xl font-black text-zinc-950 dark:text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs text-zinc-600 dark:text-white/60 sm:text-sm">{note}</div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-zinc-600 dark:text-white/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function InfoTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 break-words text-sm leading-relaxed text-zinc-800 dark:text-white/80">
        {value}
      </div>
      {note ? <div className="mt-1 text-xs leading-6 text-zinc-500 dark:text-white/50">{note}</div> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-10 text-center text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
      {text}
    </div>
  );
}
