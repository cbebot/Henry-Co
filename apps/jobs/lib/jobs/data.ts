import "server-only";

import { unstable_cache } from "next/cache";
import { applyVerificationTrustControls, normalizeVerificationStatus } from "@henryco/trust";
import {
  resolveLocalizedDynamicField,
  translateSurfaceLabel,
  type AppLocale,
} from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/env";
import { ensureJobsBootstrap } from "@/lib/jobs/seed";
import { DEFAULT_PIPELINE, JOBS_STAGE_ORDER, getJobsDifferentiators } from "@/lib/jobs/content";
import { deriveJobTrustHighlights } from "@/lib/jobs/trust";

function makeT(locale: AppLocale | undefined) {
  return (text: string) => (locale ? translateSurfaceLabel(locale, text) : text);
}

/**
 * Wave 2 i18n — Supabase-row-driven text passes through
 * `resolveLocalizedDynamicField` so cached DeepL fills the gap when an
 * employer hasn't supplied `${field}_i18n` / `locale_overrides`.
 *
 * `metadata` is the JSON column on `customer_activity` rows where job
 * postings + employer profiles store their translatable text. We resolve
 * against that record (it carries `${field}_i18n` keys when employers
 * upload localized copy) and feed the live string as the fallback so a
 * DeepL miss still ships the source text.
 */
async function localizeText(
  metadata: Record<string, unknown> | null | undefined,
  field: string,
  fallback: string,
  locale: AppLocale | undefined,
): Promise<string> {
  if (!locale || locale === "en" || !fallback) return fallback;
  return resolveLocalizedDynamicField({
    record: metadata ?? { [field]: fallback },
    field,
    locale,
    fallback,
    machineTranslate: true,
  });
}

async function localizeTextArray(
  metadata: Record<string, unknown> | null | undefined,
  field: string,
  fallback: string[],
  locale: AppLocale | undefined,
): Promise<string[]> {
  if (!locale || locale === "en" || fallback.length === 0) return fallback;
  // Each bullet flows through DeepL individually so the cache hits at the
  // string level — bullets get re-used across postings.
  return Promise.all(
    fallback.map((entry, index) =>
      resolveLocalizedDynamicField({
        record: { [`${field}_${index}`]: entry },
        field: `${field}_${index}`,
        locale,
        fallback: entry,
        machineTranslate: true,
      }),
    ),
  );
}

import type {
  ApplicationJourney,
  ApplicationStageStep,
  CandidateDashboardData,
  CandidateNextAction,
  CandidateDocument,
  CandidateProfile,
  ConversationMessage,
  ConversationThread,
  EmployerMembership,
  EmployerProfile,
  JobAlert,
  JobApplication,
  JobRecommendation,
  JobPost,
  JobsHomeData,
  JobsNotification,
  ModerationCase,
  ProfileChecklistItem,
  RecruiterActivity,
  SavedJob,
  StageTone,
  TimelineEvent,
} from "@/lib/jobs/types";

export const JOBS_DIVISION = "jobs";
export const JOBS_ACTIVITY_PROFILE = "jobs_candidate_profile";
export const JOBS_ACTIVITY_APPLICATION = "jobs_application";
export const JOBS_ACTIVITY_SAVED = "jobs_saved_post";
export const JOBS_ACTIVITY_ALERT = "jobs_alert_subscription";
export const JOBS_ACTIVITY_EMPLOYER_PROFILE = "jobs_employer_profile";
export const JOBS_ACTIVITY_JOB_POST = "jobs_post";
export const JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP = "jobs_employer_membership";
export const JOBS_ACTIVITY_EMPLOYER_VERIFICATION = "jobs_employer_verification";
export const JOBS_VERIFICATION_SYNTHETIC_PATTERN = /^codex\s+prospect(\s+\d+)?$/i;

function isJobsVerificationSynthetic(value?: string | null) {
  return JOBS_VERIFICATION_SYNTHETIC_PATTERN.test(String(value || "").trim());
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown) {
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

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => asString(item).trim())
        .filter(Boolean)
    : [];
}

function asObjectArray(value: unknown) {
  return Array.isArray(value) ? value.map(asObject) : [];
}

// Treat <=0 / non-finite as "unspecified" so the public surface never renders
// "₦0 - ₦0" — that pattern destroys employer credibility on first impression.
function normalizeSalaryAmount(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function sanitizeStoredSalaryLabel(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length > 0 && /^0+$/.test(digits)) return null;
  return trimmed;
}

function formatSalaryLabel(min: number | null, max: number | null, currency = "NGN") {
  const cleanMin = normalizeSalaryAmount(min);
  const cleanMax = normalizeSalaryAmount(max);
  if (cleanMin == null && cleanMax == null) return null;
  const formatter = new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (cleanMin != null && cleanMax != null) {
    return `${formatter.format(cleanMin)} - ${formatter.format(cleanMax)}`;
  }

  if (cleanMin != null) {
    return `${formatter.format(cleanMin)}+`;
  }

  return `Up to ${formatter.format(cleanMax!)}`;
}

function calculateCompletionScore(input: {
  profile: Record<string, unknown>;
  base: Record<string, unknown>;
  documents: CandidateDocument[];
}) {
  let score = 0;
  if (asNullableString(input.base.full_name)) score += 12;
  if (asNullableString(input.base.phone)) score += 10;
  if (asNullableString(input.profile.headline)) score += 12;
  if (asNullableString(input.profile.summary)) score += 12;
  if (asNullableString(input.profile.location)) score += 8;
  if (asStringArray(input.profile.skills).length >= 4) score += 14;
  if (asObjectArray(input.profile.workHistory).length > 0) score += 12;
  if (asObjectArray(input.profile.education).length > 0) score += 8;
  if (asStringArray(input.profile.portfolioLinks).length > 0) score += 6;
  if (input.documents.some((doc) => doc.kind === "resume")) score += 16;
  return Math.min(score, 100);
}

function calculateTrustScore(input: {
  completionScore: number;
  verificationStatus: unknown;
  documents: CandidateDocument[];
}) {
  let score = input.completionScore;
  if (normalizeVerificationStatus(input.verificationStatus) === "verified") score += 18;
  if (input.documents.some((doc) => doc.kind === "certification")) score += 6;
  if (input.documents.some((doc) => doc.kind === "portfolio")) score += 4;
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

function getReadinessLabel(score: number, locale?: AppLocale) {
  const t = makeT(locale);
  if (score >= 88) return t("Interview-ready");
  if (score >= 68) return t("Strong profile");
  if (score >= 45) return t("Needs proof");
  return t("Needs structure");
}

function toCandidateVerificationStatus(status: unknown): CandidateProfile["verificationStatus"] {
  const normalized = normalizeVerificationStatus(status);
  if (normalized === "verified") return "verified";
  if (normalized === "pending") return "pending";
  if (normalized === "rejected") return "rejected";
  return "unverified";
}

function stageRank(stage: string) {
  const idx = JOBS_STAGE_ORDER.indexOf(stage as (typeof JOBS_STAGE_ORDER)[number]);
  return idx === -1 ? 999 : idx;
}

function stageTone(stage: string): StageTone {
  if (stage === "hired" || stage === "offer") return "good";
  if (stage === "shortlisted" || stage === "interview") return "warn";
  if (stage === "rejected") return "danger";
  return "neutral";
}

function humanizeStage(stage: string, locale?: AppLocale) {
  const t = makeT(locale);
  if (!stage) return t("Applied");
  return t(
    stage
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
  );
}

function buildPipelineState(
  stages: string[],
  currentStage: string,
  locale?: AppLocale
): ApplicationStageStep[] {
  const normalized = [...new Set(stages.filter(Boolean))];
  if (normalized.length === 0) {
    normalized.push(...DEFAULT_PIPELINE);
  }

  if (!normalized.includes(currentStage)) {
    normalized.push(currentStage);
  }

  const currentIndex = normalized.indexOf(currentStage);

  return normalized.map((stage, index) => ({
    key: stage,
    label: humanizeStage(stage, locale),
    status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

function progressPercent(stage: string, pipeline: string[]) {
  const normalized = pipeline.length > 0 ? pipeline : [...DEFAULT_PIPELINE];
  const currentIndex = Math.max(normalized.indexOf(stage), 0);
  const denominator = Math.max(normalized.length - 1, 1);

  if (stage === "rejected" || stage === "hired") {
    return 100;
  }

  return Math.max(12, Math.round(((currentIndex + 1) / (denominator + 1)) * 100));
}

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function relativeStageGuidance(stage: string, locale?: AppLocale) {
  const t = makeT(locale);
  if (stage === "reviewing") {
    return {
      label: t("Sit tight—someone is reading your application"),
      body: t(
        "Your note and profile are with the hiring team. Refresh your resume and availability so you are easy to move forward if they reach out."
      ),
    };
  }

  if (stage === "shortlisted") {
    return {
      label: t("You made the first cut"),
      body: t(
        "Shortlist means they liked the match enough to look closer. Have examples ready, know your dates, and watch Applications for the next message."
      ),
    };
  }

  if (stage === "interview") {
    return {
      label: t("Interview season—prep like you mean it"),
      body: t(
        "This is the conversation stage. Bring clear stories, proof of impact, and honest answers about how you work."
      ),
    };
  }

  if (stage === "offer") {
    return {
      label: t("Read the offer like a grown-up contract"),
      body: t(
        "Check pay, title, start date, and who you report to. It is OK to ask quiet questions before you say yes."
      ),
    };
  }

  if (stage === "hired") {
    return {
      label: t("You closed the loop on this one"),
      body: t(
        "Congratulations. Tidy up saved roles and applications so your hub reflects where you are headed next."
      ),
    };
  }

  if (stage === "rejected") {
    return {
      label: t("Not this time—and that is information too"),
      body: t(
        "One role saying no does not define you. Tighten your story, then keep going; the board updates often."
      ),
    };
  }

  return {
    label: t("Keep your profile honest and complete"),
    body: t(
      "Strong basics—resume, skills, availability—make the next step easier whenever a recruiter looks your way."
    ),
  };
}

function profileChecklist(
  profile: CandidateProfile | null,
  documents: CandidateDocument[],
  locale?: AppLocale
): ProfileChecklistItem[] {
  const t = makeT(locale);
  const hasResume = documents.some((document) => document.kind === "resume");
  const hasPortfolio = documents.some((document) => document.kind === "portfolio") || (profile?.portfolioLinks.length ?? 0) > 0;

  return [
    {
      id: "identity",
      label: t("Basics and identity"),
      detail: t("Full name, phone, and location give recruiters a usable contact layer."),
      complete: Boolean(profile?.fullName && profile.phone && profile.location),
      href: "/candidate/profile",
    },
    {
      id: "story",
      label: t("Professional story"),
      detail: t("Headline and summary make the profile readable instead of blank metadata."),
      complete: Boolean(profile?.headline && profile.summary),
      href: "/candidate/profile",
    },
    {
      id: "skills",
      label: t("Skills and function fit"),
      detail: t("At least four clear skills and preferred functions improve role matching."),
      complete: (profile?.skills.length ?? 0) >= 4 && (profile?.preferredFunctions.length ?? 0) > 0,
      href: "/candidate/profile",
    },
    {
      id: "history",
      label: t("Work history"),
      detail: t("Recruiters need evidence of real operating range, not only a headline."),
      complete: (profile?.workHistory.length ?? 0) > 0 || (profile?.education.length ?? 0) > 0,
      href: "/candidate/profile",
    },
    {
      id: "resume",
      label: t("Resume uploaded"),
      detail: t("A resume is still the fastest way to raise application readiness."),
      complete: hasResume,
      href: "/candidate/files",
    },
    {
      id: "portfolio",
      label: t("Proof and portfolio"),
      detail: t("Portfolio links or proof files help shortlisted candidates move faster."),
      complete: hasPortfolio,
      href: "/candidate/files",
    },
  ];
}

function buildThreadActivity(
  application: JobApplication,
  thread: ConversationThread | null,
  messages: ConversationMessage[],
  locale?: AppLocale
): RecruiterActivity | null {
  const t = makeT(locale);
  const visibleMessages = messages.filter((message) => {
    const visibility = asNullableString(message.attachments[0]?.visibility);
    return message.senderType !== "internal_note" && visibility !== "internal";
  });
  const latest = [...visibleMessages].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))[0];

  if (!latest) return null;

  const attachment = asObject(latest.attachments[0]);
  const stage = asNullableString(attachment.stage) || application.stage;
  const title =
    asNullableString(attachment.type) === "timeline_event"
      ? `${humanizeStage(stage || application.stage, locale)} ${t("update")}`
      : t("Recruiter update");

  return {
    id: `${thread?.id || application.applicationId}-${latest.id}`,
    title,
    body:
      latest.body ||
      `${application.jobTitle} ${t("has a new recruiter-side update.")}`,
    createdAt: latest.createdAt,
    href: "/candidate/applications",
    tone: stageTone(stage || application.stage),
    source: "thread",
  };
}

function buildTimelineActivity(
  application: JobApplication,
  timeline: TimelineEvent[],
  locale?: AppLocale
): RecruiterActivity | null {
  const t = makeT(locale);
  const latest = [...timeline].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))[0];
  if (!latest) return null;

  const nextStage =
    asNullableString(latest.newValues.nextStage) ||
    asNullableString(latest.newValues.stage) ||
    application.stage;
  const isStageChange = latest.action === "jobs_application_stage_changed";

  return {
    id: `timeline-${latest.id}`,
    title: isStageChange
      ? `${humanizeStage(nextStage, locale)} ${t("stage")}`
      : humanizeStage(latest.action.replace(/^jobs_/, ""), locale),
    body:
      latest.reason ||
      (isStageChange
        ? `${application.jobTitle} ${t("moved into")} ${humanizeStage(nextStage, locale).toLowerCase()}.`
        : `${application.jobTitle} ${t("has a new hiring update.")}`),
    createdAt: latest.createdAt,
    href: "/candidate/applications",
    tone: stageTone(nextStage),
    source: "timeline",
  };
}

function buildRecommendationReason(input: {
  job: JobPost;
  profile: CandidateProfile | null;
  savedJobs: SavedJob[];
  applications: JobApplication[];
  locale?: AppLocale;
}) {
  const t = makeT(input.locale);
  const profileTerms = new Set(
    [
      ...(input.profile?.preferredFunctions ?? []),
      ...(input.profile?.skills ?? []),
      ...input.savedJobs.map((saved) => saved.job.categoryName),
      ...input.applications.map((application) => application.jobTitle),
    ]
      .map((value) => value.toLowerCase())
      .filter(Boolean)
  );

  const matchedSkill = input.job.skills.find((skill) => profileTerms.has(skill.toLowerCase()));
  if (matchedSkill) {
    return `${matchedSkill} ${t("already appears in your profile or current search lane.")}`;
  }

  if (input.profile?.preferredFunctions.some((item) => input.job.title.toLowerCase().includes(item.toLowerCase()))) {
    return t("The role title lines up with the functions you said you want next.");
  }

  if (input.job.employerVerification === "verified") {
    return t("This is a verified employer lane with clearer trust and response expectations.");
  }

  return t("This role fits the categories and trust signals you have been interacting with.");
}

function buildRecommendations(input: {
  jobs: JobPost[];
  profile: CandidateProfile | null;
  savedJobs: SavedJob[];
  applications: JobApplication[];
  locale?: AppLocale;
}): JobRecommendation[] {
  const excluded = new Set([
    ...input.savedJobs.map((item) => item.job.slug),
    ...input.applications.map((item) => item.jobSlug),
  ]);
  const preferenceTerms = new Set(
    [
      ...(input.profile?.preferredFunctions ?? []),
      ...(input.profile?.skills ?? []),
      ...input.savedJobs.map((item) => item.job.categoryName),
      ...input.savedJobs.map((item) => item.job.team),
      ...input.applications.map((item) => item.jobTitle),
    ]
      .map((value) => value.toLowerCase())
      .filter(Boolean)
  );

  return input.jobs
    .filter((job) => !excluded.has(job.slug))
    .map((job) => {
      let score = 10;
      if (job.featured) score += 12;
      if (job.employerVerification === "verified") score += 16;
      if (job.internal) score += 6;
      if (input.profile?.workModes.includes(job.workMode)) score += 10;
      if (preferenceTerms.has(job.categoryName.toLowerCase())) score += 12;
      if (preferenceTerms.has(job.team.toLowerCase())) score += 8;
      if (
        preferenceTerms.has(job.title.toLowerCase()) ||
        [...preferenceTerms].some((term) => term && job.title.toLowerCase().includes(term))
      ) {
        score += 14;
      }
      const skillMatches = job.skills.filter((skill) => preferenceTerms.has(skill.toLowerCase())).length;
      score += Math.min(skillMatches * 6, 18);

      return {
        job,
        score,
        reason: buildRecommendationReason({
          job,
          profile: input.profile,
          savedJobs: input.savedJobs,
          applications: input.applications,
          locale: input.locale,
        }),
      } satisfies JobRecommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function buildNextActions(input: {
  checklist: ProfileChecklistItem[];
  journeys: ApplicationJourney[];
  savedJobs: SavedJob[];
  locale?: AppLocale;
}): CandidateNextAction[] {
  const t = makeT(input.locale);
  const actions: CandidateNextAction[] = [];
  const incomplete = input.checklist.filter((item) => !item.complete);

  if (incomplete.length > 0) {
    actions.push({
      id: "profile-gap",
      label: t("Finish one profile piece"),
      body: `${incomplete[0].label} ${t("still needs love—recruiters notice the gaps first.")}`,
      href: incomplete[0].href,
      tone: "warn",
    });
  }

  const interviewJourney = input.journeys.find((journey) => journey.application.stage === "interview");
  if (interviewJourney) {
    actions.push({
      id: `interview-${interviewJourney.application.applicationId}`,
      label: t("Interview prep for this role"),
      body: `${interviewJourney.application.jobTitle} ${t("is in interview. Re-read the job, then check Applications for anything new from the team.")}`,
      href: "/candidate/applications",
      tone: "good",
    });
  }

  const offerJourney = input.journeys.find((journey) => journey.application.stage === "offer");
  if (offerJourney) {
    actions.push({
      id: `offer-${offerJourney.application.applicationId}`,
      label: t("Offer on the table"),
      body: `${offerJourney.application.jobTitle} ${t("reached offer. Read it slowly, then reply with calm questions if you need them.")}`,
      href: "/candidate/applications",
      tone: "good",
    });
  }

  if (input.journeys.length === 0 && input.savedJobs.length > 0) {
    actions.push({
      id: "saved-first",
      label: t("Turn a saved role into an application"),
      body: `${t("You bookmarked")} ${input.savedJobs[0].job.title}. ${t("If it still feels right, send a short, specific note while it is open.")}`,
      href: `/jobs/${input.savedJobs[0].job.slug}`,
      tone: "neutral",
    });
  }

  if (input.journeys.length === 0 && input.savedJobs.length === 0) {
    actions.push({
      id: "start-search",
      label: t("Browse open roles"),
      body: t("No saves or applications yet—pick a few roles that fit, save them, and apply when you are ready."),
      href: "/jobs",
      tone: "neutral",
    });
  }

  return actions.slice(0, 4);
}

function normalizeEmployerVerification(status: string | null | undefined) {
  if (status === "verified" || status === "watch" || status === "rejected") {
    return status;
  }
  return "pending";
}

function normalizeJobModerationStatus(
  status: string | null | undefined,
  metadata: Record<string, unknown>
): JobPost["moderationStatus"] {
  const explicit = asNullableString(metadata.moderationStatus);
  if (
    explicit === "approved" ||
    explicit === "pending_review" ||
    explicit === "flagged" ||
    explicit === "draft"
  ) {
    return explicit;
  }

  if (status === "published") return "approved";
  if (status === "flagged") return "flagged";
  if (status === "draft") return "draft";
  return "pending_review";
}

function activityIsJobPublished(row: Record<string, unknown>) {
  const item = asObject(row);
  const metadata = asObject(item.metadata);
  return asBoolean(metadata.isPublished, asString(item.status) === "published");
}

function latestRowsByReference(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const item = asObject(row);
    const referenceId = asString(item.reference_id || item.slug || item.id);
    if (!referenceId || map.has(referenceId)) continue;
    map.set(referenceId, item);
  }

  return map;
}

function buildEmployerProfile(input: {
  company: Record<string, unknown> | null;
  profileRow: Record<string, unknown> | null;
  verificationRow: Record<string, unknown> | null;
  openRoleCount: number;
}): EmployerProfile | null {
  const company = input.company ? asObject(input.company) : null;
  const profileRow = input.profileRow ? asObject(input.profileRow) : null;
  const verificationRow = input.verificationRow ? asObject(input.verificationRow) : null;
  const profile = profileRow ? asObject(profileRow.metadata) : {};
  const verification = verificationRow ? asObject(verificationRow.metadata) : {};
  const slug = asString(
    profile.employerSlug ||
      profileRow?.reference_id ||
      verification.employerSlug ||
      verificationRow?.reference_id ||
      company?.slug
  );

  if (!slug) return null;

  const verificationStatus = normalizeEmployerVerification(
    asNullableString(verification.status || verificationRow?.status || profile.verificationStatus)
  ) as EmployerProfile["verificationStatus"];
  const verificationNotes = [
    ...asStringArray(profile.verificationNotes),
    ...asStringArray(verification.verificationNotes),
    asString(verification.reason || verificationRow?.description),
  ].filter(Boolean);

  return {
    slug,
    name: asString(profile.name || company?.name || profileRow?.title, slug),
    tagline: asString(profile.tagline || company?.tagline),
    description:
      asString(profile.description) ||
      asString(company?.description) ||
      asString(profileRow?.description),
    website: asNullableString(profile.website || company?.href),
    logoUrl: asNullableString(profile.logoUrl || company?.logo_url),
    accent: asString(company?.accent || profile.accent, "#0E7C86"),
    industry: asString(profile.industry || company?.category, "Hiring Team"),
    locations: asStringArray(profile.locations),
    headcount: asNullableString(profile.headcount),
    remotePolicy: asNullableString(profile.remotePolicy),
    benefitsHeadline: asString(
      profile.benefitsHeadline,
      "Clear process, responsive communication, and serious hiring intent."
    ),
    culturePoints: asStringArray(profile.culturePoints),
    verificationStatus,
    trustScore: Math.min(
      asNumber(
        verification.trustScore,
        asNumber(profile.trustScore, verificationStatus === "verified" ? 82 : 54)
      ),
      100
    ),
    responseSlaHours: Math.max(asNumber(profile.responseSlaHours, 24), 0),
    employerType: asBoolean(profile.internal, profile.employerType === "internal" || slug.startsWith("henryco"))
      ? "internal"
      : "external",
    openRoleCount: input.openRoleCount,
    verificationNotes,
    updatedAt: asNullableString(profile.updatedAt || verification.updatedAt || profileRow?.created_at || company?.updated_at),
  };
}

function buildJobPost(input: {
  row: Record<string, unknown>;
  employer: EmployerProfile | null;
  applicationCount: number;
}): JobPost {
  const row = asObject(input.row);
  const content = asObject(row.metadata);
  const employerSlug =
    asString(content.employerSlug) ||
    input.employer?.slug ||
    asString(row.reference_id) ||
    "unknown";
  const employerName = asString(content.employerName) || input.employer?.name || "Employer";
  const salaryMin = normalizeSalaryAmount(asNullableNumber(content.salaryMin));
  const salaryMax = normalizeSalaryAmount(asNullableNumber(content.salaryMax));
  const currency = asString(content.currency, "NGN");
  const slug = asString(content.slug || row.reference_id || row.id);

  return {
    id: asString(row.id),
    slug,
    title: asString(content.title || row.title),
    subtitle: asString(content.subtitle || employerName),
    employerSlug,
    employerName,
    employerType: asBoolean(content.internal, input.employer?.employerType === "internal") ? "internal" : "external",
    categorySlug: asString(content.categorySlug, "operations"),
    categoryName: asString(content.categoryName, "Operations"),
    location: asString(content.location, "Remote"),
    workMode: (asNullableString(content.workMode) || "remote") as JobPost["workMode"],
    employmentType: asString(content.employmentType, "Full-time"),
    seniority: asString(content.seniority, "Mid-level"),
    team: asString(content.team, "Operations"),
    summary:
      asString(content.summary) ||
      asString(row.description) ||
      asString(row.title),
    description:
      asString(content.description) ||
      asString(row.description) ||
      asString(content.summary),
    responsibilities: asStringArray(content.responsibilities),
    requirements: asStringArray(content.requirements),
    benefits: asStringArray(content.benefits),
    skills: asStringArray(content.skills),
    salaryMin,
    salaryMax,
    currency,
    salaryLabel:
      sanitizeStoredSalaryLabel(asNullableString(content.salaryLabel)) ||
      formatSalaryLabel(salaryMin, salaryMax, currency),
    featured: asBoolean(content.featured),
    internal: asBoolean(content.internal),
    isPublished: activityIsJobPublished(row),
    moderationStatus: normalizeJobModerationStatus(asNullableString(row.status), content),
    employerVerification: asString(content.employerVerification || input.employer?.verificationStatus, "pending"),
    employerTrustScore: asNumber(content.employerTrustScore, input.employer?.trustScore ?? 54),
    employerResponseSlaHours: asNullableNumber(
      content.employerResponseSlaHours ?? input.employer?.responseSlaHours ?? null
    ),
    trustHighlights:
      asStringArray(content.trustHighlights).length > 0
        ? asStringArray(content.trustHighlights)
        : deriveJobTrustHighlights({
            employerVerificationStatus: asString(
              content.employerVerification || input.employer?.verificationStatus,
              "pending"
            ),
            employerTrustScore: asNumber(
              content.employerTrustScore,
              input.employer?.trustScore ?? 54
            ),
            responseSlaHours: asNullableNumber(
              content.employerResponseSlaHours ?? input.employer?.responseSlaHours ?? null
            ),
            employerType: asBoolean(content.internal, input.employer?.employerType === "internal")
              ? "internal"
              : "external",
          }),
    pipelineStages:
      asStringArray(content.pipelineStages).length > 0 ? asStringArray(content.pipelineStages) : [...DEFAULT_PIPELINE],
    postedAt: asString(content.postedAt || row.created_at, new Date().toISOString()),
    closesAt: asNullableString(content.closesAt),
    applicationCount: input.applicationCount,
  };
}

/**
 * Wave 2 i18n — translate the candidate/recruiter-facing prose on a
 * JobPost in place. `metadata` is the `customer_activity.metadata` JSON
 * column. `scope === "detail"` resolves the long-form fields rendered on
 * the posting detail page; `scope === "list"` is a cheaper variant used
 * by board/card surfaces. Brand strings, slugs, statuses, currency, and
 * pipeline keys are intentionally skipped — they are identifiers, not
 * prose.
 */
async function localizeJobPost(
  job: JobPost,
  metadata: Record<string, unknown>,
  locale: AppLocale | undefined,
  scope: "detail" | "list" = "detail",
): Promise<JobPost> {
  if (!locale || locale === "en") return job;
  if (scope === "list") {
    const [title, summary] = await Promise.all([
      localizeText(metadata, "title", job.title, locale),
      localizeText(metadata, "summary", job.summary, locale),
    ]);
    return { ...job, title, summary };
  }
  const [
    title,
    subtitle,
    summary,
    description,
    responsibilities,
    requirements,
    benefits,
    trustHighlights,
  ] = await Promise.all([
    localizeText(metadata, "title", job.title, locale),
    localizeText(metadata, "subtitle", job.subtitle, locale),
    localizeText(metadata, "summary", job.summary, locale),
    localizeText(metadata, "description", job.description, locale),
    localizeTextArray(metadata, "responsibilities", job.responsibilities, locale),
    localizeTextArray(metadata, "requirements", job.requirements, locale),
    localizeTextArray(metadata, "benefits", job.benefits, locale),
    localizeTextArray(metadata, "trustHighlights", job.trustHighlights, locale),
  ]);
  return {
    ...job,
    title,
    subtitle,
    summary,
    description,
    responsibilities,
    requirements,
    benefits,
    trustHighlights,
  };
}

/**
 * Wave 2 i18n — translate employer profile prose. Same scope split as
 * JobPost — list mode hits name + tagline, detail mode adds description,
 * benefitsHeadline, culturePoints, verificationNotes. `profileMetadata`
 * is the JSON column on the employer's `customer_activity` row.
 */
async function localizeEmployerProfile(
  employer: EmployerProfile,
  profileMetadata: Record<string, unknown>,
  locale: AppLocale | undefined,
  scope: "detail" | "list" = "detail",
): Promise<EmployerProfile> {
  if (!locale || locale === "en") return employer;
  if (scope === "list") {
    const [name, tagline] = await Promise.all([
      localizeText(profileMetadata, "name", employer.name, locale),
      localizeText(profileMetadata, "tagline", employer.tagline, locale),
    ]);
    return { ...employer, name, tagline };
  }
  const [
    name,
    tagline,
    description,
    benefitsHeadline,
    culturePoints,
    verificationNotes,
  ] = await Promise.all([
    localizeText(profileMetadata, "name", employer.name, locale),
    localizeText(profileMetadata, "tagline", employer.tagline, locale),
    localizeText(profileMetadata, "description", employer.description, locale),
    localizeText(profileMetadata, "benefitsHeadline", employer.benefitsHeadline, locale),
    localizeTextArray(profileMetadata, "culturePoints", employer.culturePoints, locale),
    localizeTextArray(
      profileMetadata,
      "verificationNotes",
      employer.verificationNotes,
      locale,
    ),
  ]);
  return {
    ...employer,
    name,
    tagline,
    description,
    benefitsHeadline,
    culturePoints,
    verificationNotes,
  };
}

function buildApplication(row: Record<string, unknown>): JobApplication {
  const item = asObject(row);
  const metadata = asObject(item.metadata);

  return {
    rowId: asString(item.id),
    applicationId: asString(item.reference_id || item.id),
    candidateUserId: asString(item.user_id),
    candidateName: asString(metadata.candidateName || metadata.fullName, "Candidate"),
    candidateEmail: asNullableString(metadata.candidateEmail),
    candidatePhone: asNullableString(metadata.candidatePhone),
    jobSlug: asString(metadata.jobSlug),
    jobTitle: asString(metadata.jobTitle),
    employerSlug: asString(metadata.employerSlug),
    employerName: asString(metadata.employerName),
    stage: asString(metadata.stage || item.status, "applied"),
    status: asString(item.status, "applied"),
    createdAt: asString(item.created_at, new Date().toISOString()),
    updatedAt: asNullableString(metadata.updatedAt),
    coverNote: asString(metadata.coverNote),
    availability: asNullableString(metadata.availability),
    salaryExpectation: asNullableString(metadata.salaryExpectation),
    recruiterConfidence: Math.min(asNumber(metadata.recruiterConfidence, 48), 100),
    candidateReadiness: Math.min(asNumber(metadata.candidateReadiness, 48), 100),
    internal: asBoolean(metadata.internal),
    metadata,
  };
}

async function buildDocument(
  row: Record<string, unknown>,
  admin = createAdminSupabase()
): Promise<CandidateDocument> {
  const item = asObject(row);
  const metadata = asObject(item.metadata);
  let fileUrl = asString(item.file_url);
  const storageBucket = asNullableString(metadata.storageBucket);
  const storagePath = asNullableString(metadata.storagePath || metadata.publicId);

  if (storageBucket && storagePath) {
    const signed = await admin.storage.from(storageBucket).createSignedUrl(storagePath, 60 * 60);
    if (!signed.error && signed.data?.signedUrl) {
      fileUrl = signed.data.signedUrl;
    }
  }

  return {
    id: asString(item.id),
    name: asString(item.name, "Document"),
    kind: asString(metadata.documentKind || item.type, "file"),
    fileUrl,
    mimeType: asNullableString(item.mime_type),
    fileSize: asNullableNumber(item.file_size),
    createdAt: asString(item.created_at, new Date().toISOString()),
    metadata,
  };
}

function buildNotification(row: Record<string, unknown>): JobsNotification {
  const item = asObject(row);
  return {
    id: asString(item.id),
    title: asString(item.title),
    body: asString(item.body),
    priority: asNullableString(item.priority),
    actionUrl: asNullableString(item.action_url),
    actionLabel: asNullableString(item.action_label),
    isRead: asBoolean(item.is_read),
    createdAt: asString(item.created_at, new Date().toISOString()),
  };
}

function buildThread(row: Record<string, unknown>): ConversationThread {
  const item = asObject(row);
  return {
    id: asString(item.id),
    subject: asString(item.subject),
    status: asString(item.status, "open"),
    priority: asNullableString(item.priority),
    referenceType: asNullableString(item.reference_type),
    referenceId: asNullableString(item.reference_id),
    updatedAt: asString(item.updated_at || item.created_at, new Date().toISOString()),
  };
}

function buildMessage(row: Record<string, unknown>): ConversationMessage {
  const item = asObject(row);
  return {
    id: asString(item.id),
    senderId: asNullableString(item.sender_id),
    senderType: asNullableString(item.sender_type),
    body: asString(item.body),
    attachments: asObjectArray(item.attachments),
    createdAt: asString(item.created_at, new Date().toISOString()),
  };
}

function buildAudit(row: Record<string, unknown>): TimelineEvent {
  const item = asObject(row);
  return {
    id: asString(item.id),
    action: asString(item.action),
    actorRole: asNullableString(item.actor_role),
    reason: asNullableString(item.reason),
    createdAt: asString(item.created_at, new Date().toISOString()),
    newValues: asObject(item.new_values),
  };
}

function buildModerationCase(row: Record<string, unknown>): ModerationCase {
  const item = asObject(row);
  return {
    id: asString(item.id),
    entityType: asString(item.entity_type),
    entityId: asString(item.entity_id),
    action: asString(item.action),
    reason: asNullableString(item.reason),
    actorRole: asNullableString(item.actor_role),
    createdAt: asString(item.created_at, new Date().toISOString()),
    details: asObject(item.new_values),
  };
}

export async function getInternalProfile(userId: string) {
  const admin = createAdminSupabase();
  const [profileRes, ownerRes] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.from("owner_profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    profile: profileRes.data ? asObject(profileRes.data) : null,
    ownerProfile: ownerRes.data ? asObject(ownerRes.data) : null,
  };
}

export async function getEmployerMembershipsByUser(
  userId: string,
  email?: string | null
): Promise<EmployerMembership[]> {
  const admin = createAdminSupabase();
  const normalized = normalizeEmail(email);

  const byUserPromise = admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP)
    .eq("user_id", userId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  const byEmailPromise = normalized
    ? admin
        .from("customer_activity")
        .select("*")
        .eq("division", JOBS_DIVISION)
        .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP)
        .contains("metadata", { normalizedEmail: normalized })
        .neq("status", "revoked")
        .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const [byUser, byEmail] = await Promise.all([byUserPromise, byEmailPromise]);
  const rows = [...(byUser.data ?? []), ...(byEmail.data ?? [])];
  const seen = new Set<string>();

  return rows
    .map((row) => {
      const item = asObject(row);
      const metadata = asObject(item.metadata);
      const employerSlug = asString(metadata.employerSlug || item.reference_id);
      if (!employerSlug || seen.has(employerSlug)) return null;
      seen.add(employerSlug);
      return {
        activityId: asString(item.id),
        employerSlug,
        employerName: asString(metadata.employerName, employerSlug),
        membershipRole: (asNullableString(metadata.membershipRole) || "owner") as EmployerMembership["membershipRole"],
        status: asString(item.status, "active"),
      } satisfies EmployerMembership;
    })
    .filter(Boolean) as EmployerMembership[];
}

export async function getCandidateProfileByUserId(
  userId: string,
  locale?: AppLocale
): Promise<CandidateProfile | null> {
  const admin = createAdminSupabase();
  const [baseRes, profileRes, docsRes] = await Promise.all([
    admin.from("customer_profiles").select("*").eq("id", userId).maybeSingle(),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_PROFILE)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("customer_documents")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const base = asObject(baseRes.data);
  const profileRow = asObject(profileRes.data);
  const profile = asObject(profileRow.metadata);
  const documents = await Promise.all(
    (docsRes.data ?? []).map((row) => buildDocument(row as Record<string, unknown>, admin))
  );

  if (!baseRes.data && !profileRes.data) {
    return null;
  }

  const completionScore = calculateCompletionScore({
    profile,
    base,
    documents,
  });
  const verificationStatus = toCandidateVerificationStatus(
    asNullableString(base.verification_status) ||
      (asBoolean(base.is_verified) ? "verified" : null) ||
      asNullableString(profile.verificationStatus)
  );
  const trustScore = calculateTrustScore({ completionScore, verificationStatus, documents });

  // Wave 2 i18n — translate the candidate-written bio fields. Skills,
  // portfolio links, work history (structured records), and timestamps stay
  // as-is.
  const headlineSource = asString(profile.headline);
  const summarySource = asString(profile.summary);
  const [headline, summary] = await Promise.all([
    localizeText(profile, "headline", headlineSource, locale),
    localizeText(profile, "summary", summarySource, locale),
  ]);

  return {
    userId,
    email: asNullableString(base.email),
    fullName: asNullableString(base.full_name),
    phone: asNullableString(base.phone),
    avatarUrl: asNullableString(base.avatar_url),
    headline,
    summary,
    location: asString(profile.location),
    timezone: asNullableString(base.timezone),
    workModes: asStringArray(profile.workModes),
    roleTypes: asStringArray(profile.roleTypes),
    preferredFunctions: asStringArray(profile.preferredFunctions),
    salaryExpectation: asNullableString(profile.salaryExpectation),
    availability: asNullableString(profile.availability),
    portfolioLinks: asStringArray(profile.portfolioLinks),
    workHistory: asObjectArray(profile.workHistory),
    education: asObjectArray(profile.education),
    certifications: asObjectArray(profile.certifications),
    skills: asStringArray(profile.skills),
    completionScore,
    trustScore,
    verificationStatus,
    readinessLabel: getReadinessLabel(trustScore, locale),
    updatedAt: asNullableString(profile.updatedAt || profileRow.created_at),
  };
}

export async function getCandidateDocuments(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_documents")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return Promise.all((data ?? []).map((row) => buildDocument(row as Record<string, unknown>, admin)));
}

export async function getEmployerProfiles(options?: {
  includeUnpublished?: boolean;
  locale?: AppLocale;
}) {
  await ensureJobsBootstrap();
  const admin = createAdminSupabase();
  const [companiesRes, profileRowsRes, verificationRowsRes, jobsRes] = await Promise.all([
    admin.from("companies").select("*").order("sort_order", { ascending: true }).order("name"),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_PROFILE)
      .order("created_at", { ascending: false }),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_VERIFICATION)
      .order("created_at", { ascending: false }),
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_JOB_POST)
      .order("created_at", { ascending: false }),
  ]);

  const companyRows = (companiesRes.data ?? []) as Array<Record<string, unknown>>;
  const profileRows = (profileRowsRes.data ?? []) as Array<Record<string, unknown>>;
  const verificationRows = (verificationRowsRes.data ?? []) as Array<Record<string, unknown>>;
  const jobRows = ((jobsRes.data ?? []) as Array<Record<string, unknown>>).filter(
    (row) => options?.includeUnpublished || activityIsJobPublished(row as Record<string, unknown>)
  );
  const counts = new Map<string, number>();

  for (const jobRow of jobRows) {
    const content = asObject((jobRow as Record<string, unknown>).metadata);
    const slug = asString(content.employerSlug);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  const companyMap = new Map(companyRows.map((company) => [asString(company.slug), company]));
  const profileMap = latestRowsByReference(profileRows);
  const verificationMap = latestRowsByReference(verificationRows);
  const slugs = new Set([
    ...profileMap.keys(),
    ...verificationMap.keys(),
    ...counts.keys(),
  ]);

  const built = [...slugs]
    .map((slug) => {
      const profileRow = profileMap.get(slug) ?? null;
      const employer = buildEmployerProfile({
        company: companyMap.get(slug) ?? null,
        profileRow,
        verificationRow: verificationMap.get(slug) ?? null,
        openRoleCount: counts.get(slug) ?? 0,
      });
      return employer ? { employer, profileMetadata: asObject(profileRow?.metadata) } : null;
    })
    .filter((value): value is { employer: EmployerProfile; profileMetadata: Record<string, unknown> } =>
      Boolean(value),
    )
    .filter(({ employer }) => !isJobsVerificationSynthetic(employer.name));

  // Wave 2 i18n — list scope: name + tagline only. Detail surfaces call
  // `getEmployerProfileBySlug` which upgrades to detail scope.
  const localized = await Promise.all(
    built.map(({ employer, profileMetadata }) =>
      localizeEmployerProfile(employer, profileMetadata, options?.locale, "list"),
    ),
  );

  return localized.sort((a, b) => {
    if (b.openRoleCount !== a.openRoleCount) return b.openRoleCount - a.openRoleCount;
    return a.name.localeCompare(b.name);
  }) as EmployerProfile[];
}

export async function getEmployerProfileBySlug(
  slug: string,
  options?: { includeUnpublished?: boolean; locale?: AppLocale }
) {
  const [employers, jobs] = await Promise.all([
    getEmployerProfiles(options),
    getJobPosts(options),
  ]);
  let employer = employers.find((item) => item.slug === slug) ?? null;
  if (!employer) return null;

  // Wave 2 i18n — detail surface: pull the employer profile row again so
  // we can resolve description, benefitsHeadline, culturePoints,
  // verificationNotes against the metadata blob.
  if (options?.locale && options.locale !== "en") {
    const admin = createAdminSupabase();
    const { data: profileRowRaw } = await admin
      .from("customer_activity")
      .select("metadata")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_PROFILE)
      .eq("reference_id", slug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const profileMetadata = asObject(asObject(profileRowRaw).metadata);
    employer = await localizeEmployerProfile(employer, profileMetadata, options.locale, "detail");
  }

  return {
    employer,
    jobs: jobs.filter((job) => job.employerSlug === slug),
  };
}

export async function getJobPosts(options?: {
  includeUnpublished?: boolean;
  employerSlug?: string;
  internalOnly?: boolean;
  locale?: AppLocale;
}) {
  await ensureJobsBootstrap();
  const admin = createAdminSupabase();
  const [rowsRes, applicationsRes, employers] = await Promise.all([
    admin
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_JOB_POST)
      .order("created_at", { ascending: false }),
    admin
      .from("customer_activity")
      .select("metadata")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION),
    getEmployerProfiles({ includeUnpublished: true, locale: options?.locale }),
  ]);

  const employerMap = new Map(employers.map((employer) => [employer.slug, employer]));
  const applicationCountMap = new Map<string, number>();

  for (const item of applicationsRes.data ?? []) {
    const metadata = asObject((item as Record<string, unknown>).metadata);
    const jobSlug = asString(metadata.jobSlug);
    if (!jobSlug) continue;
    applicationCountMap.set(jobSlug, (applicationCountMap.get(jobSlug) ?? 0) + 1);
  }

  const built = ((rowsRes.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const metadata = asObject(row.metadata);
      const job = buildJobPost({
        row,
        employer: employerMap.get(asString(metadata.employerSlug)) ?? null,
        applicationCount:
          applicationCountMap.get(asString(metadata.slug || row.reference_id)) ?? 0,
      });
      return { job, metadata };
    })
    .filter(
      ({ job }) =>
        !isJobsVerificationSynthetic(job.title) &&
        !isJobsVerificationSynthetic(job.employerName),
    )
    .filter(({ job }) => (options?.includeUnpublished ? true : job.isPublished))
    .filter(({ job }) =>
      options?.employerSlug ? job.employerSlug === options.employerSlug : true,
    )
    .filter(({ job }) => (options?.internalOnly ? job.internal : true));

  // Collapse duplicate postings for the same slug — rows arrive newest-first
  // (created_at desc), so the first occurrence wins. This guards against a
  // legacy random-id row co-existing with the deterministic seeded row (the
  // postings read is the one path with no natural-key collapse, unlike
  // `latestRowsByReference` on the employer side).
  const seenSlugs = new Set<string>();
  const deduped = built.filter(({ job }) => {
    if (seenSlugs.has(job.slug)) return false;
    seenSlugs.add(job.slug);
    return true;
  });

  // Wave 2 i18n — list scope keeps it cheap: title + summary only.
  // `getJobPostBySlug` upgrades to detail scope below.
  const localized = await Promise.all(
    deduped.map(({ job, metadata }) => localizeJobPost(job, metadata, options?.locale, "list")),
  );

  return localized.sort((a, b) => {
    if (b.featured !== a.featured) return Number(b.featured) - Number(a.featured);
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
  });
}

export async function getJobPostBySlug(
  slug: string,
  options?: { includeUnpublished?: boolean; locale?: AppLocale },
) {
  // Wave 2 i18n — fetch the list (which only does list-scope translation)
  // then upgrade the matching detail to full-scope translation by replaying
  // the resolver against the original row metadata.
  const jobs = await getJobPosts({
    includeUnpublished: options?.includeUnpublished,
    locale: options?.locale,
  });
  const job = jobs.find((item) => item.slug === slug) ?? null;
  if (!job) return null;
  if (!options?.locale || options.locale === "en") return job;

  const admin = createAdminSupabase();
  const { data: rowRaw } = await admin
    .from("customer_activity")
    .select("metadata")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_JOB_POST)
    .eq("reference_id", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const metadata = asObject(asObject(rowRaw).metadata);
  return localizeJobPost(job, metadata, options.locale, "detail");
}

export async function searchJobs(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  locale?: AppLocale,
) {
  const jobs = await getJobPosts({ locale });
  const getValue = (key: string) =>
    params instanceof URLSearchParams
      ? params.get(key)
      : Array.isArray(params[key])
        ? params[key]?.[0]
        : params[key];

  const q = asString(getValue("q")).toLowerCase();
  const category = asString(getValue("category")).toLowerCase();
  const employer = asString(getValue("employer")).toLowerCase();
  const workMode = asString(getValue("mode")).toLowerCase();
  const type = asString(getValue("type")).toLowerCase();
  const loc = asString(getValue("loc")).toLowerCase().trim();
  const internalOnly = asString(getValue("internal")) === "1";
  const verifiedOnly = asString(getValue("verified")) === "1";

  return jobs.filter((job) => {
    if (category && job.categorySlug !== category) return false;
    if (employer && job.employerSlug !== employer) return false;
    if (workMode && job.workMode !== workMode) return false;
    if (type && job.employmentType.toLowerCase() !== type) return false;
    if (loc && !job.location.toLowerCase().includes(loc)) return false;
    if (internalOnly && !job.internal) return false;
    if (verifiedOnly && job.employerVerification !== "verified") return false;
    if (!q) return true;

    return [
      job.title,
      job.summary,
      job.description,
      job.team,
      job.location,
      job.categoryName,
      job.employerName,
      ...job.skills,
      ...job.requirements,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

async function computeJobsHomeData(locale?: AppLocale): Promise<JobsHomeData> {
  const t = makeT(locale);
  const [jobs, employers] = await Promise.all([
    getJobPosts({ locale }),
    getEmployerProfiles({ locale }),
  ]);
  const categoriesMap = new Map<string, { slug: string; name: string; count: number }>();

  for (const job of jobs) {
    const existing = categoriesMap.get(job.categorySlug) ?? {
      slug: job.categorySlug,
      name: job.categoryName,
      count: 0,
    };
    existing.count += 1;
    categoriesMap.set(job.categorySlug, existing);
  }

  return {
    featuredJobs: jobs.filter((job) => job.featured).slice(0, 6),
    latestJobs: jobs.slice(0, 9),
    internalJobs: jobs.filter((job) => job.internal).slice(0, 4),
    employers: employers.filter((employer) => employer.openRoleCount > 0).slice(0, 8),
    categories: [...categoriesMap.values()].sort((a, b) => b.count - a.count),
    differentiators: getJobsDifferentiators(locale),
    stats: [
      {
        label: t("Open roles"),
        value: String(jobs.length),
        detail: t("Live roles published into the Henry Onyx hiring operating system."),
      },
      {
        label: t("Verified employers"),
        value: String(employers.filter((employer) => employer.verificationStatus === "verified").length),
        detail: t("Employer profiles with verification maturity visible to candidates."),
      },
      {
        label: t("Internal tracks"),
        value: String(jobs.filter((job) => job.internal).length),
        detail: t("Henry Onyx internal openings running inside the same platform."),
      },
    ],
  };
}

// Public, non-personalized jobs homepage/catalog read, cached 60s and shared
// across serverless instances so anonymous renders never hang on a saturated
// DB. Reads ONLY service-role catalog data via createAdminSupabase (job posts +
// employer profiles) — no cookies/headers/session/viewer. The public locale is
// resolved SEPARATELY in the page via getJobsPublicLocale and passed in as a
// plain argument (unstable_cache keys per-locale on it). Writes bust it via
// revalidateTag("jobs-home").
export const getJobsHomeData = unstable_cache(
  computeJobsHomeData,
  ["jobs-home-data"],
  { revalidate: 60, tags: ["jobs-home"] },
);

export async function getCandidateApplications(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => buildApplication(row as Record<string, unknown>));
}

export async function getSavedJobs(userId: string): Promise<SavedJob[]> {
  const [savedRows, jobs] = await Promise.all([
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_SAVED)
      .eq("user_id", userId)
      .eq("status", "saved")
      .order("created_at", { ascending: false }),
    getJobPosts({ includeUnpublished: true }),
  ]);
  const jobMap = new Map(jobs.map((job) => [job.slug, job]));

  return (savedRows.data ?? [])
    .map((row) => {
      const item = asObject(row);
      const metadata = asObject(item.metadata);
      const slug = asString(metadata.jobSlug);
      const job = jobMap.get(slug);
      if (!job) return null;
      return {
        id: asString(item.id),
        createdAt: asString(item.created_at, new Date().toISOString()),
        job,
      } satisfies SavedJob;
    })
    .filter(Boolean) as SavedJob[];
}

export async function getJobAlerts(userId: string): Promise<JobAlert[]> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_ALERT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const item = asObject(row);
    const metadata = asObject(item.metadata);
    return {
      id: asString(item.id),
      label: asString(metadata.label, "Jobs alert"),
      status: asString(item.status, "active"),
      createdAt: asString(item.created_at, new Date().toISOString()),
      criteria: metadata,
    } satisfies JobAlert;
  });
}

export async function getJobsNotifications(userId: string, locale?: AppLocale) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("division", JOBS_DIVISION)
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((row) => buildNotification(row as Record<string, unknown>));
  if (!locale || locale === "en") return rows;

  // Wave 2 i18n — notifications carry their text on the row itself
  // (`title`, `body`). The cached DeepL pipeline fills the gap when the
  // signal-producing surface didn't pre-translate.
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      title: await localizeText({ title: row.title }, "title", row.title, locale),
      body: await localizeText({ body: row.body }, "body", row.body, locale),
    })),
  );
}

export async function getJobsThreads(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("division", JOBS_DIVISION)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => buildThread(row as Record<string, unknown>));
}

export async function getThreadMessages(threadId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => buildMessage(row as Record<string, unknown>));
}

export async function getApplicationTimeline(applicationId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("audit_logs")
    .select("*")
    .eq("entity_type", "jobs_application")
    .eq("entity_id", applicationId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => buildAudit(row as Record<string, unknown>));
}

export async function getApplicationById(applicationId: string, locale?: AppLocale) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
    .eq("reference_id", applicationId)
    .maybeSingle();

  if (!data) return null;
  const application = buildApplication(data as Record<string, unknown>);
  if (!locale || locale === "en") return application;
  // Wave 2 i18n — translate the candidate-authored cover note. jobTitle
  // and employerName are denormalized identifiers tied to the JobPost
  // row; we leave them so the linked job page stays the source of truth.
  const metadata = asObject((data as Record<string, unknown>).metadata);
  const [coverNote] = await Promise.all([
    localizeText(metadata, "coverNote", application.coverNote, locale),
  ]);
  return { ...application, coverNote };
}

export async function getCandidateDashboardData(
  userId: string,
  locale?: AppLocale
): Promise<CandidateDashboardData> {
  const [profile, documents, applications, savedJobs, alerts, notifications, threads, jobs] = await Promise.all([
    getCandidateProfileByUserId(userId, locale),
    getCandidateDocuments(userId),
    getCandidateApplications(userId),
    getSavedJobs(userId),
    getJobAlerts(userId),
    getJobsNotifications(userId, locale),
    getJobsThreads(userId),
    getJobPosts({ locale }),
  ]);
  const applicationIds = applications.map((application) => application.applicationId);
  const threadIds = threads.map((thread) => thread.id);
  const admin = createAdminSupabase();

  const [messageRows, timelineRows] = await Promise.all([
    threadIds.length > 0
      ? admin.from("support_messages").select("*").in("thread_id", threadIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    applicationIds.length > 0
      ? admin
          .from("audit_logs")
          .select("*")
          .eq("entity_type", "jobs_application")
          .in("entity_id", applicationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const jobMap = new Map(jobs.map((job) => [job.slug, job]));
  const threadMap = new Map(threads.map((thread) => [thread.referenceId || "", thread]));
  const messagesByThreadId = new Map<string, ConversationMessage[]>();
  const timelineByApplicationId = new Map<string, TimelineEvent[]>();

  for (const row of (messageRows.data ?? []) as Array<Record<string, unknown>>) {
    const message = buildMessage(row);
    const threadId = asString(row.thread_id);
    const existing = messagesByThreadId.get(threadId) ?? [];
    existing.push(message);
    messagesByThreadId.set(threadId, existing);
  }

  for (const row of (timelineRows.data ?? []) as Array<Record<string, unknown>>) {
    const event = buildAudit(row);
    const applicationId = asString(row.entity_id);
    const existing = timelineByApplicationId.get(applicationId) ?? [];
    existing.push(event);
    timelineByApplicationId.set(applicationId, existing);
  }

  const applicationJourneys = applications
    .map((application) => {
      const job = jobMap.get(application.jobSlug) ?? null;
      const thread = threadMap.get(application.applicationId) ?? null;
      const sharedMessages = thread ? messagesByThreadId.get(thread.id) ?? [] : [];
      const timeline = timelineByApplicationId.get(application.applicationId) ?? [];
      const pipelineSource = job?.pipelineStages.length ? job.pipelineStages : DEFAULT_PIPELINE;
      const pipeline = buildPipelineState(pipelineSource, application.stage, locale);
      const threadActivity = buildThreadActivity(application, thread, sharedMessages, locale);
      const timelineActivity = buildTimelineActivity(application, timeline, locale);
      const latestSharedUpdate = [threadActivity, timelineActivity]
        .filter(Boolean)
        .sort((a, b) => toTimestamp(b!.createdAt) - toTimestamp(a!.createdAt))[0] ?? null;
      const nextStep = relativeStageGuidance(application.stage, locale);

      return {
        application,
        job,
        thread,
        timeline: [...timeline].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)),
        sharedMessages: [...sharedMessages].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)),
        pipeline,
        stageTone: stageTone(application.stage),
        stageLabel: humanizeStage(application.stage, locale),
        progressPercent: progressPercent(application.stage, pipelineSource),
        latestSharedUpdate,
        recruiterActionLabel: latestSharedUpdate?.title || nextStep.label,
        recruiterActionBody: latestSharedUpdate?.body || nextStep.body,
        recruiterActionAt: latestSharedUpdate?.createdAt || application.updatedAt || application.createdAt,
        nextStepLabel: nextStep.label,
        nextStepBody: nextStep.body,
      } satisfies ApplicationJourney;
    })
    .sort((a, b) => toTimestamp(b.recruiterActionAt) - toTimestamp(a.recruiterActionAt));

  const checklist = profileChecklist(profile, documents, locale);
  const recommendedJobs = buildRecommendations({
    jobs,
    profile,
    savedJobs,
    applications,
    locale,
  });
  const recruiterFeed = [
    ...notifications.map(
      (notification) =>
        ({
          id: `notification-${notification.id}`,
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
          href: notification.actionUrl,
          tone:
            notification.priority === "high"
              ? "warn"
              : notification.priority === "urgent"
                ? "danger"
                : "neutral",
          source: "notification",
        }) satisfies RecruiterActivity
    ),
    ...applicationJourneys
      .map((journey) => journey.latestSharedUpdate)
      .filter(Boolean)
      .map((item) => item as RecruiterActivity),
  ]
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    .slice(0, 8);
  const nextActions = buildNextActions({
    checklist,
    journeys: applicationJourneys,
    savedJobs,
    locale,
  });

  return {
    profile,
    documents,
    applications,
    savedJobs,
    alerts,
    notifications,
    threads,
    pipelineSummary: [...applications]
      .sort((a, b) => stageRank(a.stage) - stageRank(b.stage))
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.stage] = (acc[item.stage] ?? 0) + 1;
        return acc;
      }, {}),
    applicationJourneys,
    nextActions,
    profileChecklist: checklist,
    recommendedJobs,
    recruiterFeed,
  };
}

export async function getEmployerDashboardData(
  userId: string,
  email?: string | null,
  locale?: AppLocale
) {
  const [memberships, jobs, applications, notifications] = await Promise.all([
    getEmployerMembershipsByUser(userId, email),
    getJobPosts({ includeUnpublished: true, locale }),
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
      .order("created_at", { ascending: false }),
    getJobsNotifications(userId, locale),
  ]);
  const employerSlugs = new Set(memberships.map((membership) => membership.employerSlug));
  const employerJobs = jobs.filter((job) => employerSlugs.has(job.employerSlug));
  const employerApplications = (applications.data ?? [])
    .map((row) => buildApplication(row as Record<string, unknown>))
    .filter((application) => employerSlugs.has(application.employerSlug))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    memberships,
    jobs: employerJobs,
    applications: employerApplications,
    notifications,
    stageSummary: employerApplications.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export async function getRecruiterOverviewData(locale?: AppLocale) {
  const [jobs, employers, profileRows, applicationRows, auditRows, threads] = await Promise.all([
    getJobPosts({ includeUnpublished: true, locale }),
    getEmployerProfiles({ includeUnpublished: true, locale }),
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_PROFILE)
      .order("created_at", { ascending: false }),
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
      .order("created_at", { ascending: false }),
    createAdminSupabase()
      .from("audit_logs")
      .select("*")
      .or("entity_type.eq.jobs_application,entity_type.eq.jobs_employer,entity_type.eq.jobs_post")
      .order("created_at", { ascending: false })
      .limit(100),
    createAdminSupabase()
      .from("support_threads")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  const profiles = await Promise.all(
    (profileRows.data ?? [])
      .map((row) => asString((row as Record<string, unknown>).user_id))
      .filter(Boolean)
      .map((userId) => getCandidateProfileByUserId(userId, locale))
  );

  const applications = (applicationRows.data ?? [])
    .map((row) => buildApplication(row as Record<string, unknown>))
    .sort((a, b) => stageRank(a.stage) - stageRank(b.stage));

  return {
    jobs,
    employers,
    candidateProfiles: profiles.filter(Boolean),
    applications,
    moderationCases: (auditRows.data ?? [])
      .map((row) => buildModerationCase(row as Record<string, unknown>))
      .filter((item) => item.action.includes("flag") || item.action.includes("verification") || item.action.includes("reject"))
      .slice(0, 20),
    history: (auditRows.data ?? []).map((row) => buildAudit(row as Record<string, unknown>)),
    threads: (threads.data ?? []).map((row) => buildThread(row as Record<string, unknown>)),
  };
}

export async function getAnalyticsSnapshot() {
  const [jobs, employers, applications] = await Promise.all([
    getJobPosts({ includeUnpublished: true }),
    getEmployerProfiles({ includeUnpublished: true }),
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION),
  ]);

  const mappedApplications = (applications.data ?? []).map((row) => buildApplication(row as Record<string, unknown>));
  const stageCounts = mappedApplications.reduce<Record<string, number>>((acc, item) => {
    acc[item.stage] = (acc[item.stage] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalJobs: jobs.length,
    liveJobs: jobs.filter((job) => job.isPublished).length,
    draftJobs: jobs.filter((job) => !job.isPublished).length,
    employers: employers.length,
    verifiedEmployers: employers.filter((employer) => employer.verificationStatus === "verified").length,
    applications: mappedApplications.length,
    shortlisted: stageCounts.shortlisted ?? 0,
    interviewing: stageCounts.interview ?? 0,
    offers: stageCounts.offer ?? 0,
    hires: stageCounts.hired ?? 0,
    rejected: stageCounts.rejected ?? 0,
    stageCounts,
  };
}

export async function getModerationQueue() {
  const [jobs, employers, auditRows] = await Promise.all([
    getJobPosts({ includeUnpublished: true }),
    getEmployerProfiles({ includeUnpublished: true }),
    createAdminSupabase()
      .from("audit_logs")
      .select("*")
      .or("entity_type.eq.jobs_post,entity_type.eq.jobs_employer,entity_type.eq.jobs_application")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  return {
    pendingJobs: jobs.filter((job) => job.moderationStatus !== "approved"),
    pendingEmployers: employers.filter((employer) => employer.verificationStatus !== "verified"),
    cases: (auditRows.data ?? [])
      .map((row) => buildModerationCase(row as Record<string, unknown>))
      .filter((item) => item.action.includes("flag") || item.action.includes("review") || item.action.includes("verification"))
      .slice(0, 40),
  };
}
