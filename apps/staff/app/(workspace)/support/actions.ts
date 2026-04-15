"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff-auth";
import {
  assignSupportThreadForStaff,
  markSupportThreadViewedForStaff,
  replyToSupportThreadForStaff,
  updateSupportThreadPriorityForStaff,
  updateSupportThreadStatusForStaff,
} from "@/lib/support-desk";

export type StaffSupportActionResult = {
  ok: boolean;
  tone: "success" | "warning" | "error";
  message: string;
};

function result(
  ok: boolean,
  tone: StaffSupportActionResult["tone"],
  message: string
): StaffSupportActionResult {
  return { ok, tone, message };
}

function revalidateSupportDesk() {
  revalidatePath("/support");
}

async function requireSupportViewer() {
  const viewer = await requireStaff();
  const userId = viewer.user?.id;

  if (!userId) {
    throw new Error("Authenticated staff identity is required before support actions can run.");
  }

  return {
    id: userId,
    fullName: viewer.user?.fullName || viewer.user?.email || "HenryCo Staff",
    divisions: viewer.divisions.map((item) => item.division),
  };
}

export async function markSharedSupportThreadViewedAction(input: {
  threadId: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    await markSupportThreadViewedForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerId: viewer.id,
      viewerDivisions: viewer.divisions,
    });
    revalidateSupportDesk();
    return result(true, "success", "Thread marked read.");
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread read state could not be updated."
    );
  }
}

export async function assignSharedSupportThreadToSelfAction(input: {
  threadId: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    await assignSupportThreadForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerDivisions: viewer.divisions,
      assigneeId: viewer.id,
    });
    revalidateSupportDesk();
    return result(true, "success", "Thread assigned to you.");
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread assignment could not be updated."
    );
  }
}

export async function clearSharedSupportThreadAssignmentAction(input: {
  threadId: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    await assignSupportThreadForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerDivisions: viewer.divisions,
      assigneeId: null,
    });
    revalidateSupportDesk();
    return result(true, "success", "Thread assignment cleared.");
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread assignment could not be cleared."
    );
  }
}

export async function updateSharedSupportThreadStatusAction(input: {
  threadId: string;
  status: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    await updateSupportThreadStatusForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerDivisions: viewer.divisions,
      status: String(input.status || "").trim(),
    });
    revalidateSupportDesk();
    return result(
      true,
      "success",
      `Thread marked ${String(input.status || "updated").replaceAll("_", " ")}.`
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread status could not be updated."
    );
  }
}

export async function updateSharedSupportThreadPriorityAction(input: {
  threadId: string;
  priority: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    await updateSupportThreadPriorityForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerDivisions: viewer.divisions,
      priority: String(input.priority || "").trim(),
    });
    revalidateSupportDesk();
    return result(
      true,
      input.priority === "high" || input.priority === "urgent" ? "warning" : "success",
      input.priority === "high" || input.priority === "urgent"
        ? "Thread escalated for faster handling."
        : "Thread returned to the standard queue."
    );
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Thread priority could not be updated."
    );
  }
}

export async function replyToSharedSupportThreadAction(input: {
  threadId: string;
  message: string;
  nextStatus: string;
}) {
  try {
    const viewer = await requireSupportViewer();
    const delivery = await replyToSupportThreadForStaff({
      threadId: String(input.threadId || "").trim(),
      viewerId: viewer.id,
      viewerName: viewer.fullName,
      viewerDivisions: viewer.divisions,
      message: String(input.message || ""),
      nextStatus: String(input.nextStatus || "pending_customer"),
    });
    revalidateSupportDesk();

    if (delivery.emailStatus === "failed") {
      return result(
        true,
        "warning",
        delivery.emailReason ||
          "Reply saved in HenryCo, but the email delivery failed in this environment."
      );
    }

    if (delivery.emailStatus === "queued") {
      return result(
        true,
        "warning",
        "Reply posted in HenryCo. Outbound email is queued because the provider config is incomplete here."
      );
    }

    if (delivery.emailStatus === "skipped") {
      return result(
        true,
        "warning",
        "Reply posted in HenryCo, but no customer email was available for outbound delivery."
      );
    }

    return result(true, "success", `Reply sent and thread moved to ${delivery.statusLabel}.`);
  } catch (error) {
    return result(
      false,
      "error",
      error instanceof Error ? error.message : "Support reply could not be sent."
    );
  }
}
