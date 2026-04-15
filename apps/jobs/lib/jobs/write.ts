import "server-only";

import { randomUUID } from "crypto";
import { getDivisionUrl } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail, slugify } from "@/lib/env";
import { uploadJobsDocument } from "@/lib/cloudinary";
import { DEFAULT_PIPELINE } from "@/lib/jobs/content";
import {
  getApplicationById,
  getCandidateProfileByUserId,
  getEmployerMembershipsByUser,
  getEmployerProfileBySlug,
  getJobPostBySlug,
  getJobPosts,
  JOBS_ACTIVITY_ALERT,
  JOBS_ACTIVITY_APPLICATION,
  JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP,
  JOBS_ACTIVITY_EMPLOYER_PROFILE,
  JOBS_ACTIVITY_EMPLOYER_VERIFICATION,
  JOBS_ACTIVITY_JOB_POST,
  JOBS_ACTIVITY_PROFILE,
  JOBS_ACTIVITY_SAVED,
  JOBS_DIVISION,
} from "@/lib/jobs/data";
import { getEmployerPostingEligibility } from "@/lib/jobs/posting-eligibility";
import {
  createJobsInAppNotification,
  sendJobsEmail,
  sendJobsWhatsApp,
} from "@/lib/jobs/notifications";

type Actor = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
};

const JOBS_BASE_URL = getDivisionUrl("jobs");

function asText(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asUniqueList(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => asText(value)).filter(Boolean))];
}

function toJobsUrl(pathname: string) {
  if (!pathname) return JOBS_BASE_URL;
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${JOBS_BASE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function parseList(value: FormDataEntryValue | string | null | undefined) {
  const raw = asText(value);
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray(value: FormDataEntryValue | string | null | undefined) {
  const raw = asText(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function logAudit(input: {
  actor: Actor;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
}) {
  await createAdminSupabase().from("audit_logs").insert({
    actor_id: input.actor.userId,
    actor_role: input.actor.role ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    reason: input.reason ?? null,
    new_values: input.newValues ?? {},
    old_values: input.oldValues ?? {},
  } as never);
}

async function upsertActivityState(input: {
  userId: string;
  activityType: string;
  status: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string | null;
}) {
  const admin = createAdminSupabase();
  let query = admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", input.activityType)
    .eq("user_id", input.userId);

  if (input.referenceId) {
    query = query.eq("reference_id", input.referenceId);
  }

  const { data: existing } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
  const actionUrl = input.actionUrl ? toJobsUrl(input.actionUrl) : asText((existing as Record<string, unknown> | null)?.action_url as string);

  if (existing?.id) {
    const { data } = await admin
      .from("customer_activity")
      .update({
        title: input.title,
        description: input.description,
        status: input.status,
        metadata: input.metadata,
        reference_type: input.referenceType ?? null,
        reference_id: input.referenceId ?? null,
        action_url: actionUrl || null,
      } as never)
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();

    return data;
  }

  const { data } = await admin
    .from("customer_activity")
    .insert({
      user_id: input.userId,
      division: JOBS_DIVISION,
      activity_type: input.activityType,
      title: input.title,
      description: input.description,
      status: input.status,
      metadata: input.metadata,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      action_url: actionUrl || null,
    } as never)
    .select("*")
    .maybeSingle();

  return data;
}

async function upsertReferenceActivityState(input: {
  actorUserId: string;
  activityType: string;
  status: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  referenceType?: string | null;
  referenceId: string;
  actionUrl?: string | null;
}) {
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", input.activityType)
    .eq("reference_id", input.referenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const actionUrl = input.actionUrl ? toJobsUrl(input.actionUrl) : asText((existing as Record<string, unknown> | null)?.action_url as string);

  if (existing?.id) {
    const { data } = await admin
      .from("customer_activity")
      .update({
        user_id: input.actorUserId,
        title: input.title,
        description: input.description,
        status: input.status,
        metadata: input.metadata,
        reference_type: input.referenceType ?? null,
        reference_id: input.referenceId,
        action_url: actionUrl || null,
      } as never)
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();

    return data;
  }

  const { data } = await admin
    .from("customer_activity")
    .insert({
      user_id: input.actorUserId,
      division: JOBS_DIVISION,
      activity_type: input.activityType,
      title: input.title,
      description: input.description,
      status: input.status,
      metadata: input.metadata,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId,
      action_url: actionUrl || null,
    } as never)
    .select("*")
    .maybeSingle();

  return data;
}

async function getInternalAlertRecipients() {
  const admin = createAdminSupabase();
  const [ownersRes, profilesRes, usersRes] = await Promise.all([
    admin.from("owner_profiles").select("user_id,email,role,is_active").eq("is_active", true),
    admin.from("profiles").select("id,role,is_active").in("role", ["manager", "support", "staff"]).eq("is_active", true),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const emailByUserId = new Map<string, string>();
  for (const user of usersRes.data?.users ?? []) {
    if (user.id && user.email) {
      emailByUserId.set(user.id, user.email.toLowerCase());
    }
  }

  const recipients = [
    ...(ownersRes.data ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        userId: asText(item.user_id as string),
        role: asText(item.role as string) || "owner",
        email: asText(item.email as string) || emailByUserId.get(asText(item.user_id as string)) || "",
      };
    }),
    ...(profilesRes.data ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      return {
        userId: asText(item.id as string),
        role: asText(item.role as string) || "manager",
        email: emailByUserId.get(asText(item.id as string)) || "",
      };
    }),
  ];

  const seen = new Set<string>();
  return recipients.filter((recipient) => {
    if (!recipient.userId || seen.has(recipient.userId)) return false;
    seen.add(recipient.userId);
    return true;
  });
}

async function notifyInternalTeam(input: {
  title: string;
  body: string;
  actionUrl: string;
  actionLabel: string;
  emailKey: "recruiter_alert" | "internal_hiring_alert";
  emailHeading: string;
  emailSummary: string;
  emailDetailLines?: string[];
  entityType: string;
  entityId: string;
  actor: Actor;
}) {
  const recipients = await getInternalAlertRecipients();

  for (const recipient of recipients) {
    await createJobsInAppNotification({
      userId: recipient.userId,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      priority: "high",
      referenceType: input.entityType,
      referenceId: input.entityId,
    });

    if (recipient.email) {
      await sendJobsEmail(
        recipient.email,
        {
          key: input.emailKey,
          heading: input.emailHeading,
          summary: input.emailSummary,
          detailLines: input.emailDetailLines,
          ctaLabel: input.actionLabel,
          ctaHref: toJobsUrl(input.actionUrl),
        },
        {
          actorId: input.actor.userId,
          actorRole: input.actor.role,
          entityType: input.entityType,
          entityId: input.entityId,
        }
      );
    }
  }
}

async function ensurePreferences(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.id) {
    await admin
      .from("customer_preferences")
      .update({
        default_division: JOBS_DIVISION,
        email_transactional: true,
      } as never)
      .eq("id", data.id);
    return;
  }

  await admin.from("customer_preferences").insert({
    user_id: userId,
    default_division: JOBS_DIVISION,
    email_marketing: false,
    email_transactional: true,
    email_digest: true,
    push_enabled: true,
    sms_enabled: false,
    notification_care: false,
    notification_marketplace: false,
    notification_studio: false,
    notification_wallet: false,
    notification_security: true,
    theme: "system",
  } as never);
}

async function ensureApplicationThread(input: {
  applicationId: string;
  userId: string;
  subject: string;
  assignedTo?: string | null;
}) {
  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("support_threads")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("reference_type", "jobs_application")
    .eq("reference_id", input.applicationId)
    .maybeSingle();

  if (existing?.id) {
    return String(existing.id);
  }

  const { data } = await admin
    .from("support_threads")
    .insert({
      user_id: input.userId,
      subject: input.subject,
      division: JOBS_DIVISION,
      category: "application",
      status: "open",
      priority: "normal",
      reference_type: "jobs_application",
      reference_id: input.applicationId,
      assigned_to: input.assignedTo ?? null,
    } as never)
    .select("id")
    .maybeSingle();

  return data?.id ? String(data.id) : null;
}

export async function saveCandidateProfile(input: {
  actor: Actor;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  formData: FormData;
}) {
  const admin = createAdminSupabase();
  const fullName = asText(input.formData.get("fullName")) || input.fullName || "";
  const phone = asText(input.formData.get("phone")) || input.phone || "";
  const headline = asText(input.formData.get("headline"));
  const summary = asText(input.formData.get("summary"));
  const location = asText(input.formData.get("location"));
  const salaryExpectation = asText(input.formData.get("salaryExpectation"));
  const availability = asText(input.formData.get("availability"));

  await admin.from("customer_profiles").upsert({
    id: input.actor.userId,
    email: normalizeEmail(input.email) || null,
    full_name: fullName || null,
    phone: phone || null,
    avatar_url: input.avatarUrl ?? null,
    timezone: asText(input.formData.get("timezone")) || null,
    language: "en",
    currency: "NGN",
    is_active: true,
    onboarded_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  } as never);

  const metadata = {
    headline,
    summary,
    location,
    workModes: parseList(input.formData.get("workModes")),
    roleTypes: parseList(input.formData.get("roleTypes")),
    preferredFunctions: parseList(input.formData.get("preferredFunctions")),
    salaryExpectation: salaryExpectation || null,
    availability: availability || null,
    portfolioLinks: parseList(input.formData.get("portfolioLinks")),
    skills: parseList(input.formData.get("skills")),
    workHistory: parseJsonArray(input.formData.get("workHistory")),
    education: parseJsonArray(input.formData.get("education")),
    certifications: parseJsonArray(input.formData.get("certifications")),
    updatedAt: new Date().toISOString(),
  };

  await upsertActivityState({
    userId: input.actor.userId,
    activityType: JOBS_ACTIVITY_PROFILE,
    status: "active",
    title: "Candidate profile updated",
    description: "Your jobs profile was updated.",
    metadata,
    referenceType: "jobs_candidate_profile",
    referenceId: input.actor.userId,
    actionUrl: "/candidate/profile",
  });

  await ensurePreferences(input.actor.userId);

  await logAudit({
    actor: input.actor,
    action: "jobs_candidate_profile_saved",
    entityType: "jobs_candidate_profile",
    entityId: input.actor.userId,
    newValues: metadata,
  });
}

export async function uploadCandidateAsset(input: {
  actor: Actor;
  kind: string;
  file: File;
}) {
  const bucket = String(process.env.JOBS_DOCUMENTS_BUCKET || "jobs-documents").trim() || "jobs-documents";
  const uploaded = await uploadJobsDocument(input.file, {
    folderSuffix: `${input.actor.userId}/${input.kind}`,
    publicIdPrefix: `${input.kind}-${input.actor.userId}`,
  });

  const { data, error } = await createAdminSupabase()
    .from("customer_documents")
    .insert({
      id: randomUUID(),
      user_id: input.actor.userId,
      name: input.file.name,
      type: "document",
      division: JOBS_DIVISION,
      file_url: uploaded.secureUrl,
      file_size: input.file.size,
      mime_type: input.file.type,
      reference_type: "jobs_candidate_profile",
      reference_id: input.actor.userId,
      metadata: {
        documentKind: input.kind,
        publicId: uploaded.publicId,
        storageBucket: bucket,
        storagePath: uploaded.publicId,
      },
    } as never)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Document metadata could not be saved.");
  }

  await logAudit({
    actor: input.actor,
    action: "jobs_candidate_document_uploaded",
    entityType: "jobs_candidate_profile",
    entityId: input.actor.userId,
    newValues: {
      kind: input.kind,
      name: input.file.name,
      fileUrl: uploaded.secureUrl,
    },
  });

  return data;
}

export async function toggleSavedJob(input: {
  actor: Actor;
  jobSlug: string;
}) {
  const admin = createAdminSupabase();
  const job = await getJobPostBySlug(input.jobSlug, { includeUnpublished: true });
  if (!job) {
    throw new Error("Job not found.");
  }

  const { data: existing } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_SAVED)
    .eq("user_id", input.actor.userId)
    .contains("metadata", { jobSlug: job.slug })
    .eq("status", "saved")
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("customer_activity")
      .update({
        title: `Removed ${job.title} from saved roles`,
        description: `${job.employerName} · ${job.location}`,
        status: "removed",
        action_url: toJobsUrl("/candidate/saved-jobs"),
        metadata: {
          ...asObject(existing.metadata),
          removedAt: new Date().toISOString(),
        },
      } as never)
      .eq("id", existing.id);
    await logAudit({
      actor: input.actor,
      action: "jobs_saved_post_removed",
      entityType: "jobs_post",
      entityId: job.slug,
    });
    return { saved: false };
  }

  await admin.from("customer_activity").insert({
    user_id: input.actor.userId,
    division: JOBS_DIVISION,
    activity_type: JOBS_ACTIVITY_SAVED,
    title: `Saved ${job.title}`,
    description: `${job.employerName} · ${job.location}`,
    status: "saved",
    reference_type: "jobs_post",
    reference_id: job.slug,
    action_url: toJobsUrl(`/jobs/${job.slug}`),
    metadata: {
      jobSlug: job.slug,
      jobTitle: job.title,
      employerSlug: job.employerSlug,
      employerName: job.employerName,
    },
  } as never);

  await createJobsInAppNotification({
    userId: input.actor.userId,
    title: "Job saved",
    body: `${job.title} has been added to your saved jobs list.`,
    actionUrl: "/candidate/saved-jobs",
    actionLabel: "View saved jobs",
    referenceType: "jobs_post",
    referenceId: job.slug,
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_saved_post_added",
    entityType: "jobs_post",
    entityId: job.slug,
  });

  return { saved: true };
}

export async function upsertJobAlert(input: {
  actor: Actor;
  label: string;
  criteria: Record<string, unknown>;
}) {
  const row = await upsertActivityState({
    userId: input.actor.userId,
    activityType: JOBS_ACTIVITY_ALERT,
    status: "active",
    title: input.label,
    description: "A live jobs alert is active.",
    metadata: {
      ...input.criteria,
      label: input.label,
      updatedAt: new Date().toISOString(),
    },
    referenceType: "jobs_alert",
    referenceId: slugify(input.label),
    actionUrl: "/candidate/alerts",
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_alert_saved",
    entityType: "jobs_alert",
    entityId: String(row?.id || slugify(input.label)),
    newValues: input.criteria,
  });

  return row;
}

export async function submitApplication(input: {
  actor: Actor;
  formData: FormData;
}) {
  const admin = createAdminSupabase();
  const jobSlug = asText(input.formData.get("jobSlug"));
  const coverNote = asText(input.formData.get("coverNote"));
  const availability = asText(input.formData.get("availability"));
  const salaryExpectation = asText(input.formData.get("salaryExpectation"));
  const job = await getJobPostBySlug(jobSlug);
  if (!job) {
    throw new Error("Job not found.");
  }

  const existingProfile = await getCandidateProfileByUserId(input.actor.userId);
  const existingAppRows = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
    .eq("user_id", input.actor.userId)
    .contains("metadata", { jobSlug: job.slug })
    .neq("status", "withdrawn");

  if ((existingAppRows.data ?? []).length > 0) {
    throw new Error("You have already applied to this role.");
  }

  const applicationId = randomUUID();
  const metadata = {
    applicationId,
    jobSlug: job.slug,
    jobHref: toJobsUrl(`/jobs/${job.slug}`),
    jobTitle: job.title,
    employerSlug: job.employerSlug,
    employerName: job.employerName,
    candidateName: input.actor.fullName || existingProfile?.fullName || "Candidate",
    candidateEmail: normalizeEmail(input.actor.email) || null,
    candidatePhone: existingProfile?.phone || null,
    coverNote,
    availability: availability || existingProfile?.availability || null,
    salaryExpectation: salaryExpectation || existingProfile?.salaryExpectation || null,
    stage: "applied",
    recruiterConfidence: Math.min((existingProfile?.trustScore ?? 42) + 6, 100),
    candidateReadiness: existingProfile?.trustScore ?? 42,
    internal: job.internal,
    profileSnapshot: existingProfile,
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await admin.from("customer_activity").insert({
    user_id: input.actor.userId,
    division: JOBS_DIVISION,
    activity_type: JOBS_ACTIVITY_APPLICATION,
    title: `Applied to ${job.title}`,
    description: `${job.employerName} · ${job.location}`,
    status: "applied",
    reference_type: "jobs_application",
    reference_id: applicationId,
    action_url: toJobsUrl("/candidate/applications"),
    metadata,
  } as never);

  const threadId = await ensureApplicationThread({
    applicationId,
    userId: input.actor.userId,
    subject: `${job.title} application`,
  });

  if (threadId) {
    await admin.from("support_messages").insert({
      thread_id: threadId,
      sender_id: input.actor.userId,
      sender_type: "candidate",
      body: coverNote || `Applied to ${job.title}.`,
      attachments: [
        {
          type: "application",
          applicationId,
          visibility: "shared",
        },
      ],
    } as never);
  }

  await createJobsInAppNotification({
    userId: input.actor.userId,
    title: "Application submitted",
    body: `${job.title} at ${job.employerName} is now in your application history.`,
    actionUrl: "/candidate/applications",
    actionLabel: "View applications",
    priority: "high",
    referenceType: "jobs_application",
    referenceId: applicationId,
  });

  const { data: employerMembers } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP)
    .eq("reference_id", job.employerSlug)
    .neq("status", "revoked");

  for (const row of employerMembers ?? []) {
    const item = row as Record<string, unknown>;
    const metadata = asObject(item.metadata);
    const employerUserId = asText(item.user_id as string);
    const employerEmail = asText(metadata.normalizedEmail as string);

    if (employerUserId) {
      await createJobsInAppNotification({
        userId: employerUserId,
        title: "New application received",
        body: `${metadata.employerName || job.employerName} received an application for ${job.title}.`,
        actionUrl: `/employer/applicants/${applicationId}`,
        actionLabel: "Review applicant",
        priority: "high",
        referenceType: "jobs_application",
        referenceId: applicationId,
      });
    }

    if (employerEmail) {
      await sendJobsEmail(
        employerEmail,
        {
          key: "application_received",
          heading: "New application received",
          summary: `${existingProfile?.fullName || input.actor.fullName || "A candidate"} just applied to ${job.title}.`,
          detailLines: [
            `Role: ${job.title}`,
            `Candidate: ${existingProfile?.fullName || input.actor.fullName || "Candidate"}`,
            `Readiness score: ${existingProfile?.trustScore ?? 42}`,
          ],
          ctaLabel: "Review applicant",
          ctaHref: `/employer/applicants/${applicationId}`,
        },
        {
          actorId: input.actor.userId,
          actorRole: input.actor.role,
          entityType: "jobs_application",
          entityId: applicationId,
        }
      );
    }
  }

  if (job.internal) {
    await notifyInternalTeam({
      title: "Internal application received",
      body: `${metadata.candidateName} applied to ${job.title}.`,
      actionUrl: `/recruiter/candidates/${input.actor.userId}`,
      actionLabel: "Open candidate",
      emailKey: "internal_hiring_alert",
      emailHeading: "Internal hiring application received",
      emailSummary: `${metadata.candidateName} applied to ${job.title} inside HenryCo Jobs.`,
      emailDetailLines: [
        `Role: ${job.title}`,
        `Candidate: ${metadata.candidateName}`,
        `Readiness score: ${existingProfile?.trustScore ?? 42}`,
      ],
      entityType: "jobs_application",
      entityId: applicationId,
      actor: input.actor,
    });
  }

  await sendJobsEmail(
    input.actor.email,
    {
      key: "application_submitted",
      heading: "Application submitted",
      summary: `Your application for ${job.title} at ${job.employerName} has been recorded inside HenryCo Jobs.`,
      detailLines: [
        `Role: ${job.title}`,
        `Employer: ${job.employerName}`,
        `Work mode: ${job.workMode}`,
      ],
      ctaLabel: "Track application",
      ctaHref: "/candidate/applications",
    },
    {
      actorId: input.actor.userId,
      actorRole: input.actor.role,
      entityType: "jobs_application",
      entityId: applicationId,
    }
  );

  await sendJobsWhatsApp({
    phone: existingProfile?.phone || null,
    body: `HenryCo Jobs: your application for ${job.title} at ${job.employerName} has been submitted. Track it in your candidate dashboard.`,
    actorId: input.actor.userId,
    actorRole: input.actor.role,
    entityType: "jobs_application",
    entityId: applicationId,
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_application_submitted",
    entityType: "jobs_application",
    entityId: applicationId,
    newValues: metadata,
  });

  return { applicationId };
}

export async function createEmployerProfile(input: {
  actor: Actor;
  formData: FormData;
}) {
  const admin = createAdminSupabase();
  const name = asText(input.formData.get("name"));
  const website = asText(input.formData.get("website"));
  const slug = slugify(asText(input.formData.get("slug")) || name);
  if (!name || !slug) {
    throw new Error("Employer name is required.");
  }

  const industry = asText(input.formData.get("industry")) || "Employer";
  const description = asText(input.formData.get("description")) || null;
  const tagline = asText(input.formData.get("tagline")) || null;
  const locations = parseList(input.formData.get("locations"));
  const culturePoints = parseList(input.formData.get("culturePoints"));
  const employerType = asText(input.formData.get("employerType")) || "external";
  const fallbackWebsite = toJobsUrl(`/employers/${slug}`);
  const { data: existingCompany } = await admin
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const companyPayload = {
    slug,
    name,
    subdomain: asText(existingCompany?.subdomain as string) || slug,
    href: website || asText(existingCompany?.href as string) || fallbackWebsite,
    tagline: tagline || asText(existingCompany?.tagline as string) || null,
    description: description || asText(existingCompany?.description as string) || null,
    category: industry,
    status: "active",
    accent: asText(existingCompany?.accent as string) || "#0E7C86",
  };

  await admin.from("companies").upsert(companyPayload as never, { onConflict: "slug" });

  await upsertReferenceActivityState({
    actorUserId: input.actor.userId,
    activityType: JOBS_ACTIVITY_EMPLOYER_PROFILE,
    status: "active",
    title: name,
    description: description || "Employer profile published into HenryCo Jobs.",
    referenceType: "jobs_employer",
    referenceId: slug,
    actionUrl: "/employer/company",
    metadata: {
      employerSlug: slug,
      name,
      tagline,
      description,
      employerType,
      internal: employerType === "internal",
      industry,
      website: website || companyPayload.href,
      locations,
      headcount: asText(input.formData.get("headcount")) || null,
      remotePolicy: asText(input.formData.get("remotePolicy")) || null,
      culturePoints,
      benefitsHeadline:
        asText(input.formData.get("benefitsHeadline")) ||
        "A serious hiring team with clearer communication and accountable follow-through.",
      verificationNotes: ["Verification submitted"],
      trustScore: 54,
      responseSlaHours: 24,
      accent: companyPayload.accent,
      updatedAt: new Date().toISOString(),
    },
  });

  await upsertActivityState({
    userId: input.actor.userId,
    activityType: JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP,
    status: "active",
    title: `${name} employer access`,
    description: "Employer console access is active.",
    metadata: {
      employerSlug: slug,
      employerName: name,
      membershipRole: "owner",
      normalizedEmail: normalizeEmail(input.actor.email),
    },
    referenceType: "jobs_employer",
    referenceId: slug,
    actionUrl: "/employer/company",
  });

  await upsertReferenceActivityState({
    actorUserId: input.actor.userId,
    activityType: JOBS_ACTIVITY_EMPLOYER_VERIFICATION,
    status: "pending",
    title: `${name} verification submitted`,
    description: "Employer verification is pending review.",
    metadata: {
      employerSlug: slug,
      employerName: name,
      website: website || companyPayload.href,
      status: "pending",
      trustScore: 54,
      verificationNotes: ["Verification submitted"],
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    referenceType: "jobs_employer",
    referenceId: slug,
    actionUrl: "/employer/company",
  });

  await createJobsInAppNotification({
    userId: input.actor.userId,
    title: "Employer onboarding submitted",
    body: `${name} is now inside HenryCo Jobs and awaiting verification review.`,
    actionUrl: "/employer/company",
    actionLabel: "Open employer console",
    referenceType: "jobs_employer",
    referenceId: slug,
  });

  await sendJobsEmail(
    input.actor.email,
    {
      key: "employer_verification",
      heading: "Employer profile submitted",
      summary: `${name} has been created inside HenryCo Jobs and is now awaiting verification review.`,
      detailLines: [
        `Employer: ${name}`,
        `Website: ${website || companyPayload.href}`,
      ],
      ctaLabel: "Open employer console",
      ctaHref: toJobsUrl("/employer/company"),
    },
    {
      actorId: input.actor.userId,
      actorRole: input.actor.role,
      entityType: "jobs_employer",
      entityId: slug,
    }
  );

  await notifyInternalTeam({
    title: "Employer verification submitted",
    body: `${name} is waiting for employer verification review.`,
    actionUrl: "/recruiter/verification",
    actionLabel: "Review verification",
    emailKey: "recruiter_alert",
    emailHeading: "Employer verification queue update",
    emailSummary: `${name} was just onboarded and is waiting for verification review inside HenryCo Jobs.`,
    emailDetailLines: [
      `Employer: ${name}`,
      `Industry: ${industry}`,
      `Website: ${website || companyPayload.href}`,
    ],
    entityType: "jobs_employer",
    entityId: slug,
    actor: input.actor,
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_employer_created",
    entityType: "jobs_employer",
    entityId: slug,
    newValues: companyPayload,
  });

  return { employerSlug: slug };
}

export async function createJobPost(input: {
  actor: Actor;
  formData: FormData;
}) {
  const memberships = await getEmployerMembershipsByUser(input.actor.userId, input.actor.email);
  const requestedEmployerSlug = asText(input.formData.get("employerSlug"));
  const employer =
    memberships.find((membership) => membership.employerSlug === requestedEmployerSlug) ?? memberships[0];

  if (!employer && input.actor.role !== "owner" && input.actor.role !== "manager") {
    throw new Error("Employer console access is required to publish a role.");
  }

  const title = asText(input.formData.get("title"));
  if (!title) {
    throw new Error("Job title is required.");
  }

  const slug = slugify(asText(input.formData.get("slug")) || `${title}-${employer?.employerSlug || "henryco"}`);
  const employerSlug = employer?.employerSlug || "henryco-group";
  const employerName = employer?.employerName || "HenryCo Group";
  const isPrivileged = input.actor.role === "owner" || input.actor.role === "manager";
  const eligibility = await getEmployerPostingEligibility({
    userId: input.actor.userId,
    email: input.actor.email,
    employerSlug,
    actorRole: input.actor.role,
  });
  const internal = asText(input.formData.get("internal")) === "1" && isPrivileged;
  const employerProfile = eligibility.employer
    ? { employer: eligibility.employer, jobs: [] }
    : await getEmployerProfileBySlug(employerSlug, { includeUnpublished: true });
  const pipelineStages = parseList(input.formData.get("pipelineStages"));
  const trustHighlights = parseList(input.formData.get("trustHighlights"));
  const location = asText(input.formData.get("location")) || "Remote";
  const categoryName = asText(input.formData.get("category")) || "Operations";
  const employerJobs = await getJobPosts({ includeUnpublished: true, employerSlug });
  const duplicateJob = employerJobs.find((job) => {
    const sameTitle = job.title.trim().toLowerCase() === title.trim().toLowerCase();
    const sameLocation = job.location.trim().toLowerCase() === location.trim().toLowerCase();
    const withinWindow = Date.now() - new Date(job.postedAt).getTime() <= 1000 * 60 * 60 * 24 * 30;
    return sameTitle && sameLocation && withinWindow;
  });
  const recentEmployerJobs = employerJobs.filter((job) => {
    return Date.now() - new Date(job.postedAt).getTime() <= 1000 * 60 * 60 * 24;
  });
  const cooldownTriggered = !isPrivileged && recentEmployerJobs.length >= 3;
  const moderationStatus =
    internal || (eligibility.autoApprovalAllowed && eligibility.verificationStatus === "verified")
      ? "approved"
      : cooldownTriggered
        ? "draft"
        : eligibility.canSubmitForReview
        ? "pending_review"
        : "draft";
  const isPublished = moderationStatus === "approved";
  const moderationSignals = {
    duplicateWindowHit: Boolean(duplicateJob),
    duplicateJobSlug: duplicateJob?.slug || null,
    cooldownTriggered,
    postingRequirementsOpen: eligibility.requirements,
  };

  await upsertReferenceActivityState({
    actorUserId: input.actor.userId,
    activityType: JOBS_ACTIVITY_JOB_POST,
    status: isPublished ? "published" : moderationStatus,
    title,
    description: asText(input.formData.get("summary")) || asText(input.formData.get("description")) || `${employerName} role`,
    referenceType: "jobs_post",
    referenceId: slug,
    actionUrl: `/employer/jobs/${slug}`,
    metadata: {
      slug,
      title,
      subtitle: asText(input.formData.get("subtitle")) || null,
      employerSlug,
      employerName,
      categorySlug: slugify(categoryName || "operations"),
      categoryName,
      location,
      workMode: asText(input.formData.get("workMode")) || "remote",
      employmentType: asText(input.formData.get("employmentType")) || "Full-time",
      seniority: asText(input.formData.get("seniority")) || "Mid-level",
      team: asText(input.formData.get("team")) || "Operations",
      summary: asText(input.formData.get("summary")),
      description: asText(input.formData.get("description")),
      responsibilities: parseList(input.formData.get("responsibilities")),
      requirements: parseList(input.formData.get("requirements")),
      benefits: parseList(input.formData.get("benefits")),
      skills: parseList(input.formData.get("skills")),
      salaryMin: Number(asText(input.formData.get("salaryMin")) || 0) || null,
      salaryMax: Number(asText(input.formData.get("salaryMax")) || 0) || null,
      currency: asText(input.formData.get("currency")) || "NGN",
      salaryLabel: asText(input.formData.get("salaryLabel")) || null,
        featured: asText(input.formData.get("featured")) === "1",
        internal,
        isPublished,
        moderationStatus,
        postingEligibility: {
          trustTier: eligibility.trustTier,
          trustScore: eligibility.trustScore,
          verificationStatus: eligibility.verificationStatus,
          verifiedEmail: eligibility.verifiedEmail,
          membershipActive: eligibility.membershipActive,
          employerProfileReady: eligibility.employerProfileReady,
          employerVerificationAllowed: eligibility.employerVerificationAllowed,
        },
        moderationSignals,
        employerVerification:
          internal ? "verified" : employerProfile?.employer.verificationStatus || "pending",
        employerTrustScore: employerProfile?.employer.trustScore ?? (internal ? 86 : 54),
      employerResponseSlaHours: employerProfile?.employer.responseSlaHours ?? 24,
        trustHighlights:
          trustHighlights.length > 0
            ? trustHighlights
            : asUniqueList([
                eligibility.trustTier !== "basic"
                  ? `Shared trust ${eligibility.trustTier.replace(/_/g, " ")}`
                  : null,
                employerProfile?.employer.verificationStatus === "verified" ? "Verified employer" : null,
                moderationStatus === "approved" ? "Moderated posting" : "Awaiting moderation review",
                "Structured pipeline",
            ]),
      pipelineStages: pipelineStages.length > 0 ? pipelineStages : [...DEFAULT_PIPELINE],
      postedAt: new Date().toISOString(),
      closesAt: asText(input.formData.get("closesAt")) || null,
      updatedAt: new Date().toISOString(),
    },
  });

  if (!isPublished) {
    await notifyInternalTeam({
      title: moderationStatus === "draft" ? "Employer role saved as draft" : "Job post waiting for review",
      body:
        moderationStatus === "draft"
          ? `${title} from ${employerName} was forced into draft because posting requirements are still incomplete.`
          : `${title} from ${employerName} is waiting in the moderation queue.`,
      actionUrl: "/recruiter/jobs",
      actionLabel: "Open jobs queue",
      emailKey: "recruiter_alert",
      emailHeading: "Jobs moderation queue update",
      emailSummary:
        moderationStatus === "draft"
          ? `${title} from ${employerName} was saved as draft because the employer still has posting requirements open.`
          : `${title} was submitted by ${employerName} and is now waiting for moderation review.`,
      emailDetailLines: [
        `Employer: ${employerName}`,
        `Location: ${location}`,
        `Category: ${categoryName}`,
        ...(duplicateJob ? [`Duplicate signal: matches ${duplicateJob.slug}`] : []),
        ...(cooldownTriggered ? ["Cooldown signal: employer exceeded the daily posting threshold."] : []),
      ],
      entityType: "jobs_post",
      entityId: slug,
      actor: input.actor,
    });
  } else if (internal) {
    await notifyInternalTeam({
      title: "Internal role published",
      body: `${title} is live in the HenryCo internal hiring lane.`,
      actionUrl: `/employer/jobs/${slug}`,
      actionLabel: "Open role",
      emailKey: "internal_hiring_alert",
      emailHeading: "Internal hiring role published",
      emailSummary: `${title} is now live for HenryCo internal hiring inside Jobs.`,
      emailDetailLines: [
        `Employer: ${employerName}`,
        `Location: ${location}`,
        `Category: ${categoryName}`,
      ],
      entityType: "jobs_post",
      entityId: slug,
      actor: input.actor,
    });
  }

  await createJobsInAppNotification({
    userId: input.actor.userId,
    title:
      moderationStatus === "approved"
        ? "Role published"
        : moderationStatus === "draft"
          ? "Role saved as draft"
          : "Role submitted for review",
    body:
      moderationStatus === "approved"
        ? `${title} is now live in HenryCo Jobs.`
        : moderationStatus === "draft"
          ? `${title} was saved as draft until trust, company readiness, and moderation requirements are complete.`
          : `${title} is now waiting in the moderation queue.`,
    actionUrl: `/employer/jobs/${slug}`,
    actionLabel: "Open role",
    priority: moderationStatus === "approved" ? "normal" : "high",
    referenceType: "jobs_post",
    referenceId: slug,
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_post_created",
    entityType: "jobs_post",
    entityId: slug,
    newValues: {
      employerSlug: employer?.employerSlug || "henryco-group",
      moderationStatus,
      isPublished,
      internal,
      duplicateWindowHit: Boolean(duplicateJob),
      cooldownTriggered,
      trustTier: eligibility.trustTier,
      requirements: eligibility.requirements,
    },
  });

  return { slug, moderationStatus };
}

export async function advanceApplicationStage(input: {
  actor: Actor;
  applicationId: string;
  stage: string;
  note?: string | null;
}) {
  const admin = createAdminSupabase();
  const existing = await getApplicationById(input.applicationId);
  if (!existing) {
    throw new Error("Application not found.");
  }

  const nextMetadata = {
    ...existing.metadata,
    stage: input.stage,
    updatedAt: new Date().toISOString(),
    recruiterNote: input.note || null,
  };

  await admin
    .from("customer_activity")
    .update({
      status: input.stage,
      metadata: nextMetadata,
      action_url: toJobsUrl("/candidate/applications"),
    } as never)
    .eq("reference_id", input.applicationId)
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_APPLICATION);

  const threadId = await ensureApplicationThread({
    applicationId: input.applicationId,
    userId: existing.candidateUserId,
    subject: `${existing.jobTitle} application`,
  });

  if (threadId) {
    await admin.from("support_messages").insert({
      thread_id: threadId,
      sender_id: input.actor.userId,
      sender_type: "system",
      body: input.note || `Application moved to ${input.stage}.`,
      attachments: [
        {
          type: "timeline_event",
          visibility: "shared",
          stage: input.stage,
        },
      ],
    } as never);
  }

  await createJobsInAppNotification({
    userId: existing.candidateUserId,
    title: `Application moved to ${input.stage}`,
    body: `${existing.jobTitle} at ${existing.employerName} has been updated.`,
    actionUrl: "/candidate/applications",
    actionLabel: "Open applications",
    priority: input.stage === "interview" || input.stage === "offer" ? "high" : "normal",
    referenceType: "jobs_application",
    referenceId: input.applicationId,
  });

  const emailKey =
    input.stage === "shortlisted"
      ? "shortlisted"
      : input.stage === "rejected"
        ? "rejected"
        : input.stage === "interview" || input.stage === "offer"
          ? "interview_update"
          : null;

  if (emailKey && existing.candidateEmail) {
    await sendJobsEmail(
      existing.candidateEmail,
      {
        key: emailKey,
        heading:
          input.stage === "shortlisted"
            ? "You have been shortlisted"
            : input.stage === "rejected"
              ? "Application update"
              : "Interview update",
        summary: `${existing.jobTitle} at ${existing.employerName} has moved to ${input.stage}.`,
        detailLines: [input.note || "Open your application timeline for the latest context."],
        ctaLabel: "Open timeline",
        ctaHref: "/candidate/applications",
      },
      {
        actorId: input.actor.userId,
        actorRole: input.actor.role,
        entityType: "jobs_application",
        entityId: input.applicationId,
      }
    );
  }

  await sendJobsWhatsApp({
    phone: existing.candidatePhone,
    body: `HenryCo Jobs: ${existing.jobTitle} at ${existing.employerName} moved to ${input.stage}. Open your dashboard for the full update.`,
    actorId: input.actor.userId,
    actorRole: input.actor.role,
    entityType: "jobs_application",
    entityId: input.applicationId,
  });

  await logAudit({
    actor: input.actor,
    action: "jobs_application_stage_changed",
    entityType: "jobs_application",
    entityId: input.applicationId,
    reason: input.note ?? null,
    oldValues: { previousStage: existing.stage },
    newValues: { nextStage: input.stage },
  });
}

export async function addApplicationNote(input: {
  actor: Actor;
  applicationId: string;
  note: string;
}) {
  const application = await getApplicationById(input.applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }

  const threadId = await ensureApplicationThread({
    applicationId: input.applicationId,
    userId: application.candidateUserId,
    subject: `${application.jobTitle} application`,
  });

  if (threadId) {
    await createAdminSupabase().from("support_messages").insert({
      thread_id: threadId,
      sender_id: input.actor.userId,
      sender_type: "internal_note",
      body: input.note,
      attachments: [{ visibility: "internal", type: "note" }],
    } as never);
  }

  await logAudit({
    actor: input.actor,
    action: "jobs_application_note_added",
    entityType: "jobs_application",
    entityId: input.applicationId,
    reason: input.note,
    newValues: { note: input.note },
  });
}

export async function updateEmployerVerification(input: {
  actor: Actor;
  employerSlug: string;
  status: "pending" | "verified" | "watch" | "rejected";
  reason?: string | null;
}) {
  const admin = createAdminSupabase();
  const { data: profileRow } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_PROFILE)
    .eq("reference_id", input.employerSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const profileMetadata = asObject(profileRow?.metadata);
  const employerName =
    asText(profileMetadata.name as string) ||
    asText(profileMetadata.employerName as string) ||
    input.employerSlug;
  const trustScore =
    input.status === "verified" ? 86 : input.status === "watch" ? 62 : input.status === "rejected" ? 28 : 54;

  await upsertReferenceActivityState({
    actorUserId: input.actor.userId,
    activityType: JOBS_ACTIVITY_EMPLOYER_VERIFICATION,
    status: input.status,
    title: `${employerName} verification ${input.status}`,
    description: input.reason || `Employer verification changed to ${input.status}.`,
    referenceType: "jobs_employer",
    referenceId: input.employerSlug,
    metadata: {
      employerSlug: input.employerSlug,
      employerName,
      status: input.status,
      reason: input.reason || null,
      trustScore,
      verificationNotes: [input.reason || `Verification changed to ${input.status}`],
      updatedAt: new Date().toISOString(),
    },
    actionUrl: "/employer/company",
  });

  if (profileRow?.id) {
    await admin
      .from("customer_activity")
      .update({
        action_url: toJobsUrl("/employer/company"),
        metadata: {
          ...profileMetadata,
          verificationStatus: input.status,
          verificationNotes: asUniqueList([
            ...(Array.isArray(profileMetadata.verificationNotes)
              ? (profileMetadata.verificationNotes as Array<string | null | undefined>)
              : []),
            input.reason || `Verification changed to ${input.status}`,
          ]),
          trustScore,
          updatedAt: new Date().toISOString(),
        },
      } as never)
      .eq("id", profileRow.id);
  }

  const { data: employerJobs } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_JOB_POST)
    .contains("metadata", { employerSlug: input.employerSlug });

  for (const row of employerJobs ?? []) {
    const item = row as Record<string, unknown>;
    const metadata = asObject(item.metadata);
    const shouldUnpublish = input.status === "rejected";

    await admin
      .from("customer_activity")
      .update({
        status: shouldUnpublish ? "flagged" : item.status,
        metadata: {
          ...metadata,
          employerVerification: input.status,
          isPublished: shouldUnpublish ? false : metadata.isPublished,
          moderationStatus:
            shouldUnpublish
              ? "flagged"
              : metadata.moderationStatus || (metadata.isPublished ? "approved" : "pending_review"),
          updatedAt: new Date().toISOString(),
        },
      } as never)
      .eq("id", item.id);
  }

  const { data: employerMembers } = await admin
    .from("customer_activity")
    .select("*")
    .eq("division", JOBS_DIVISION)
    .eq("activity_type", JOBS_ACTIVITY_EMPLOYER_MEMBERSHIP)
    .eq("reference_id", input.employerSlug)
    .neq("status", "revoked");

  for (const row of employerMembers ?? []) {
    const item = row as Record<string, unknown>;
    const metadata = asObject(item.metadata);
    const memberUserId = asText(item.user_id as string);
    const memberEmail = asText(metadata.normalizedEmail as string);

    if (memberUserId) {
      await createJobsInAppNotification({
        userId: memberUserId,
        title: "Employer verification updated",
        body: `${employerName} is now ${input.status} in HenryCo Jobs.`,
        actionUrl: "/employer/company",
        actionLabel: "Open employer profile",
        priority: "high",
        referenceType: "jobs_employer",
        referenceId: input.employerSlug,
      });
    }

    if (memberEmail) {
      await sendJobsEmail(
        memberEmail,
        {
          key: "employer_verification",
          heading: "Employer verification updated",
          summary: `${employerName} is now marked ${input.status} inside HenryCo Jobs.`,
          detailLines: [input.reason || "Open your employer console for the latest verification context."],
          ctaLabel: "Open employer console",
          ctaHref: toJobsUrl("/employer/company"),
        },
        {
          actorId: input.actor.userId,
          actorRole: input.actor.role,
          entityType: "jobs_employer",
          entityId: input.employerSlug,
        }
      );
    }
  }

  await logAudit({
    actor: input.actor,
    action: "jobs_employer_verification_changed",
    entityType: "jobs_employer",
    entityId: input.employerSlug,
    reason: input.reason ?? null,
    newValues: { status: input.status },
  });
}

export async function markJobsNotificationRead(input: {
  actor: Actor;
  notificationId: string;
}) {
  await createAdminSupabase()
    .from("customer_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    } as never)
    .eq("id", input.notificationId)
    .eq("user_id", input.actor.userId);
}
