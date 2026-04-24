import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import {
  NEWSLETTER_CAMPAIGN_CLASSES,
  NEWSLETTER_DIVISIONS,
  describeTopicGroupings,
  type NewsletterCampaignStatus,
} from "@henryco/newsletter";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import {
  StaffEmptyState,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";
import { getCampaign } from "@/lib/newsletter/service";
import NewsletterDraftEditor from "../NewsletterDraftEditor";

export const dynamic = "force-dynamic";

function statusTone(
  status: NewsletterCampaignStatus
): "info" | "success" | "warning" | "critical" {
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
    default:
      return "info";
  }
}

export default async function NewsletterCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const viewer = await requireStaff();
  const canView =
    viewerHasAnyFamily(viewer, [
      "content_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) && viewerHasPermission(viewer, "division.read");

  if (!canView) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Newsletter" title="Campaign" />
        <StaffEmptyState
          icon={Mail}
          title="Access restricted"
          description="Newsletter access is limited to content, manager, supervisor, and system_admin roles."
        />
      </div>
    );
  }

  const { campaign, events, sendSummary } = await getCampaign(resolved.id);
  if (!campaign) return notFound();

  const groups = describeTopicGroupings();
  const canEdit =
    viewerHasAnyFamily(viewer, [
      "content_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) && viewerHasPermission(viewer, "division.write");
  const canApprove = viewerHasAnyFamily(viewer, [
    "division_manager",
    "supervisor",
    "system_admin",
  ]);

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Newsletter"
        title={campaign.content?.subject || campaign.key}
        description="Campaign lifecycle, voice guard warnings, and per-recipient send results."
        actions={
          <StaffStatusBadge label={campaign.status} tone={statusTone(campaign.status)} />
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StaffPanel title="Voice score">
          <p className="text-2xl font-semibold text-[var(--staff-ink)]">
            {campaign.voice_guard_score ?? "—"}
          </p>
          <p className="text-xs text-[var(--staff-muted)]">higher is better (100 max)</p>
        </StaffPanel>
        <StaffPanel title="Sent">
          <p className="text-2xl font-semibold text-[var(--staff-ink)]">{sendSummary.sent}</p>
          <p className="text-xs text-[var(--staff-muted)]">delivered/engaged records</p>
        </StaffPanel>
        <StaffPanel title="Skipped">
          <p className="text-2xl font-semibold text-[var(--staff-ink)]">{sendSummary.skipped}</p>
          <p className="text-xs text-[var(--staff-muted)]">suppressed or paused subscribers</p>
        </StaffPanel>
        <StaffPanel title="Failed">
          <p className="text-2xl font-semibold text-[var(--staff-ink)]">{sendSummary.failed}</p>
          <p className="text-xs text-[var(--staff-muted)]">provider errors</p>
        </StaffPanel>
      </div>

      {canEdit ? (
        <StaffPanel title="Editor">
          <NewsletterDraftEditor
            mode="edit"
            campaignId={campaign.id}
            initialDivision={campaign.division}
            initialCampaignClass={campaign.campaign_class}
            initialTopicKeys={campaign.topic_keys ?? []}
            initialContent={campaign.content}
            initialStatus={campaign.status}
            divisions={Array.from(NEWSLETTER_DIVISIONS)}
            campaignClasses={Array.from(NEWSLETTER_CAMPAIGN_CLASSES)}
            topicGroups={groups}
            canApprove={canApprove}
            initialScheduledFor={campaign.scheduled_for}
            initialVoiceWarnings={campaign.voice_guard_warnings ?? []}
          />
        </StaffPanel>
      ) : null}

      <StaffPanel title="Editorial audit log" className="mt-6">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--staff-muted)]">No events logged yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StaffStatusBadge
                    label={event.kind}
                    tone={
                      event.kind === "voice_guard_triggered"
                        ? "critical"
                        : event.kind === "approved" || event.kind === "send_completed"
                          ? "success"
                          : "info"
                    }
                  />
                  <span className="ml-auto text-[0.65rem] uppercase tracking-[0.14em] text-[var(--staff-muted)]">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                {event.note ? (
                  <p className="mt-2 text-sm text-[var(--staff-ink)]">{event.note}</p>
                ) : null}
                {event.payload && Object.keys(event.payload).length > 0 ? (
                  <pre className="mt-2 overflow-auto rounded bg-[var(--staff-surface-muted)] px-3 py-2 text-[0.7rem] text-[var(--staff-muted)]">
                    {JSON.stringify(event.payload, null, 2).slice(0, 800)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
