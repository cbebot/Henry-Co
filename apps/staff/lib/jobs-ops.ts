import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import type { OpsLink, OpsMetric, OpsQueueItem, OpsTone } from "@/lib/ops-types";

type ActivityRow = {
  id: string;
  user_id: string | null;
  activity_type: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  action_url: string | null;
  created_at: string | null;
};

type SupportRow = {
  id: string;
  category: string | null;
  subject: string | null;
  status: string | null;
  priority: string | null;
  updated_at: string | null;
  assigned_to: string | null;
};

type AuditRow = {
  id: string;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  new_values: Record<string, unknown> | null;
  created_at: string | null;
};

export type JobsOpsSnapshot = {
  summary: string;
  metrics: OpsMetric[];
  recruiterQueue: OpsQueueItem[];
  moderationQueue: OpsQueueItem[];
  alerts: OpsQueueItem[];
  dailyBriefs: string[];
  weeklyBriefs: string[];
  links: OpsLink[];
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hoursSince(value: string | null | undefined) {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return (Date.now() - parsed.getTime()) / 36e5;
}

function humanize(value: string | null | undefined, fallback: string) {
  const normalized = asText(value);
  if (!normalized) return fallback;
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toneForStage(stage: string) {
  const normalized = asText(stage).toLowerCase();
  if (["rejected", "flagged", "failed"].includes(normalized)) return "critical" as const;
  if (["interview", "shortlisted", "under_review", "changes_requested"].includes(normalized)) {
    return "warning" as const;
  }
  if (["verified", "approved", "published", "live", "offer", "hired"].includes(normalized)) {
    return "success" as const;
  }
  return "info" as const;
}

function buildQueueItem(input: {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  ownerRole: string;
  statusLabel: string;
  tone: OpsTone;
  meta?: string | null;
}) {
  return input satisfies OpsQueueItem;
}

export async function getJobsOpsSnapshot(): Promise<JobsOpsSnapshot> {
  const admin = createStaffAdminSupabase();
  const jobsRoot = getDivisionUrl("jobs");
  const [activityRes, supportRes, auditRes] = await Promise.all([
    admin
      .from("customer_activity")
      .select("id, user_id, activity_type, title, description, status, reference_id, metadata, action_url, created_at")
      .eq("division", "jobs")
      .in("activity_type", ["jobs_application", "jobs_post", "jobs_employer_verification"])
      .order("created_at", { ascending: false })
      .limit(160),
    admin
      .from("support_threads")
      .select("id, category, subject, status, priority, updated_at, assigned_to")
      .eq("division", "jobs")
      .not("status", "in", "(resolved,closed)")
      .order("updated_at", { ascending: false })
      .limit(80),
    admin
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, reason, new_values, created_at")
      .or("entity_type.eq.jobs_post,entity_type.eq.jobs_application,entity_type.eq.jobs_alert")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const activityRows = (activityRes.data ?? []) as ActivityRow[];
  const supportRows = (supportRes.data ?? []) as SupportRow[];
  const auditRows = (auditRes.data ?? []) as AuditRow[];

  const applicationRows = activityRows.filter((row) => row.activity_type === "jobs_application");
  const jobRows = activityRows.filter((row) => row.activity_type === "jobs_post");
  const verificationRows = activityRows.filter((row) => row.activity_type === "jobs_employer_verification");

  const recruiterQueue = applicationRows
    .filter((row) => !["rejected", "withdrawn", "hired"].includes(asText(row.status).toLowerCase()))
    .map((row) => {
      const metadata = asObject(row.metadata);
      const candidateName = asText(metadata.candidateName) || asText(row.title) || "Candidate";
      const jobTitle = asText(metadata.jobTitle) || asText(row.description) || "Job application";
      const stage = asText(metadata.stage) || asText(row.status) || "applied";
      return buildQueueItem({
        id: `application-${row.id}`,
        title: `${candidateName} · ${jobTitle}`,
        detail:
          asText(metadata.recruiterNote) ||
          `${humanize(stage, "Applied")} stage still needs recruiter movement.`,
        href: row.user_id ? `${jobsRoot}/recruiter/candidates/${row.user_id}` : `${jobsRoot}/recruiter/pipeline`,
        actionLabel: "Open recruiter workflow",
        ownerRole: "Recruiter",
        statusLabel: humanize(stage, "Applied"),
        tone: toneForStage(stage),
        meta: `${Math.round(hoursSince(asText(metadata.updatedAt) || row.created_at))}h since latest visible movement`,
      });
    })
    .slice(0, 8);

  const recruiterSupport = supportRows
    .filter((row) => asText(row.category).toLowerCase() === "application")
    .map((row) =>
      buildQueueItem({
        id: `support-${row.id}`,
        title: asText(row.subject) || "Application support thread",
        detail: `${humanize(row.status, "Open")} support thread is still unresolved.`,
        href: `${jobsRoot}/recruiter/pipeline`,
        actionLabel: "Inspect pipeline",
        ownerRole: "Recruiter ops",
        statusLabel: humanize(row.priority, "Normal"),
        tone: hoursSince(row.updated_at) >= 12 ? "critical" : "warning",
        meta: `${Math.round(hoursSince(row.updated_at))}h since last support update`,
      })
    )
    .slice(0, 4);

  const moderationQueue = [
    ...jobRows
      .filter((row) => !["approved", "published", "live"].includes(asText(row.status).toLowerCase()))
      .map((row) => {
        const metadata = asObject(row.metadata);
        const moderationStatus =
          asText(metadata.moderationStatus) || asText(row.status) || "under_review";
        return buildQueueItem({
          id: `job-${row.id}`,
          title: asText(metadata.jobTitle) || asText(row.title) || "Job post review",
          detail:
            asText(metadata.moderationDecisionReason) ||
            `${humanize(moderationStatus, "Under review")} post requires moderation action.`,
          href: `${jobsRoot}/recruiter/jobs`,
          actionLabel: "Review job post",
          ownerRole: "Jobs moderation",
          statusLabel: humanize(moderationStatus, "Under review"),
          tone: toneForStage(moderationStatus),
          meta: `${Math.round(hoursSince(asText(metadata.updatedAt) || row.created_at))}h in current state`,
        });
      }),
    ...verificationRows.map((row) => {
      const metadata = asObject(row.metadata);
      const verificationState = asText(metadata.verificationStatus) || asText(row.status) || "submitted";
      return buildQueueItem({
        id: `verification-${row.id}`,
        title: asText(metadata.employerName) || asText(row.title) || "Employer verification",
        detail:
          asText(metadata.reviewNote) ||
          `${humanize(verificationState, "Submitted")} verification still needs a staffing decision.`,
        href: `${jobsRoot}/recruiter/verification`,
        actionLabel: "Review employer verification",
        ownerRole: "Trust / compliance",
        statusLabel: humanize(verificationState, "Submitted"),
        tone: toneForStage(verificationState),
        meta: `${Math.round(hoursSince(asText(metadata.updatedAt) || row.created_at))}h in queue`,
      });
    }),
  ]
    .sort((left, right) => {
      const leftCritical = left.tone === "critical" ? 1 : 0;
      const rightCritical = right.tone === "critical" ? 1 : 0;
      return rightCritical - leftCritical;
    })
    .slice(0, 8);

  const emailFailures = auditRows.filter((row) => asText(row.action).toLowerCase() === "jobs_email_failed");
  const neglectedThreads = supportRows.filter((row) => hoursSince(row.updated_at) >= 12);
  const shortlistWithoutNote = applicationRows.filter((row) => {
    const metadata = asObject(row.metadata);
    return (
      ["shortlisted", "interview"].includes(asText(row.status).toLowerCase()) &&
      !asText(metadata.recruiterNote)
    );
  });

  const alerts: OpsQueueItem[] = [
    ...neglectedThreads.map((row) =>
      buildQueueItem({
        id: `stale-thread-${row.id}`,
        title: asText(row.subject) || "Stale jobs thread",
        detail: "Support or recruiter activity has stalled long enough to threaten candidate experience.",
        href: `${jobsRoot}/recruiter/pipeline`,
        actionLabel: "Recover stalled work",
        ownerRole: "Executive ops",
        statusLabel: `${Math.round(hoursSince(row.updated_at))}h stale`,
        tone: "critical",
      })
    ),
    ...(emailFailures.length
      ? [
          buildQueueItem({
            id: "jobs-alert-email-failures",
            title: `${emailFailures.length} jobs-alert email failures`,
            detail:
              asText(emailFailures[0]?.reason) ||
              "Alert delivery failures are reducing candidate-side trust in the jobs system.",
            href: `${jobsRoot}/owner`,
            actionLabel: "Open owner oversight",
            ownerRole: "Owner",
            statusLabel: "Critical incident",
            tone: "critical",
            meta: asText(emailFailures[0]?.created_at),
          }),
        ]
      : []),
    ...shortlistWithoutNote.slice(0, 3).map((row) => {
      const metadata = asObject(row.metadata);
      return buildQueueItem({
        id: `weak-seriousness-${row.id}`,
        title: asText(metadata.jobTitle) || asText(row.title) || "Shortlist without note",
        detail: "A shortlist move landed without a recruiter note. Owner oversight should treat this as weak execution quality.",
        href: `${jobsRoot}/recruiter/candidates/${row.user_id}`,
        actionLabel: "Inspect recruiter discipline",
        ownerRole: "Owner / recruiter lead",
        statusLabel: "Weak seriousness",
        tone: "warning",
      });
    }),
  ].slice(0, 8);

  const metrics: OpsMetric[] = [
    {
      label: "Recruiter queue",
      value: String(recruiterQueue.length + recruiterSupport.length),
      hint: "Applications and applicant-linked threads that still need movement.",
    },
    {
      label: "Moderation queue",
      value: String(moderationQueue.length),
      hint: "Job posts and employer verifications still waiting on trusted review.",
    },
    {
      label: "Owner alerts",
      value: String(alerts.length),
      hint: "Neglected threads, alert failures, or weak recruiter behavior requiring oversight.",
    },
    {
      label: "Stale work",
      value: String(neglectedThreads.length),
      hint: "Jobs support threads with 12h+ of silence.",
    },
  ];

  const dailyBriefs = [
    `${applicationRows.length} live application activity rows are visible in production, with ${recruiterQueue.length} still needing recruiter action.`,
    `${verificationRows.length} employer verification rows are in motion; ${moderationQueue.filter((item) => item.ownerRole === "Trust / compliance").length} belong to trust review.`,
    emailFailures.length
      ? `${emailFailures.length} jobs-alert email failures hit audit logs and should stay owner-visible until delivery health stabilizes.`
      : "No jobs-alert email failure was visible in the latest audit slice.",
  ];

  const weeklyBriefs = [
    `${jobRows.length} recent job-post activity rows are visible; moderation should keep publication quality tied to explicit decision notes.`,
    shortlistWithoutNote.length
      ? `${shortlistWithoutNote.length} shortlist/interview moves were recorded without recruiter notes, which is a seriousness signal to watch.`
      : "Recruiter notes were present on the latest shortlist/interview moves inspected in this pass.",
    neglectedThreads.length
      ? `${neglectedThreads.length} support threads crossed the stale threshold and need queue-pressure follow-through.`
      : "No open jobs support thread crossed the stale threshold in the latest slice.",
  ];

  return {
    summary:
      "Jobs HQ is now built around real queue ownership: recruiter movement, employer verification, moderation review, and owner-visible alerting all route into live HenryJobs workflows instead of a passive launchpad.",
    metrics,
    recruiterQueue: [...recruiterQueue, ...recruiterSupport].slice(0, 10),
    moderationQueue,
    alerts,
    dailyBriefs,
    weeklyBriefs,
    links: [
      {
        href: `${jobsRoot}/recruiter/pipeline`,
        label: "Recruiter pipeline",
        description: "Advance candidate stages and recover stalled applicant movement.",
      },
      {
        href: `${jobsRoot}/recruiter/jobs`,
        label: "Job moderation",
        description: "Approve, hold, or flag job posts with an audit reason.",
      },
      {
        href: `${jobsRoot}/recruiter/verification`,
        label: "Employer verification",
        description: "Review employer trust and verification evidence.",
      },
      {
        href: `${jobsRoot}/recruiter/candidates`,
        label: "Candidate review",
        description: "Inspect candidate trust passports and next actions.",
      },
      {
        href: `${jobsRoot}/owner`,
        label: "Owner oversight",
        description: "Open the executive jobs workspace for top-level governance.",
      },
    ],
  };
}
