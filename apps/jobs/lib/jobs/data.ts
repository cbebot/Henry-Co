import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail } from "@/lib/env";
import { DEFAULT_PIPELINE, JOBS_DIFFERENTIATORS } from "@/lib/jobs/content";
import type {
  CandidateDocument,
  CandidateProfile,
  ConversationMessage,
  ConversationThread,
  EmployerMembership,
  EmployerProfile,
  JobAlert,
  JobApplication,
  JobPost,
  JobsHomeData,
  JobsNotification,
  ModerationCase,
  SavedJob,
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

function formatSalaryLabel(min: number | null, max: number | null, currency = "NGN") {
  if (min == null && max == null) return null;
  const formatter = new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (min != null && max != null) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (min != null) {
    return `${formatter.format(min)}+`;
  }

  return `Up to ${formatter.format(max ?? 0)}`;
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
  verificationStatus: string;
  documents: CandidateDocument[];
}) {
  let score = input.completionScore;
  if (input.verificationStatus === "verified") score += 18;
  if (input.documents.some((doc) => doc.kind === "certification")) score += 6;
  if (input.documents.some((doc) => doc.kind === "portfolio")) score += 4;
  return Math.min(score, 100);
}

function getReadinessLabel(score: number) {
  if (score >= 88) return "Interview-ready";
  if (score >= 68) return "Strong profile";
  if (score >= 45) return "Needs proof";
  return "Needs structure";
}

function stageRank(stage: string) {
  const order = ["applied", "reviewing", "shortlisted", "interview", "offer", "hired", "rejected"];
  const idx = order.indexOf(stage);
  return idx === -1 ? 999 : idx;
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
  const salaryMin = asNullableNumber(content.salaryMin);
  const salaryMax = asNullableNumber(content.salaryMax);
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
      asNullableString(content.salaryLabel) || formatSalaryLabel(salaryMin, salaryMax, currency),
    featured: asBoolean(content.featured),
    internal: asBoolean(content.internal),
    isPublished: activityIsJobPublished(row),
    moderationStatus: normalizeJobModerationStatus(asNullableString(row.status), content),
    employerVerification: asString(content.employerVerification || input.employer?.verificationStatus, "pending"),
    trustHighlights: asStringArray(content.trustHighlights),
    pipelineStages:
      asStringArray(content.pipelineStages).length > 0 ? asStringArray(content.pipelineStages) : [...DEFAULT_PIPELINE],
    postedAt: asString(content.postedAt || row.created_at, new Date().toISOString()),
    closesAt: asNullableString(content.closesAt),
    applicationCount: input.applicationCount,
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

export async function getCandidateProfileByUserId(userId: string): Promise<CandidateProfile | null> {
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
  const verificationStatus =
    ((asNullableString(profile.verificationStatus) ||
      (asBoolean(base.is_verified) ? "verified" : completionScore >= 70 ? "ready" : "unverified")) as CandidateProfile["verificationStatus"]) ||
    "unverified";
  const trustScore = calculateTrustScore({ completionScore, verificationStatus, documents });

  return {
    userId,
    email: asNullableString(base.email),
    fullName: asNullableString(base.full_name),
    phone: asNullableString(base.phone),
    avatarUrl: asNullableString(base.avatar_url),
    headline: asString(profile.headline),
    summary: asString(profile.summary),
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
    readinessLabel: getReadinessLabel(trustScore),
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

export async function getEmployerProfiles(options?: { includeUnpublished?: boolean }) {
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

  return [...slugs]
    .map((slug) =>
      buildEmployerProfile({
        company: companyMap.get(slug) ?? null,
        profileRow: profileMap.get(slug) ?? null,
        verificationRow: verificationMap.get(slug) ?? null,
        openRoleCount: counts.get(slug) ?? 0,
      })
    )
    .filter((value): value is EmployerProfile => Boolean(value))
    .sort((a, b) => {
      if (b.openRoleCount !== a.openRoleCount) return b.openRoleCount - a.openRoleCount;
      return a.name.localeCompare(b.name);
    }) as EmployerProfile[];
}

export async function getEmployerProfileBySlug(
  slug: string,
  options?: { includeUnpublished?: boolean }
) {
  const [employers, jobs] = await Promise.all([
    getEmployerProfiles(options),
    getJobPosts(options),
  ]);
  const employer = employers.find((item) => item.slug === slug) ?? null;
  if (!employer) return null;

  return {
    employer,
    jobs: jobs.filter((job) => job.employerSlug === slug),
  };
}

export async function getJobPosts(options?: {
  includeUnpublished?: boolean;
  employerSlug?: string;
  internalOnly?: boolean;
}) {
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
    getEmployerProfiles({ includeUnpublished: true }),
  ]);

  const employerMap = new Map(employers.map((employer) => [employer.slug, employer]));
  const applicationCountMap = new Map<string, number>();

  for (const item of applicationsRes.data ?? []) {
    const metadata = asObject((item as Record<string, unknown>).metadata);
    const jobSlug = asString(metadata.jobSlug);
    if (!jobSlug) continue;
    applicationCountMap.set(jobSlug, (applicationCountMap.get(jobSlug) ?? 0) + 1);
  }

  return ((rowsRes.data ?? []) as Array<Record<string, unknown>>)
    .map((row) =>
      buildJobPost({
        row,
        employer: employerMap.get(asString(asObject(row.metadata).employerSlug)) ?? null,
        applicationCount:
          applicationCountMap.get(asString(asObject(row.metadata).slug || row.reference_id)) ?? 0,
      })
    )
    .filter((job) => (options?.includeUnpublished ? true : job.isPublished))
    .filter((job) => (options?.employerSlug ? job.employerSlug === options.employerSlug : true))
    .filter((job) => (options?.internalOnly ? job.internal : true))
    .sort((a, b) => {
      if (b.featured !== a.featured) return Number(b.featured) - Number(a.featured);
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
}

export async function getJobPostBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
  const jobs = await getJobPosts({ includeUnpublished: options?.includeUnpublished });
  return jobs.find((job) => job.slug === slug) ?? null;
}

export async function searchJobs(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  const jobs = await getJobPosts();
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
  const internalOnly = asString(getValue("internal")) === "1";
  const verifiedOnly = asString(getValue("verified")) === "1";

  return jobs.filter((job) => {
    if (category && job.categorySlug !== category) return false;
    if (employer && job.employerSlug !== employer) return false;
    if (workMode && job.workMode !== workMode) return false;
    if (type && job.employmentType.toLowerCase() !== type) return false;
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

export async function getJobsHomeData(): Promise<JobsHomeData> {
  const [jobs, employers] = await Promise.all([getJobPosts(), getEmployerProfiles()]);
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
    differentiators: JOBS_DIFFERENTIATORS,
    stats: [
      {
        label: "Open roles",
        value: String(jobs.length),
        detail: "Live roles published into the HenryCo hiring operating system.",
      },
      {
        label: "Verified employers",
        value: String(employers.filter((employer) => employer.verificationStatus === "verified").length),
        detail: "Employer profiles with verification maturity visible to candidates.",
      },
      {
        label: "Internal tracks",
        value: String(jobs.filter((job) => job.internal).length),
        detail: "HenryCo internal openings running inside the same platform.",
      },
    ],
  };
}

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

export async function getJobsNotifications(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("division", JOBS_DIVISION)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => buildNotification(row as Record<string, unknown>));
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

export async function getApplicationById(applicationId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
    .eq("reference_id", applicationId)
    .maybeSingle();

  return data ? buildApplication(data as Record<string, unknown>) : null;
}

export async function getCandidateDashboardData(userId: string) {
  const [profile, documents, applications, savedJobs, alerts, notifications, threads] = await Promise.all([
    getCandidateProfileByUserId(userId),
    getCandidateDocuments(userId),
    getCandidateApplications(userId),
    getSavedJobs(userId),
    getJobAlerts(userId),
    getJobsNotifications(userId),
    getJobsThreads(userId),
  ]);

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
  };
}

export async function getEmployerDashboardData(userId: string, email?: string | null) {
  const [memberships, jobs, applications, notifications] = await Promise.all([
    getEmployerMembershipsByUser(userId, email),
    getJobPosts({ includeUnpublished: true }),
    createAdminSupabase()
      .from("customer_activity")
      .select("*")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
      .order("created_at", { ascending: false }),
    getJobsNotifications(userId),
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

export async function getRecruiterOverviewData() {
  const [jobs, employers, profileRows, applicationRows, auditRows, threads] = await Promise.all([
    getJobPosts({ includeUnpublished: true }),
    getEmployerProfiles({ includeUnpublished: true }),
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
      .map((userId) => getCandidateProfileByUserId(userId))
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
