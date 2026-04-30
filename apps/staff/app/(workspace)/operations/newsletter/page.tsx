import Link from "next/link";
import { Mail, PenLine, ShieldAlert, UserCheck } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import type { NewsletterCampaignStatus } from "@henryco/newsletter";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import {
  StaffEmptyState,
  StaffMetricCard,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import {
  listCampaigns,
  subscribersSnapshot,
  suppressionSnapshot,
  type StaffCampaignRow,
} from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

function statusTone(status: NewsletterCampaignStatus): "info" | "success" | "warning" | "critical" {
  switch (status) {
    case "sent":
      return "success";
    case "approved":
    case "scheduled":
    case "sending":
      return "info";
    case "in_review":
    case "changes_requested":
      return "warning";
    case "paused":
    case "cancelled":
    case "archived":
      return "critical";
    case "draft":
    default:
      return "info";
  }
}

function canAccessNewsletterEditorial(viewer: Awaited<ReturnType<typeof requireStaff>>) {
  return (
    viewerHasAnyFamily(viewer, [
      "content_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) && viewerHasPermission(viewer, "division.read")
  );
}

function formatScheduled(row: StaffCampaignRow): string {
  if (row.scheduled_for) return `scheduled ${new Date(row.scheduled_for).toLocaleString()}`;
  if (row.send_completed_at)
    return `sent ${new Date(row.send_completed_at).toLocaleDateString()}`;
  return `updated ${new Date(row.updated_at).toLocaleString()}`;
}

export default async function StaffNewsletterIndexPage() {
  const viewer = await requireStaff();
  if (!canAccessNewsletterEditorial(viewer)) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Newsletter" title="Editorial workspace" />
        <StaffEmptyState
          icon={Mail}
          title="Access restricted"
          description="Newsletter editorial access is limited to content, manager, supervisor, and system_admin roles. Ask Editorial ops if you need access."
        />
      </div>
    );
  }

  const [campaigns, suppression, counts] = await Promise.all([
    listCampaigns(30),
    suppressionSnapshot(10),
    subscribersSnapshot(),
  ]);

  const totalSubscribers =
    Object.values(counts).reduce((acc, n) => acc + n, 0) || 0;
  const totalActive = counts.active ?? 0;

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={20000} />
      <StaffPageHeader
        eyebrow="Newsletter"
        title="Editorial workspace"
        description="Draft, review, approve, and send HenryCo newsletters. Every send is gated by voice guard, consent, and suppression."
        actions={
          <Link
            href="/operations/newsletter/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--staff-gold)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            <PenLine className="h-4 w-4" /> New draft
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaffMetricCard
          label="Active subscribers"
          value={String(totalActive)}
          subtitle={`${totalSubscribers} total records`}
          icon={UserCheck}
        />
        <StaffMetricCard
          label="Unsubscribed"
          value={String(counts.unsubscribed ?? 0)}
          subtitle="Honored — suppressed from marketing sends"
          icon={ShieldAlert}
        />
        <StaffMetricCard
          label="Paused"
          value={String(counts.paused ?? 0)}
          subtitle="Temporarily opted out of promotional sends"
          icon={Mail}
        />
        <StaffMetricCard
          label="Drafts in flight"
          value={String(
            campaigns.filter((c) =>
              ["draft", "in_review", "changes_requested", "approved", "scheduled"].includes(
                c.status
              )
            ).length
          )}
          subtitle="Unsent — in editorial pipeline"
          icon={PenLine}
        />
      </div>

      <StaffPanel title="Campaigns">
        {campaigns.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">
            No campaigns yet. Create a draft to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((row) => (
              <a
                key={row.id}
                href={`/operations/newsletter/${row.id}`}
                className="block rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StaffStatusBadge label={row.status} tone={statusTone(row.status)} />
                  <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {row.campaign_class}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {row.division}
                  </span>
                  <span className="ml-auto text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {formatScheduled(row)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--staff-ink)]">
                  {row.content?.subject || "(no subject)"}
                </p>
                <p className="mt-1 text-xs text-[var(--staff-muted)]">
                  {row.content?.previewText || "(no preview)"}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                  voice score {row.voice_guard_score ?? "—"} · topics {row.topic_keys?.join(", ") || "none"}
                </p>
              </a>
            ))}
          </div>
        )}
      </StaffPanel>

      <StaffPanel title="Recent suppression entries" className="mt-6">
        {suppression.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">No suppression entries yet.</p>
        ) : (
          <div className="space-y-2">
            {(suppression as Array<{
              email: string;
              reason: string;
              scope: string;
              division: string | null;
              note: string | null;
              recorded_at: string;
            }>).map((row) => (
              <div
                key={`${row.email}-${row.reason}-${row.scope}`}
                className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StaffStatusBadge
                    label={row.reason}
                    tone={
                      row.reason === "spam_complaint" || row.reason === "hard_bounce"
                        ? "critical"
                        : row.reason === "unsubscribed"
                          ? "info"
                          : "warning"
                    }
                  />
                  <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    scope: {row.scope}
                  </span>
                  {row.division ? (
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                      division: {row.division}
                    </span>
                  ) : null}
                  <span className="ml-auto text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {new Date(row.recorded_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm font-mono text-[var(--staff-ink)]">{row.email}</p>
                {row.note ? (
                  <p className="mt-1 text-xs text-[var(--staff-muted)]">{row.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
