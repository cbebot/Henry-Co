import "server-only";

import { mapCareSupportStatusToAccountStatus } from "@henryco/config";
import { publishNotification, type Division } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

const KNOWN_DIVISIONS: ReadonlySet<Division> = new Set([
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "security",
  "system",
]);

function normalizeDivision(value: string | null | undefined): Division {
  const lowered = String(value || "").trim().toLowerCase();
  return KNOWN_DIVISIONS.has(lowered as Division) ? (lowered as Division) : "account";
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanSummary(subject: unknown) {
  const normalized = cleanText(subject) || "Support conversation";
  return normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
}

function isMissingResourceError(error: { message?: string; code?: string } | null | undefined) {
  const message = cleanText(error?.message).toLowerCase();
  const code = cleanText(error?.code);
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    code === "PGRST205" ||
    code === "42P01"
  );
}

async function getSharedSupportThread(threadId: string) {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("support_threads")
    .select("id, user_id, subject, division, category")
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    if (isMissingResourceError(error)) {
      return null;
    }
    throw error;
  }

  return data;
}

export async function syncSupportAssignmentToAccountThread(input: {
  threadId: string;
  assigneeId?: string | null;
}) {
  const thread = await getSharedSupportThread(input.threadId);
  if (!thread) return false;

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("support_threads")
    .update({
      assigned_to: cleanText(input.assigneeId) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.threadId);

  if (error) throw error;
  return true;
}

export async function syncSupportViewToAccountThread(input: { threadId: string }) {
  const thread = await getSharedSupportThread(input.threadId);
  if (!thread) return false;

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("support_threads")
    .update({
      staff_last_read_at: now,
    })
    .eq("id", input.threadId);

  if (error) throw error;
  return true;
}

export async function syncSupportStatusToAccountThread(input: {
  threadId: string;
  status: string;
}) {
  const thread = await getSharedSupportThread(input.threadId);
  if (!thread) return false;

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const nextStatus = mapCareSupportStatusToAccountStatus(input.status);
  const { error } = await admin
    .from("support_threads")
    .update({
      status: nextStatus,
      updated_at: now,
      resolved_at: nextStatus === "resolved" ? now : null,
      closed_at: null,
      staff_last_read_at: now,
    })
    .eq("id", input.threadId);

  if (error) throw error;
  return true;
}

export async function syncSupportReplyToAccountThread(input: {
  threadId: string;
  senderId: string;
  message: string;
  status: string;
}) {
  const thread = await getSharedSupportThread(input.threadId);
  if (!thread) return false;

  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const nextStatus = mapCareSupportStatusToAccountStatus(input.status);

  const { error: messageError } = await admin.from("support_messages").insert({
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_type: "agent",
    body: cleanText(input.message),
    attachments: [],
    is_read: false,
    read_at: null,
  } as never);

  if (messageError) throw messageError;

  const { error: threadError } = await admin
    .from("support_threads")
    .update({
      status: nextStatus,
      updated_at: now,
      resolved_at: nextStatus === "resolved" ? now : null,
      closed_at: null,
      staff_last_read_at: now,
    })
    .eq("id", input.threadId);

  if (threadError) throw threadError;

  const summary = cleanSummary(thread.subject);
  try {
    const publishResult = await publishNotification({
      userId: String(thread.user_id),
      division: normalizeDivision(thread.division),
      eventType: "support.reply.received",
      severity: nextStatus === "resolved" ? "info" : "urgent",
      title: "Support replied",
      body: `New response on "${summary}".`,
      deepLink: `/support/${input.threadId}`,
      relatedType: "support_thread",
      relatedId: input.threadId,
      actorUserId: cleanText(input.senderId) || undefined,
      publisher: "bridge:apps/care/lib/support/account-sync.ts",
    });

    if (!publishResult.ok && process.env.NODE_ENV !== "production") {
      console.warn(
        "[care:syncSupportReplyToAccountThread] shim rejected",
        publishResult.error,
        publishResult.detail,
      );
    }

    await admin.from("customer_activity").insert({
      user_id: thread.user_id,
      division: thread.division || "account",
      activity_type: "support_replied",
      title: `Support replied: ${summary}`,
      description:
        nextStatus === "resolved"
          ? "Your support request has been marked resolved."
          : "Support replied and the conversation is still open.",
      status: nextStatus,
      reference_type: "support_thread",
      reference_id: input.threadId,
    } as never);
  } catch {
    // The shared customer timeline is useful but must not block staff replies.
  }

  return true;
}
