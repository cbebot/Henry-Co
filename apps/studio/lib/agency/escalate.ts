import "server-only";

/**
 * SA-2 — the pre-SA-4 escalation channel (ARCHITECTURE §3.3). When a job
 * stalls, breaches budget, or exhausts its retries, the owner must hear about
 * it: an urgent staff notification (the `staff.support.handoff.requested`
 * pattern) plus a direct owner email through the studio Postmark rail. Both
 * are best-effort — a failed escalation is logged, never thrown, and never
 * takes down the tick.
 *
 * SA-4 adds owner push on top; SA-2/SA-3 do not wait for it.
 */

import { publishStaffNotification } from "@henryco/notifications";
import { sendAgencyOwnerAlert } from "@/lib/studio/email/agency";
import { appendBuildEvent, type BuildJobRow } from "@/lib/agency/store";

export type EscalationReason =
  | "budget_breach"
  | "heartbeat_gap"
  | "max_attempts"
  | "deploy_check_failed"
  | "review_stalled";

const REASON_COPY: Record<EscalationReason, { title: string; body: string }> = {
  budget_breach: {
    title: "A build job hit its cost ceiling",
    body: "A Studio build reached its budget envelope and was stopped before any overspend. It needs a decision: raise the budget or cancel.",
  },
  heartbeat_gap: {
    title: "A build job went quiet",
    body: "A Studio build stopped sending progress and was stalled. The build environment may have failed. Review and retry or cancel.",
  },
  max_attempts: {
    title: "A build job could not complete",
    body: "A Studio build failed on every attempt and was stopped. It needs a human look before another try.",
  },
  deploy_check_failed: {
    title: "A deploy check failed",
    body: "A Studio site failed its post-deploy checks and was rolled back. Review before re-releasing.",
  },
  review_stalled: {
    title: "A client hasn't reviewed their preview",
    body: "A client's site preview has waited past the reminder window with no response. It needs your decision — the job will not advance on its own.",
  },
};

export async function escalateJob(job: BuildJobRow, reason: EscalationReason): Promise<void> {
  const copy = REASON_COPY[reason];
  await appendBuildEvent(job.id, "escalated", { reason });

  // Urgent staff bell (best-effort). staff.system.alert carries no payload keys
  // — the job context rides the title/body so the registry validator is happy.
  try {
    await publishStaffNotification({
      division: "studio",
      recipient: { role: "studio_owner" },
      eventType: "staff.system.alert",
      severity: "urgent",
      title: copy.title,
      body: `${copy.body} (job ${job.id.slice(0, 8)})`,
      deepLink: "/owner",
      actorUserId: undefined,
    });
  } catch {
    // notification best-effort — the email fallback below still fires.
  }

  // Direct owner email — the always-on fallback.
  try {
    await sendAgencyOwnerAlert({ jobId: job.id, reason, title: copy.title, body: copy.body });
  } catch {
    // email best-effort — the event row above is the durable record.
  }
}
