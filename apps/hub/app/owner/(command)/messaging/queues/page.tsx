import { AlertTriangle, CheckCircle, Clock, Mail, MessageSquare, XCircle } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import DivisionBadge from "@/components/owner/DivisionBadge";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { getMessagingCenterData } from "@/lib/owner-data";
import { formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function MessagingQueuesPage() {
  const [data, locale] = await Promise.all([getMessagingCenterData(), getHubPublicLocale()]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  const failed = data.queues.filter((r) => r.status.toLowerCase() === "failed");
  const skipped = data.queues.filter((r) => r.status.toLowerCase() === "skipped");
  const sent = data.queues.filter((r) => r.status.toLowerCase() === "sent");
  const queued = data.queues.filter(
    (r) => !["failed", "skipped", "sent"].includes(r.status.toLowerCase()),
  );
  const actionable = [...failed, ...skipped];

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Delivery Queues")}
        title={t("Email and WhatsApp queue diagnostics")}
        description={t("Delivery health across care and marketplace notification channels. Failed and skipped deliveries need attention; the rest show pipeline throughput.")}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label={t("Failed")}
          value={data.metrics.failed}
          icon={XCircle}
          tone={data.metrics.failed > 0 ? "critical" : "neutral"}
        />
        <StatCard
          label={t("Skipped")}
          value={data.metrics.skipped}
          icon={AlertTriangle}
          tone={data.metrics.skipped > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label={t("Sent")}
          value={data.metrics.sent}
          icon={CheckCircle}
          tone="good"
        />
        <StatCard
          label={t("Queued")}
          value={queued.length}
          icon={Clock}
          tone="neutral"
        />
      </div>

      {actionable.length > 0 ? (
        <OwnerPanel
          title={t("Needs attention")}
          description={`${actionable.length} ${t("failed or skipped deliveries — these recipients did not receive their notification.")}`}
        >
          <QueueTable rows={actionable} t={t} />
        </OwnerPanel>
      ) : (
        <OwnerNotice
          tone="good"
          title={t("No delivery failures")}
          body={t("All recent notification attempts completed successfully or are still queued.")}
        />
      )}

      {sent.length > 0 ? (
        <OwnerPanel
          title={t("Confirmed deliveries")}
          description={`${sent.length} ${t("notifications confirmed sent this window.")}`}
        >
          <QueueTable rows={sent.slice(0, 40)} t={t} />
          {sent.length > 40 ? (
            <p className="mt-3 text-xs text-[var(--acct-muted)]">
              {t("Showing 40 of")} {sent.length} {t("sent rows.")}
            </p>
          ) : null}
        </OwnerPanel>
      ) : null}

      {queued.length > 0 ? (
        <OwnerPanel
          title={t("In queue")}
          description={`${queued.length} ${t("notifications still in the pipeline.")}`}
        >
          <QueueTable rows={queued.slice(0, 20)} t={t} />
        </OwnerPanel>
      ) : null}

      {data.queues.length === 0 ? (
        <OwnerNotice
          tone="info"
          title={t("Queue is empty")}
          body={t("No notification queue rows have been observed yet. They appear here once care or marketplace notifications are triggered.")}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "critical" | "warning" | "good" | "neutral";
}) {
  const colors = {
    critical: "text-[var(--acct-red-text)] bg-[var(--acct-red-soft)]",
    warning: "text-[var(--acct-orange-text)] bg-[var(--acct-bg-soft)]",
    good: "text-[var(--acct-green-text)] bg-[var(--acct-bg-soft)]",
    neutral: "text-[var(--acct-muted)] bg-[var(--acct-bg-soft)]",
  };
  return (
    <div
      className={`flex items-center gap-3 rounded-[1.2rem] border border-[var(--acct-line)] px-4 py-3 ${tone === "critical" || tone === "warning" ? colors[tone] : "bg-[var(--acct-bg-soft)]"}`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          tone === "critical"
            ? "text-[var(--acct-red-text)]"
            : tone === "warning"
              ? "text-[var(--acct-orange-text)]"
              : tone === "good"
                ? "text-[var(--acct-green-text)]"
                : "text-[var(--acct-muted)]"
        }`}
      />
      <div>
        <p className="text-xl font-semibold tabular-nums text-[var(--acct-ink)]">{value}</p>
        <p className="text-xs text-[var(--acct-muted)]">{label}</p>
      </div>
    </div>
  );
}

function QueueTable({
  rows,
  t,
}: {
  rows: Array<{
    id: string;
    subject: string;
    division: string;
    channel: string;
    status: string;
    recipient: string;
    error?: string;
    updatedAt: string | null;
  }>;
  t: (s: string) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="owner-table">
        <thead>
          <tr>
            <th>{t("Subject")}</th>
            <th>{t("Channel")}</th>
            <th>{t("Division")}</th>
            <th>{t("Status")}</th>
            <th>{t("Recipient")}</th>
            <th>{t("Updated")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="max-w-[min(220px,22vw)] truncate">{row.subject}</td>
              <td>
                <span className="inline-flex items-center gap-1 text-xs">
                  {row.channel.toLowerCase().includes("whatsapp") ? (
                    <MessageSquare className="h-3.5 w-3.5 text-[var(--acct-green-text)]" aria-hidden />
                  ) : (
                    <Mail className="h-3.5 w-3.5 text-[var(--acct-muted)]" aria-hidden />
                  )}
                  {row.channel}
                </span>
              </td>
              <td>
                <DivisionBadge division={row.division} />
              </td>
              <td>
                <StatusBadge status={row.status} />
                {row.error ? (
                  <p className="mt-0.5 text-[10px] text-[var(--acct-red-text)] line-clamp-1" title={row.error}>
                    {row.error}
                  </p>
                ) : null}
              </td>
              <td className="font-mono text-xs text-[var(--acct-muted)]">{row.recipient}</td>
              <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                {row.updatedAt ? formatDateTime(row.updatedAt) : t("Unknown")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
