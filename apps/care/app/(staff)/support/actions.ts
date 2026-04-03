"use server";

import { revalidatePath } from "next/cache";
import { getPermissions } from "@/lib/auth/permissions";
import { requireRoles } from "@/lib/auth/server";
import { createAdminSupabase } from "@/lib/supabase";
import {
  addSupportInternalNote,
  assignSupportThread,
  getReviewSupportContext,
  getSupportAgents,
  markSupportThreadViewed,
  logReviewModerationEvent,
  sendSupportReply,
  updateSupportThreadStatus,
} from "@/lib/support/data";
import {
  normalizeSupportThreadStatus,
  type SupportThreadStatus,
} from "@/lib/support/shared";
import { reviewPaymentProof } from "@/lib/payments/verification";

export type SupportMutationResult = {
  ok: boolean;
  tone: "success" | "error" | "warning";
  message: string;
};

const SUPPORT_REVALIDATION_PATHS = [
  "/support",
  "/support/inbox",
  "/support/payments",
  "/support/reviews",
  "/support/archive",
  "/support/notifications",
] as const;

function asText(value: unknown) {
  return String(value || "").trim();
}

function asNumber(value: unknown) {
  const normalized = Number(value ?? null);
  return Number.isFinite(normalized) ? normalized : null;
}

function result(
  ok: boolean,
  tone: SupportMutationResult["tone"],
  message: string
): SupportMutationResult {
  return { ok, tone, message };
}

function revalidateSupportPaths() {
  for (const path of SUPPORT_REVALIDATION_PATHS) {
    revalidatePath(path);
  }
}

async function requireSupportOperator() {
  return requireRoles(["owner", "manager", "support"]);
}

async function requireReviewModerator() {
  const auth = await requireRoles(["owner", "support", "manager"]);
  const permissions = getPermissions(auth.profile.role);

  if (!permissions.canApproveReviews) {
    throw new Error(
      "Your current role can view the queue but cannot moderate reviews."
    );
  }

  return auth;
}

export async function updateSupportThreadStatusAction(input: {
  threadId: string;
  status: string;
  note?: string | null;
}) {
  try {
    const auth = await requireSupportOperator();
    const threadId = asText(input.threadId);
    const status = normalizeSupportThreadStatus(input.status);
    const note = asText(input.note);

    if (!threadId) {
      return result(false, "error", "Support thread is missing.");
    }

    await updateSupportThreadStatus({
      threadId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
      status,
      note: note || null,
    });

    revalidateSupportPaths();
    return result(true, "success", `Thread marked as ${status.replaceAll("_", " ")}.`);
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread status could not be updated."
    );
  }
}

export async function assignSupportThreadAction(input: {
  threadId: string;
  assigneeId: string;
}) {
  try {
    const auth = await requireSupportOperator();
    const threadId = asText(input.threadId);
    const assigneeId = asText(input.assigneeId);

    if (!threadId) {
      return result(false, "error", "Support thread is missing.");
    }

    const agents = await getSupportAgents();
    const assignee =
      assigneeId && assigneeId !== "unassigned"
        ? agents.find((agent) => agent.id === assigneeId) ?? null
        : null;

    if (assigneeId && assigneeId !== "unassigned" && !assignee) {
      return result(false, "error", "The selected assignee is no longer available.");
    }

    await assignSupportThread({
      threadId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
      assignee,
    });

    revalidateSupportPaths();
    return result(
      true,
      "success",
      assignee ? `Thread assigned to ${assignee.fullName}.` : "Thread assignment cleared."
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Assignment could not be updated."
    );
  }
}

export async function addSupportInternalNoteAction(input: {
  threadId: string;
  note: string;
}) {
  try {
    const auth = await requireSupportOperator();
    const threadId = asText(input.threadId);
    const note = asText(input.note);

    if (!threadId) {
      return result(false, "error", "Support thread is missing.");
    }

    if (!note) {
      return result(false, "error", "Add a note before saving.");
    }

    await addSupportInternalNote({
      threadId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
      note,
    });

    revalidateSupportPaths();
    return result(true, "success", "Internal note saved.");
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "The internal note could not be saved."
    );
  }
}

export async function markSupportThreadViewedAction(input: {
  threadId: string;
}) {
  try {
    const auth = await requireSupportOperator();
    const threadId = asText(input.threadId);

    if (!threadId) {
      return result(false, "error", "Support thread is missing.");
    }

    await markSupportThreadViewed({
      threadId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
    });

    return result(true, "success", "Thread marked as read.");
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "The thread read state could not be updated."
    );
  }
}

export async function sendSupportReplyAction(input: {
  threadId: string;
  message: string;
  nextStatus?: string | null;
  sendWhatsApp?: boolean;
}) {
  try {
    const auth = await requireSupportOperator();
    const threadId = asText(input.threadId);
    const message = asText(input.message);
    const nextStatus = asText(input.nextStatus);

    if (!threadId) {
      return result(false, "error", "Support thread is missing.");
    }

    if (!message) {
      return result(false, "error", "Write a reply before sending.");
    }

    const delivery = await sendSupportReply({
      threadId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
      message,
      nextStatus: nextStatus
        ? normalizeSupportThreadStatus(nextStatus)
        : ("pending_customer" as SupportThreadStatus),
      sendWhatsApp: Boolean(input.sendWhatsApp),
    });

    revalidateSupportPaths();

    if (delivery.delivery.email.status !== "sent") {
      return result(
        false,
        "error",
        delivery.delivery.email.reason ||
          "Email delivery did not complete successfully."
      );
    }

    if (input.sendWhatsApp && delivery.delivery.whatsapp.status !== "sent") {
      const whatsappDetail = [
        delivery.delivery.whatsapp.reason,
        delivery.delivery.whatsapp.statusCode
          ? `Provider status ${delivery.delivery.whatsapp.statusCode}`
          : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return result(
        true,
        "warning",
        whatsappDetail ||
          "Email reply was sent, but WhatsApp delivery is not available in this environment."
      );
    }

    if (input.sendWhatsApp && delivery.delivery.whatsapp.deliveryStage === "api_accepted") {
      return result(
        true,
        "warning",
        "Email reply was sent. WhatsApp is only accepted by Meta so far and still needs a real delivery receipt."
      );
    }

    return result(
      true,
      "success",
      input.sendWhatsApp
        ? "Support reply sent by email and WhatsApp."
        : "Support reply sent successfully."
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Support reply could not be sent."
    );
  }
}

export async function moderateReviewAction(input: {
  reviewId: string;
  decision: "approve" | "reject" | "pending";
  moderationNote?: string | null;
}) {
  try {
    const auth = await requireReviewModerator();
    const reviewId = asText(input.reviewId);
    const decision = asText(input.decision).toLowerCase();
    const note = asText(input.moderationNote);

    if (!reviewId) {
      return result(false, "error", "Review id is missing.");
    }

    const moderationStatus =
      decision === "approve"
        ? "approved"
        : decision === "reject"
          ? "rejected"
          : "pending";

    const supabase = createAdminSupabase();
    const { error } = await supabase
      .from("care_reviews")
      .update({ is_approved: decision === "approve" })
      .eq("id", reviewId);

    if (error) {
      return result(false, "error", error.message || "Review moderation failed.");
    }

    const contextMap = await getReviewSupportContext([reviewId]);
    const context = contextMap.get(reviewId);

    await logReviewModerationEvent({
      reviewId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Moderator",
      moderationStatus,
      moderationNote: note || null,
      trackingCode: context?.trackingCode ?? null,
      bookingId: context?.bookingId ?? null,
    });

    revalidateSupportPaths();
    revalidatePath("/");

    return result(
      true,
      "success",
      decision === "approve"
        ? "Review approved for public display."
        : decision === "reject"
          ? "Review rejected and removed from the public queue."
          : "Review left pending with a moderation note."
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Review moderation failed."
    );
  }
}

export async function reviewPaymentProofAction(input: {
  requestId: string;
  decision: "approve" | "reject" | "request_more" | "under_review";
  reason?: string | null;
  amountApproved?: number | null;
  paymentMethod?: string | null;
}) {
  try {
    const auth = await requireSupportOperator();
    const requestId = asText(input.requestId);

    if (!requestId) {
      return result(false, "error", "Payment review item is missing.");
    }

    await reviewPaymentProof({
      requestId,
      actorUserId: auth.profile.id,
      actorRole: auth.profile.role,
      actorName: auth.profile.full_name || auth.user.email || "Support team",
      decision: input.decision,
      reason: asText(input.reason),
      amountApproved: asNumber(input.amountApproved),
      paymentMethod: asText(input.paymentMethod),
    });

    revalidateSupportPaths();
    revalidatePath("/track");

    if (input.decision === "approve") {
      return result(true, "success", "Payment verified and booking records updated.");
    }

    if (input.decision === "under_review") {
      return result(true, "success", "Payment proof marked for manual review.");
    }

    return result(
      true,
      "warning",
      input.decision === "reject"
        ? "Payment proof rejected and customer notified."
        : "Customer has been asked for clearer proof."
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Payment review could not be completed."
    );
  }
}
