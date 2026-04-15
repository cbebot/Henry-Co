import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { applyVerificationTrustControls, normalizeVerificationStatus } from "@henryco/trust";
import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();
const JOBS_ORIGIN = getDivisionUrl("jobs");
const JOBS_DIVISION = "jobs";
const JOBS_ACTIVITY_PROFILE = "jobs_candidate_profile";
const JOBS_ACTIVITY_APPLICATION = "jobs_application";
const JOBS_ACTIVITY_SAVED = "jobs_saved_post";
const JOBS_ACTIVITY_ALERT = "jobs_alert_subscription";
const JOBS_ACTIVITY_JOB_POST = "jobs_post";
const STAGE_ORDER = ["applied", "reviewing", "shortlisted", "interview", "offer", "hired", "rejected"];

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asNullableNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => asText(item).trim())
        .filter(Boolean)
    : [];
}

function asObjectArray(value: unknown) {
  return Array.isArray(value) ? value.map(asObject) : [];
}

function toJobsUrl(pathname?: string | null) {
  const clean = asNullableText(pathname);
  if (!clean) return JOBS_ORIGIN;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${JOBS_ORIGIN}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function humanizeStage(stage: string) {
  if (!stage) return "Applied";
  return stage
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stageTone(stage: string) {
  if (stage === "hired" || stage === "offer") return "green" as const;
  if (stage === "shortlisted" || stage === "interview") return "orange" as const;
  if (stage === "rejected") return "red" as const;
  return "blue" as const;
}

function pipelineState(stages: string[], currentStage: string) {
  const normalized = [...new Set(stages.filter(Boolean))];
  if (normalized.length === 0) normalized.push(...STAGE_ORDER.slice(0, 6));
  if (!normalized.includes(currentStage)) normalized.push(currentStage);

  const currentIndex = Math.max(normalized.indexOf(currentStage), 0);

  return normalized.map((stage, index) => ({
    key: stage,
    label: humanizeStage(stage),
    status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

function progressPercent(stage: string, stages: string[]) {
  const normalized = stages.length > 0 ? stages : STAGE_ORDER.slice(0, 6);
  if (stage === "hired" || stage === "rejected") return 100;
  const index = Math.max(normalized.indexOf(stage), 0);
  return Math.max(14, Math.round(((index + 1) / (normalized.length + 1)) * 100));
}

function notificationBelongsToJobs(row: Record<string, unknown>) {
  const division = asText(row.division);
  const category = asText(row.category);
  const referenceType = asText(row.reference_type);
  const actionUrl = asText(row.action_url);
  const title = asText(row.title).toLowerCase();
  const body = asText(row.body).toLowerCase();

  return (
    division === JOBS_DIVISION ||
    category === JOBS_DIVISION ||
    referenceType.startsWith("jobs_") ||
    actionUrl.includes("jobs.henrycogroup.com") ||
    actionUrl.includes("/candidate/") ||
    actionUrl.includes("/jobs/") ||
    title.includes("application") ||
    title.includes("recruiter") ||
    body.includes("henryco jobs")
  );
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(value));
}

function interviewRoomStatus(stage: string, scheduledAt: string | null) {
  if (stage === "offer" || stage === "hired") return "post_interview";
  if (stage === "interview") return scheduledAt ? "scheduled" : "awaiting_schedule";
  if (stage === "shortlisted") return "preparation";
  return "standby";
}

function interviewProvider(stage: string, metadata: Record<string, unknown>) {
  const provider = asNullableText(metadata.provider || metadata.videoProvider || metadata.callProvider);
  if (provider) return provider;
  if (stage === "interview") return "video_provider_pending";
  return "manual";
}

function completionScore(input: {
  base: Record<string, unknown>;
  profile: Record<string, unknown>;
  documents: Array<Record<string, unknown>>;
}) {
  let score = 0;
  if (asNullableText(input.base.full_name)) score += 12;
  if (asNullableText(input.base.phone)) score += 10;
  if (asNullableText(input.profile.headline)) score += 12;
  if (asNullableText(input.profile.summary)) score += 12;
  if (asNullableText(input.profile.location)) score += 8;
  if (asStringArray(input.profile.skills).length >= 4) score += 14;
  if (asObjectArray(input.profile.workHistory).length > 0) score += 12;
  if (asObjectArray(input.profile.education).length > 0) score += 8;
  if (asStringArray(input.profile.portfolioLinks).length > 0) score += 6;
  if (input.documents.some((document) => asText(asObject(document.metadata).documentKind) === "resume")) score += 16;
  return Math.min(score, 100);
}

function trustScore(input: {
  completionScoreValue: number;
  profile: Record<string, unknown>;
  documents: Array<Record<string, unknown>>;
  verificationStatus: unknown;
}) {
  let score = input.completionScoreValue;
  if (normalizeVerificationStatus(input.verificationStatus) === "verified") score += 18;
  if (input.documents.some((document) => asText(asObject(document.metadata).documentKind) === "certification")) score += 6;
  if (
    input.documents.some((document) => asText(asObject(document.metadata).documentKind) === "portfolio") ||
    asStringArray(input.profile.portfolioLinks).length > 0
  ) {
    score += 4;
  }

  return applyVerificationTrustControls({
    verificationStatus: input.verificationStatus,
    baseScore: score,
    baseTier:
      score >= 88
        ? "premium_verified"
        : score >= 68
          ? "trusted"
          : score >= 45
            ? "verified"
            : "basic",
    verifiedBonus: 0,
    caps: {
      none: {
        maxScore: 54,
        maxTier: "basic",
      },
      pending: {
        maxScore: 68,
        maxTier: "verified",
      },
      rejected: {
        maxScore: 36,
        maxTier: "basic",
      },
    },
  }).score;
}

function readinessLabel(score: number) {
  if (score >= 88) return "Interview-ready";
  if (score >= 68) return "Strong profile";
  if (score >= 45) return "Needs proof";
  return "Needs structure";
}

function buildJobPreview(row: Record<string, unknown>) {
  const metadata = asObject(row.metadata);
  const slug = asText(metadata.slug || row.reference_id);
  const employerVerification = asText(metadata.employerVerification, "pending");
  const employerTrustScore = asNumber(metadata.employerTrustScore, 54);
  const employerResponseSlaHours = asNullableNumber(metadata.employerResponseSlaHours);

  return {
    slug,
    title: asText(metadata.title, "Role"),
    employerName: asText(metadata.employerName, "HenryCo Jobs"),
    employerSlug: asText(metadata.employerSlug),
    location: asText(metadata.location, "Remote"),
    workMode: asText(metadata.workMode, "remote"),
    employmentType: asText(metadata.employmentType, "Full-time"),
    salaryLabel: asNullableText(metadata.salaryLabel),
    employerVerification,
    employerTrustScore,
    employerResponseSlaHours,
    trustHighlights: asStringArray(metadata.trustHighlights),
    pipelineStages: asStringArray(metadata.pipelineStages),
    postedAt: asText(metadata.postedAt || row.created_at, new Date().toISOString()),
    href: toJobsUrl(asNullableText(row.action_url) || `/jobs/${slug}`),
    isPublished: asBoolean(metadata.isPublished, asText(row.status) === "published"),
  };
}

function recommendationReason(input: {
  role: ReturnType<typeof buildJobPreview>;
  profile: Record<string, unknown>;
  savedRoles: Array<{ category: string; title: string; team: string }>;
  applications: Array<{ title: string }>;
}) {
  const preferredTerms = new Set(
    [
      ...asStringArray(input.profile.preferredFunctions),
      ...asStringArray(input.profile.skills),
      ...input.savedRoles.flatMap((role) => [role.category, role.team, role.title]),
      ...input.applications.map((application) => application.title),
    ]
      .map((item) => item.toLowerCase())
      .filter(Boolean)
  );

  const matchedHighlight = input.role.trustHighlights.find((item) => preferredTerms.has(item.toLowerCase()));
  if (matchedHighlight) {
    return `${matchedHighlight} lines up with the signals already in your jobs profile.`;
  }

  if (input.role.employerVerification === "verified") {
    return "Verified employer with a clearer recruiter-response expectation.";
  }

  return "This role sits close to the categories and search intent already visible in your account.";
}

export async function getJobsModuleData(userId: string) {
  const [
    profileRes,
    profileActivityRes,
    documentsRes,
    applicationsRes,
    savedRes,
    alertsRes,
    notificationsRes,
    threadsRes,
    jobsRes,
  ] = await Promise.all([
    admin().from("customer_profiles").select("*").eq("id", userId).maybeSingle(),
    admin()
      .from("customer_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_PROFILE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin()
      .from("customer_documents")
      .select("*")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .order("created_at", { ascending: false }),
    admin()
      .from("customer_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
      .neq("status", "withdrawn")
      .order("created_at", { ascending: false }),
    admin()
      .from("customer_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_SAVED)
      .eq("status", "saved")
      .order("created_at", { ascending: false }),
    admin()
      .from("customer_activity")
      .select("*")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_ALERT)
      .order("created_at", { ascending: false }),
    admin().from("customer_notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    admin().from("support_threads").select("*").eq("user_id", userId).eq("division", JOBS_DIVISION).order("updated_at", { ascending: false }),
    admin()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_JOB_POST)
      .order("created_at", { ascending: false })
      .limit(160),
  ]);

  const profileRow = asObject(profileRes.data);
  const profileActivity = asObject(profileActivityRes.data);
  const profile = asObject(profileActivity.metadata);
  const documents = (documentsRes.data ?? []) as Array<Record<string, unknown>>;
  const applicationRows = (applicationsRes.data ?? []) as Array<Record<string, unknown>>;
  const savedRows = (savedRes.data ?? []) as Array<Record<string, unknown>>;
  const threadRows = (threadsRes.data ?? []) as Array<Record<string, unknown>>;
  const jobRows = (jobsRes.data ?? []) as Array<Record<string, unknown>>;
  const applicationIds = applicationRows.map((row) => asText(row.reference_id || row.id)).filter(Boolean);
  const threadIds = threadRows.map((row) => asText(row.id)).filter(Boolean);

  const [messageRowsRes, auditRowsRes] = await Promise.all([
    threadIds.length > 0
      ? admin().from("support_messages").select("*").in("thread_id", threadIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    applicationIds.length > 0
      ? admin()
          .from("audit_logs")
          .select("*")
          .eq("entity_type", JOBS_ACTIVITY_APPLICATION)
          .in("entity_id", applicationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const jobsBySlug = new Map(
    jobRows
      .map((row) => buildJobPreview(row))
      .filter((role) => role.slug)
      .map((role) => [role.slug, role])
  );
  const messagesByThread = new Map<string, Array<Record<string, unknown>>>();
  const auditsByApplication = new Map<string, Array<Record<string, unknown>>>();

  for (const row of (messageRowsRes.data ?? []) as Array<Record<string, unknown>>) {
    const key = asText(row.thread_id);
    const existing = messagesByThread.get(key) ?? [];
    existing.push(row);
    messagesByThread.set(key, existing);
  }

  for (const row of (auditRowsRes.data ?? []) as Array<Record<string, unknown>>) {
    const key = asText(row.entity_id);
    const existing = auditsByApplication.get(key) ?? [];
    existing.push(row);
    auditsByApplication.set(key, existing);
  }

  const profileCompletion = completionScore({
    base: profileRow,
    profile,
    documents,
  });
  const profileTrust = trustScore({
    completionScoreValue: profileCompletion,
    profile,
    documents,
    verificationStatus: profileRow.verification_status,
  });
  const hasResume = documents.some((document) => asText(asObject(document.metadata).documentKind) === "resume");
  const hasPortfolio =
    documents.some((document) => asText(asObject(document.metadata).documentKind) === "portfolio") ||
    asStringArray(profile.portfolioLinks).length > 0;
  const verificationStatus = normalizeVerificationStatus(profileRow.verification_status);
  const profileChecklist = [
    {
      id: "identity",
      label: "Profile basics",
      detail: "Full name, phone, and location are present for recruiter follow-through.",
      complete: Boolean(asNullableText(profileRow.full_name) && asNullableText(profileRow.phone) && asNullableText(profile.location)),
      href: toJobsUrl("/candidate/profile"),
    },
    {
      id: "story",
      label: "Role story",
      detail: "Headline and summary explain what you do beyond a blank record.",
      complete: Boolean(asNullableText(profile.headline) && asNullableText(profile.summary)),
      href: toJobsUrl("/candidate/profile"),
    },
    {
      id: "verification",
      label: "Identity verification",
      detail: "Jobs trust stays capped until your HenryCo account has cleared identity review.",
      complete: verificationStatus === "verified",
      href: "/verification",
    },
    {
      id: "proof",
      label: "Proof of work",
      detail: "Resume plus portfolio evidence makes shortlist movement easier.",
      complete: hasResume && hasPortfolio,
      href: toJobsUrl("/candidate/files"),
    },
    {
      id: "skills",
      label: "Skills mapped",
      detail: "At least four skills and preferred functions improve recommendations.",
      complete: asStringArray(profile.skills).length >= 4 && asStringArray(profile.preferredFunctions).length > 0,
      href: toJobsUrl("/candidate/profile"),
    },
  ];

  const applications = applicationRows
    .map((row) => {
      const metadata = asObject(row.metadata);
      const applicationId = asText(row.reference_id || row.id);
      const jobSlug = asText(metadata.jobSlug);
      const linkedRole = jobsBySlug.get(jobSlug) ?? null;
      const stage = asText(metadata.stage || row.status, "applied");
      const thread = threadRows.find((item) => asText(item.reference_id) === applicationId) ?? null;
      const messages = thread ? messagesByThread.get(asText(thread.id)) ?? [] : [];
      const visibleMessages = messages.filter((message) => {
        const attachments = asObjectArray(message.attachments);
        const visibility = asNullableText(asObject(attachments[0]).visibility);
        return asText(message.sender_type) !== "internal_note" && visibility !== "internal";
      });
      const latestMessage = [...visibleMessages].sort((a, b) => toTimestamp(asText(b.created_at)) - toTimestamp(asText(a.created_at)))[0] ?? null;
      const latestAudit = [...(auditsByApplication.get(applicationId) ?? [])]
        .sort((a, b) => toTimestamp(asText(b.created_at)) - toTimestamp(asText(a.created_at)))[0] ?? null;
      const latestUpdateAt =
        asNullableText(latestMessage?.created_at) ||
        asNullableText(latestAudit?.created_at) ||
        asNullableText(metadata.updatedAt) ||
        asText(row.created_at, new Date().toISOString());
      const latestUpdateBody =
        asNullableText(latestMessage?.body) ||
        asNullableText(latestAudit?.reason) ||
        `${asText(metadata.jobTitle, "Application")} is currently in ${humanizeStage(stage).toLowerCase()}.`;
      const role = linkedRole ?? {
        slug: jobSlug,
        title: asText(metadata.jobTitle, "Role"),
        employerName: asText(metadata.employerName, "HenryCo Jobs"),
        employerSlug: asText(metadata.employerSlug),
        location: "Remote",
        workMode: "remote",
        employmentType: "Full-time",
        salaryLabel: null,
        employerVerification: "pending",
        employerTrustScore: 54,
        employerResponseSlaHours: null,
        trustHighlights: [],
        pipelineStages: [],
        postedAt: asText(row.created_at, new Date().toISOString()),
        href: toJobsUrl(asNullableText(metadata.jobHref) || `/jobs/${jobSlug}`),
        isPublished: true,
      };
      const pipeline = pipelineState(role.pipelineStages, stage);

      return {
        id: applicationId,
        jobSlug,
        jobTitle: asText(metadata.jobTitle, "Role"),
        employerName: asText(metadata.employerName, "HenryCo Jobs"),
        stage,
        stageLabel: humanizeStage(stage),
        tone: stageTone(stage),
        threadId: thread ? asText(thread.id) : null,
        threadSubject: thread ? asText(thread.subject) : null,
        threadStatus: thread ? asText(thread.status, "open") : null,
        appliedAt: asText(row.created_at, new Date().toISOString()),
        updatedAt: latestUpdateAt,
        progressPercent: progressPercent(stage, role.pipelineStages),
        pipeline,
        recruiterConfidence: Math.min(asNumber(metadata.recruiterConfidence, 48), 100),
        candidateReadiness: Math.min(asNumber(metadata.candidateReadiness, 48), 100),
        coverNote: asNullableText(metadata.coverNote),
        recruiterNote:
          asNullableText(metadata.recruiterNote) ||
          asNullableText(latestAudit?.reason) ||
          asNullableText(latestMessage?.body),
        interviewMeta: asObject(metadata.interview),
        timeline: [...(auditsByApplication.get(applicationId) ?? [])]
          .sort((a, b) => toTimestamp(asText(b.created_at)) - toTimestamp(asText(a.created_at)))
          .slice(0, 8)
          .map((audit) => ({
            id: asText(audit.id),
            action: asText(audit.action),
            actorRole: asNullableText(audit.actor_role),
            reason: asNullableText(audit.reason),
            createdAt: asText(audit.created_at, new Date().toISOString()),
            newValues: asObject(audit.new_values),
          })),
        latestUpdateBody,
        latestUpdateAt,
        latestUpdateSource:
          latestMessage
            ? "thread"
            : latestAudit && asText(latestAudit.action) === "jobs_application_stage_changed"
              ? "timeline"
              : "application",
        jobHref: role.href,
        timelineHref: toJobsUrl("/candidate/applications"),
        interviewHref: `/jobs/interviews/${applicationId}`,
        conversationHref: thread ? `/support/${asText(thread.id)}` : toJobsUrl("/candidate/applications"),
        nextStepLabel:
          stage === "interview"
            ? "Prepare examples and scheduling blocks"
            : stage === "offer"
              ? "Review scope, timing, and compensation"
              : stage === "shortlisted"
                ? "Have proof and portfolio context ready"
                : stage === "rejected"
                  ? "Strengthen the next application pack"
                  : "Keep your profile and resume current",
        nextStepBody:
          stage === "interview"
            ? "Interview stages move faster when your strongest work proof and availability are easy to scan."
            : stage === "offer"
              ? "Use the offer stage to close ambiguity, not to guess at responsibilities."
              : stage === "shortlisted"
                ? "Shortlist status means you passed the first signal check. Tight proof matters now."
                : stage === "rejected"
                  ? "Use the rejection as signal. Tighten summary, examples, and role fit before applying again."
                  : "Early-stage review benefits from sharper proof, clean contact info, and a current resume.",
      };
    })
    .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));

  const stageSummary = STAGE_ORDER.map((stage) => ({
    key: stage,
    label: humanizeStage(stage),
    count: applications.filter((application) => application.stage === stage).length,
    tone: stageTone(stage),
  })).filter((item) => item.count > 0);

  const savedJobs = savedRows
    .map((row) => {
      const metadata = asObject(row.metadata);
      const role = jobsBySlug.get(asText(metadata.jobSlug)) ?? {
        slug: asText(metadata.jobSlug),
        title: asText(metadata.jobTitle, "Saved role"),
        employerName: asText(metadata.employerName, "HenryCo Jobs"),
        employerSlug: asText(metadata.employerSlug),
        location: asText(metadata.location, "Remote"),
        workMode: asText(metadata.workMode, "remote"),
        employmentType: asText(metadata.employmentType, "Full-time"),
        salaryLabel: asNullableText(metadata.salaryLabel),
        employerVerification: asText(metadata.employerVerification, "pending"),
        employerTrustScore: asNumber(metadata.employerTrustScore, 54),
        employerResponseSlaHours: asNullableNumber(metadata.employerResponseSlaHours),
        trustHighlights: asStringArray(metadata.trustHighlights),
        pipelineStages: asStringArray(metadata.pipelineStages),
        postedAt: asText(row.created_at, new Date().toISOString()),
        href: toJobsUrl(asNullableText(row.action_url) || `/jobs/${asText(metadata.jobSlug)}`),
        isPublished: true,
      };

      return {
        id: asText(row.id),
        savedAt: asText(row.created_at, new Date().toISOString()),
        role,
      };
    })
    .filter((item) => item.role.slug);

  const recruiterFeed = [
    ...(notificationsRes.data ?? [])
      .filter((row) => notificationBelongsToJobs(row as Record<string, unknown>))
      .map((row) => {
        const item = row as Record<string, unknown>;
        const priority = asText(item.priority, "normal");
        return {
          id: `notification-${asText(item.id)}`,
          title: asText(item.title),
          body: asText(item.body),
          createdAt: asText(item.created_at, new Date().toISOString()),
          source: "notification",
          href: toJobsUrl(asNullableText(item.action_url) || "/candidate/applications"),
          tone: priority === "urgent" ? "red" : priority === "high" ? "orange" : "blue",
        };
      }),
    ...applications.map((application) => ({
      id: `application-${application.id}`,
      title: `${application.stageLabel} update`,
      body: application.latestUpdateBody,
      createdAt: application.latestUpdateAt,
      source: application.latestUpdateSource,
      href: application.timelineHref,
      tone: application.tone,
    })),
  ]
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 8);

  const nextActions = [
    ...profileChecklist
      .filter((item) => !item.complete)
      .slice(0, 1)
      .map((item) => ({
        id: item.id,
        label: `Close the ${item.label.toLowerCase()} gap`,
        detail: item.detail,
        href: item.href,
        tone: "orange" as const,
      })),
    ...applications
      .filter((application) => application.stage === "interview" || application.stage === "offer")
      .slice(0, 2)
      .map((application) => ({
        id: `application-${application.id}`,
        label: application.stage === "offer" ? "Respond to an active offer" : "Prepare for an interview lane",
        detail: `${application.jobTitle} at ${application.employerName} needs attention now.`,
        href: application.timelineHref,
        tone: application.stage === "offer" ? ("green" as const) : ("blue" as const),
      })),
  ];

  if (nextActions.length === 0 && savedJobs.length > 0) {
    nextActions.push({
      id: "saved-role",
      label: "Convert a saved role into a live application",
      detail: `${savedJobs[0].role.title} is already on your shortlist and ready for a deeper pass.`,
      href: savedJobs[0].role.href,
      tone: "blue",
    });
  }

  if (nextActions.length === 0) {
    nextActions.push({
      id: "start-search",
      label: "Restart your jobs search with stronger filters",
      detail: "Use verified-employer and internal-role filters to build a cleaner shortlist faster.",
      href: toJobsUrl("/jobs"),
      tone: "blue",
    });
  }

  const interviewSessions = applications
    .filter((application) => ["shortlisted", "interview", "offer", "hired"].includes(application.stage))
    .map((application) => {
      const metadata = asObject(application.interviewMeta);
      const scheduledAt =
        asNullableText(metadata.scheduledAt) ||
        asNullableText(metadata.startsAt) ||
        asNullableText(metadata.startTime) ||
        null;
      const provider = interviewProvider(application.stage, metadata);
      const joinUrl =
        asNullableText(metadata.joinUrl) ||
        asNullableText(metadata.roomUrl) ||
        asNullableText(metadata.meetingUrl) ||
        null;
      const status = interviewRoomStatus(application.stage, scheduledAt);

      return {
        id: application.id,
        applicationId: application.id,
        applicationStage: application.stage,
        status,
        provider,
        joinUrl,
        isJoinReady: Boolean(joinUrl && ["scheduled", "post_interview"].includes(status)),
        scheduledAt,
        interviewerName: asNullableText(metadata.interviewerName) || application.employerName,
        interviewerTitle: asNullableText(metadata.interviewerTitle) || "Hiring team",
        locationLabel:
          asNullableText(metadata.locationLabel) ||
          (provider === "manual"
            ? "Manual recruiter coordination"
            : provider === "video_provider_pending"
              ? "Remote room will appear here once configured"
              : "Remote interview room"),
        preparationNotes:
          asNullableText(metadata.preparationNotes) ||
          application.recruiterNote ||
          application.nextStepBody,
        confirmationNote:
          status === "scheduled"
            ? "Timing is locked. Keep your examples, network quality, and quiet room ready."
            : status === "post_interview"
              ? "The live session step is done. Watch this room for the recruiter outcome."
              : "The recruiter is preparing final timing or room details.",
        history: [
          ...application.timeline.map((item) => ({
            id: item.id,
            title: humanizeStage(
              asNullableText(item.newValues.nextStage) ||
                asNullableText(item.newValues.stage) ||
                item.action.replace(/^jobs_/, "")
            ),
            body: item.reason || `${application.jobTitle} received a recruiter-side update.`,
            createdAt: item.createdAt,
          })),
          ...(application.recruiterNote
            ? [
                {
                  id: `note-${application.id}`,
                  title: "Recruiter note",
                  body: application.recruiterNote,
                  createdAt: application.latestUpdateAt,
                },
              ]
            : []),
        ]
          .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
          .slice(0, 8),
        nextStepLabel:
          status === "scheduled"
            ? "Review instructions and be ready to join"
            : status === "post_interview"
              ? "Watch for the hiring decision"
              : "Stay ready while timing is finalized",
        nextStepBody: application.nextStepBody,
        timelineHref: application.timelineHref,
        interviewHref: application.interviewHref,
        supportHref: application.conversationHref,
        jobHref: application.jobHref,
        jobTitle: application.jobTitle,
        employerName: application.employerName,
        tone: application.tone,
      };
    })
    .sort(
      (a, b) =>
        toTimestamp(b.scheduledAt || b.history[0]?.createdAt) -
        toTimestamp(a.scheduledAt || a.history[0]?.createdAt)
    );

  const publishedRoles = [...jobsBySlug.values()].filter((role) => role.isPublished);
  const excludedSlugs = new Set([
    ...applications.map((application) => application.jobSlug),
    ...savedJobs.map((savedJob) => savedJob.role.slug),
  ]);
  const preferredTerms = new Set(
    [
      ...asStringArray(profile.preferredFunctions),
      ...asStringArray(profile.skills),
      ...savedJobs.map((savedJob) => savedJob.role.title),
      ...savedJobs.map((savedJob) => savedJob.role.employerName),
      ...applications.map((application) => application.jobTitle),
    ]
      .map((item) => item.toLowerCase())
      .filter(Boolean)
  );
  const recommendedRoles = publishedRoles
    .filter((role) => !excludedSlugs.has(role.slug))
    .map((role) => {
      let score = 12;
      if (role.employerVerification === "verified") score += 18;
      if (role.employerTrustScore >= 80) score += 12;
      if (preferredTerms.has(role.title.toLowerCase())) score += 12;
      if ([...preferredTerms].some((term) => term && role.title.toLowerCase().includes(term))) score += 10;
      if (preferredTerms.has(role.employerName.toLowerCase())) score += 6;
      const skillOverlap = role.trustHighlights.filter((item) => preferredTerms.has(item.toLowerCase())).length;
      score += Math.min(skillOverlap * 4, 12);

      return {
        ...role,
        score,
        reason: recommendationReason({
          role,
          profile,
          savedRoles: savedJobs.map((savedJob) => ({
            category: savedJob.role.employerName,
            team: savedJob.role.employmentType,
            title: savedJob.role.title,
          })),
          applications: applications.map((application) => ({ title: application.jobTitle })),
        }),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const alerts = (alertsRes.data ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    const metadata = asObject(item.metadata);
    return {
      id: asText(item.id),
      label: asText(metadata.label, "Jobs alert"),
      status: asText(item.status, "active"),
      detail: [asNullableText(metadata.q), asNullableText(metadata.category), asNullableText(metadata.mode)]
        .filter(Boolean)
        .join(" · ") || "Live jobs alert",
      href: toJobsUrl("/candidate/alerts"),
    };
  });

  const jobsNotifications = (notificationsRes.data ?? [])
    .filter((row) => notificationBelongsToJobs(row as Record<string, unknown>))
    .slice(0, 5)
    .map((row) => {
      const item = row as Record<string, unknown>;
      return {
        id: asText(item.id),
        title: asText(item.title),
        body: asText(item.body),
        createdAt: asText(item.created_at, new Date().toISOString()),
        isRead: asBoolean(item.is_read),
        href: toJobsUrl(asNullableText(item.action_url) || "/candidate/applications"),
      };
    });

  return {
    jobsOrigin: JOBS_ORIGIN,
    candidateUrl: toJobsUrl("/candidate"),
    applicationsUrl: toJobsUrl("/candidate/applications"),
    savedJobsUrl: toJobsUrl("/candidate/saved-jobs"),
    profileUrl: toJobsUrl("/candidate/profile"),
    browseJobsUrl: toJobsUrl("/jobs"),
    stats: [
      {
        id: "applications",
        label: "Active applications",
        value: String(applications.length),
        detail: applications.length > 0 ? `${applications[0].stageLabel} is your leading live stage.` : "No live applications yet.",
        tone: "blue",
      },
      {
        id: "saved",
        label: "Saved roles",
        value: String(savedJobs.length),
        detail: savedJobs.length > 0 ? "Your shortlist is ready for another review pass." : "Build a shortlist so good roles are easier to revisit.",
        tone: "gold",
      },
      {
        id: "readiness",
        label: "Profile readiness",
        value: `${profileTrust}%`,
        detail: readinessLabel(profileTrust),
        tone: profileTrust >= 70 ? "green" : "orange",
      },
      {
        id: "updates",
        label: "Recruiter updates",
        value: String(recruiterFeed.length),
        detail: recruiterFeed[0] ? `${formatRelativeTime(recruiterFeed[0].createdAt)} latest movement.` : "No recruiter updates yet.",
        tone: recruiterFeed[0]?.tone || "blue",
      },
    ],
    profile: {
      readinessScore: profileCompletion,
      trustScore: profileTrust,
      readinessLabel: readinessLabel(profileTrust),
      headline: asNullableText(profile.headline),
      summary: asNullableText(profile.summary),
      updatedAt: asNullableText(profile.updatedAt || profileActivity.created_at),
      skillsCount: asStringArray(profile.skills).length,
      documentsCount: documents.length,
      hasResume,
      hasPortfolio,
      resumeQualityLabel:
        hasResume && hasPortfolio
          ? "Resume and proof look recruiter-ready."
          : hasResume
            ? "Resume exists, but proof of work can be sharper."
            : "Resume is still missing from the jobs file vault.",
      checklist: profileChecklist,
    },
    stageSummary,
    nextActions,
    applications,
    interviewSessions,
    recruiterFeed,
    savedJobs,
    recommendedRoles,
    alerts,
    notifications: jobsNotifications,
  };
}
