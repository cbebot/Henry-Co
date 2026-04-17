import "server-only";

import { randomUUID } from "crypto";
import { shouldAutoFlag } from "@henryco/trust";
import { createAdminSupabase } from "@/lib/supabase";
import type {
  HiringPipeline,
  Application,
  Conversation,
  Message,
  Interview,
  InterviewInput,
} from "@/lib/jobs/hiring-types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => asString(item).trim()).filter(Boolean)
    : [];
}

/* ------------------------------------------------------------------ */
/*  Row mappers                                                        */
/* ------------------------------------------------------------------ */

function mapPipeline(row: Record<string, unknown>): HiringPipeline {
  return {
    id: asString(row.id),
    employerId: asString(row.employer_id),
    jobId: asString(row.job_id),
    jobTitle: asString(row.job_title),
    jobSlug: asString(row.job_slug),
    status: asString(row.status, "active") as HiringPipeline["status"],
    stages: asStringArray(row.stages),
    applicantCount: asNumber(row.applicant_count),
    createdAt: asString(row.created_at),
    updatedAt: row.updated_at ? asString(row.updated_at) : null,
  };
}

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: asString(row.id),
    pipelineId: asString(row.pipeline_id),
    candidateUserId: asString(row.candidate_user_id),
    candidateName: asString(row.candidate_name),
    candidateEmail: row.candidate_email ? asString(row.candidate_email) : null,
    candidateAvatarUrl: row.candidate_avatar_url
      ? asString(row.candidate_avatar_url)
      : null,
    jobTitle: asString(row.job_title),
    stage: asString(row.stage, "applied"),
    status: asString(row.status, "active") as Application["status"],
    coverNote: asString(row.cover_note),
    createdAt: asString(row.created_at),
    updatedAt: row.updated_at ? asString(row.updated_at) : null,
  };
}

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: asString(row.id),
    applicationId: asString(row.application_id),
    subject: asString(row.subject),
    status: asString(row.status, "open") as Conversation["status"],
    unreadCount: asNumber(row.unread_count),
    lastMessageAt: row.last_message_at ? asString(row.last_message_at) : null,
    createdAt: asString(row.created_at),
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: asString(row.id),
    conversationId: asString(row.conversation_id),
    senderId: asString(row.sender_id),
    senderType: asString(row.sender_type, "system") as Message["senderType"],
    senderName: row.sender_name ? asString(row.sender_name) : null,
    body: asString(row.body),
    isRead: row.is_read === true,
    readAt: row.read_at ? asString(row.read_at) : null,
    isFlagged: row.is_flagged === true,
    flagReason: row.flag_reason ? asString(row.flag_reason) : null,
    createdAt: asString(row.created_at),
  };
}

function mapInterview(row: Record<string, unknown>): Interview {
  return {
    id: asString(row.id),
    applicationId: asString(row.application_id),
    title: asString(row.title),
    scheduledAt: asString(row.scheduled_at),
    durationMinutes: asNumber(row.duration_minutes, 30),
    timezone: asString(row.timezone, "Africa/Lagos"),
    interviewType: asString(row.interview_type, "video") as Interview["interviewType"],
    location: row.location ? asString(row.location) : null,
    meetingUrl: row.meeting_url ? asString(row.meeting_url) : null,
    notes: row.notes ? asString(row.notes) : null,
    status: asString(row.status, "scheduled") as Interview["status"],
    createdAt: asString(row.created_at),
    updatedAt: row.updated_at ? asString(row.updated_at) : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Pipeline queries                                                   */
/* ------------------------------------------------------------------ */

export async function getHiringPipelines(
  employerId: string
): Promise<HiringPipeline[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_hiring_pipelines")
    .select("*")
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hiring] getHiringPipelines error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapPipeline(row as Record<string, unknown>));
}

export async function getPipelineById(
  pipelineId: string
): Promise<HiringPipeline | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_hiring_pipelines")
    .select("*")
    .eq("id", pipelineId)
    .maybeSingle();

  if (error || !data) return null;
  return mapPipeline(data as Record<string, unknown>);
}

/* ------------------------------------------------------------------ */
/*  Application queries                                                */
/* ------------------------------------------------------------------ */

export async function getApplications(
  pipelineId: string
): Promise<Application[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_applications")
    .select("*")
    .eq("pipeline_id", pipelineId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hiring] getApplications error:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapApplication(row as Record<string, unknown>)
  );
}

export async function getApplicationById(
  applicationId: string
): Promise<Application | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapApplication(data as Record<string, unknown>);
}

/* ------------------------------------------------------------------ */
/*  Conversation & message queries                                     */
/* ------------------------------------------------------------------ */

export async function getConversation(
  applicationId: string
): Promise<Conversation | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_conversations")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapConversation(data as Record<string, unknown>);
}

export async function getConversationById(
  conversationId: string
): Promise<Conversation | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;
  return mapConversation(data as Record<string, unknown>);
}

export async function getCandidateConversations(
  candidateUserId: string
): Promise<Conversation[]> {
  const admin = createAdminSupabase();

  // First get applications by this candidate
  const { data: apps } = await admin
    .from("jobs_applications")
    .select("id")
    .eq("candidate_user_id", candidateUserId);

  if (!apps || apps.length === 0) return [];

  const applicationIds = apps.map((a: Record<string, unknown>) =>
    asString(a.id)
  );

  const { data, error } = await admin
    .from("jobs_conversations")
    .select("*")
    .in("application_id", applicationIds)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("[hiring] getCandidateConversations error:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapConversation(row as Record<string, unknown>)
  );
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[hiring] getMessages error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: string,
  body: string
): Promise<{ message: Message | null; blocked: boolean; blockReason: string | null }> {
  const autoFlag = shouldAutoFlag(body);

  // Block high/critical messages outright — do not persist them.
  // This is consistent with the review authenticity policy in marketplace/trust.ts.
  if (autoFlag.flag && (autoFlag.severity === "high" || autoFlag.severity === "critical")) {
    return {
      message: null,
      blocked: true,
      blockReason:
        "This message could not be sent because it contains content that violates platform policy. " +
        "Keep all communication, contact details, and payment arrangements inside HenryCo.",
    };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const id = randomUUID();

  // Medium severity: allow delivery but flag for moderation review.
  const isFlagged = autoFlag.flag && autoFlag.severity === "medium";
  const flagReason = isFlagged ? autoFlag.reason : null;

  const { data, error } = await admin
    .from("jobs_messages")
    .insert({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      body,
      is_read: false,
      is_flagged: isFlagged,
      flag_reason: flagReason,
      created_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[hiring] sendMessage error:", error.message);
    return { message: null, blocked: false, blockReason: null };
  }

  // Update conversation last_message_at
  await admin
    .from("jobs_conversations")
    .update({ last_message_at: now } as never)
    .eq("id", conversationId);

  // Enqueue medium-severity flagged messages for moderation review
  if (isFlagged && data) {
    await admin.from("jobs_moderation_queue").insert({
      id: randomUUID(),
      entity_type: "message",
      entity_id: id,
      reason: flagReason,
      status: "pending",
      created_at: now,
    });
  }

  return { message: data ? mapMessage(data as Record<string, unknown>) : null, blocked: false, blockReason: null };
}

export async function markMessagesRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("jobs_messages")
    .update({ is_read: true, read_at: now } as never)
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("[hiring] markMessagesRead error:", error.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Interview queries                                                  */
/* ------------------------------------------------------------------ */

export async function getInterviews(
  applicationId: string
): Promise<Interview[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[hiring] getInterviews error:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapInterview(row as Record<string, unknown>)
  );
}

export async function getCandidateInterviews(
  candidateUserId: string
): Promise<Interview[]> {
  const admin = createAdminSupabase();

  const { data: apps } = await admin
    .from("jobs_applications")
    .select("id")
    .eq("candidate_user_id", candidateUserId);

  if (!apps || apps.length === 0) return [];

  const applicationIds = apps.map((a: Record<string, unknown>) =>
    asString(a.id)
  );

  const { data, error } = await admin
    .from("jobs_interviews")
    .select("*")
    .in("application_id", applicationIds)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[hiring] getCandidateInterviews error:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapInterview(row as Record<string, unknown>)
  );
}

export async function scheduleInterview(
  data: InterviewInput
): Promise<Interview | null> {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const id = randomUUID();

  const { data: result, error } = await admin
    .from("jobs_interviews")
    .insert({
      id,
      application_id: data.applicationId,
      title: data.title,
      scheduled_at: data.scheduledAt,
      duration_minutes: data.durationMinutes,
      timezone: data.timezone,
      interview_type: data.interviewType,
      location: data.location || null,
      meeting_url: data.meetingUrl || null,
      notes: data.notes || null,
      status: "scheduled",
      created_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[hiring] scheduleInterview error:", error.message);
    return null;
  }

  return result ? mapInterview(result as Record<string, unknown>) : null;
}

/* ------------------------------------------------------------------ */
/*  Application stage management                                       */
/* ------------------------------------------------------------------ */

export async function updateApplicationStage(
  applicationId: string,
  stage: string
): Promise<boolean> {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("jobs_applications")
    .update({ stage, updated_at: now } as never)
    .eq("id", applicationId);

  if (error) {
    console.error("[hiring] updateApplicationStage error:", error.message);
    return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  Moderation                                                         */
/* ------------------------------------------------------------------ */

export async function flagMessage(
  messageId: string,
  reason: string
): Promise<boolean> {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("jobs_messages")
    .update({ is_flagged: true, flag_reason: reason } as never)
    .eq("id", messageId);

  if (updateError) {
    console.error("[hiring] flagMessage update error:", updateError.message);
    return false;
  }

  const { error: insertError } = await admin
    .from("jobs_moderation_queue")
    .insert({
      id: randomUUID(),
      entity_type: "message",
      entity_id: messageId,
      reason,
      status: "pending",
      created_at: now,
    });

  if (insertError) {
    console.error("[hiring] flagMessage insert error:", insertError.message);
    return false;
  }

  return true;
}

