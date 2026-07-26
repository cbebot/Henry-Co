import Link from "next/link";
import { AlertTriangle, CheckCircle, Shield, UserCheck, XCircle } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import { getSecurityCenterData } from "@/lib/owner-data";
import { formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function OwnerSecurityPage() {
  const [data, locale] = await Promise.all([getSecurityCenterData(), getHubPublicLocale()]);
  const t = (s: string) => translateSurfaceLabel(locale, s);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Security")}
        title={t("Security and privilege health")}
        description={t("Owner identities, suspended accounts, risky privilege events, and the full staff audit tail — everything needed to verify the platform's access posture.")}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t("Owner profiles")} value={data.metrics.owners} icon={Shield} tone="neutral" />
        <StatCard label={t("Active owners")} value={data.metrics.activeOwners} icon={UserCheck} tone="good" />
        <StatCard label={t("Suspended staff")} value={data.metrics.suspendedUsers} icon={XCircle} tone={data.metrics.suspendedUsers > 0 ? "warning" : "neutral"} />
        <StatCard label={t("Risky events")} value={data.metrics.riskyEvents} icon={AlertTriangle} tone={data.metrics.riskyEvents > 5 ? "critical" : "neutral"} />
      </div>

      {data.metrics.riskyEvents > 0 ? (
        <OwnerNotice
          tone={data.metrics.riskyEvents > 5 ? "warning" : "info"}
          title={`${data.metrics.riskyEvents} ${t("privilege-sensitive events in audit log")}`}
          body={t("Permission, role, security, and owner-keyword events are shown below. Review any unexpected entries.")}
          action={
            <Link
              href="/owner/settings/audit?view=risk"
              className="text-xs font-semibold text-[var(--owner-accent)]"
            >
              {t("Open full audit log →")}
            </Link>
          }
        />
      ) : null}

      <OwnerPanel
        title={t("Owner profiles")}
        description={t("Active owner accounts — each grants platform-wide access.")}
      >
        {data.ownerProfiles.length === 0 ? (
          <p className="text-sm text-[var(--acct-muted)]">{t("No owner profiles found.")}</p>
        ) : (
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Identity")}</th>
                <th>{t("Role")}</th>
                <th>{t("Active")}</th>
                <th>{t("Added")}</th>
              </tr>
            </thead>
            <tbody>
              {data.ownerProfiles.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-medium text-[var(--acct-ink)]">
                      {row.fullName || row.email || t("Unknown")}
                    </div>
                    {row.email && row.fullName ? (
                      <div className="text-xs text-[var(--acct-muted)]">{row.email}</div>
                    ) : null}
                    <div className="font-mono text-[0.6rem] text-[var(--acct-muted)]" title={row.userId}>
                      {row.userId.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="capitalize">{row.role}</td>
                  <td>
                    {row.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--acct-green-text)]">
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                        {t("Active")}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--acct-muted)]">{t("Inactive")}</span>
                    )}
                  </td>
                  <td className="text-sm text-[var(--acct-muted)]">
                    {row.createdAt ? formatDateTime(row.createdAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OwnerPanel>

      {data.riskyAuditEvents.length > 0 ? (
        <OwnerPanel
          title={t("Risky privilege events")}
          description={t("Permission, role, security, and owner-keyword events from the merged staff and platform audit logs.")}
          action={
            <Link href="/owner/settings/audit?view=risk" className="acct-button-ghost text-xs">
              {t("Full audit log")}
            </Link>
          }
        >
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Source")}</th>
                <th>{t("Action")}</th>
                <th>{t("Entity")}</th>
                <th>{t("When")}</th>
              </tr>
            </thead>
            <tbody>
              {data.riskyAuditEvents.map((row, idx) => {
                const src = String(row._source || row.source || "platform");
                const rowId = String(row.id || "");
                const canDrill = Boolean(rowId && (src === "staff" || src === "platform"));
                return (
                  <tr key={`${String(row.id)}-${idx}`}>
                    <td className="text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                      {src}
                    </td>
                    <td>{String(row.action || row.event_type || "Audit event").replace(/[._-]+/g, " ")}</td>
                    <td className="max-w-[min(200px,20vw)] truncate text-xs text-[var(--acct-muted)]">
                      {String(row.entity || row.entity_id || "—")}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                      {String(row.created_at || "")}
                    </td>
                    {canDrill ? (
                      <td>
                        <Link
                          href={`/owner/settings/audit/${src}/${rowId}`}
                          className="text-[11px] font-semibold text-[var(--owner-accent)]"
                        >
                          {t("Detail")}
                        </Link>
                      </td>
                    ) : (
                      <td />
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </OwnerPanel>
      ) : null}

      {data.metrics.pendingInvites > 0 ? (
        <OwnerNotice
          tone="info"
          title={`${data.metrics.pendingInvites} ${t("pending staff invites")}`}
          body={t("These staff accounts have not yet accepted their invitation or completed setup.")}
          action={
            <Link href="/owner/staff" className="text-xs font-semibold text-[var(--owner-accent)]">
              {t("Review workforce →")}
            </Link>
          }
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
  return (
    <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${
            tone === "critical"
              ? "text-[var(--acct-red-text)]"
              : tone === "warning"
                ? "text-[var(--acct-orange-text)]"
                : tone === "good"
                  ? "text-[var(--acct-green-text)]"
                  : "text-[var(--acct-muted)]"
          }`}
          aria-hidden
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">{value}</p>
    </div>
  );
}
