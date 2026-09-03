import "server-only";

import { sendPaymentReminderNotification } from "@/lib/studio/email/send";
import { reconcileStudioSharedPendingSyncs } from "@/lib/studio/shared-account";
import { getStudioSnapshot } from "@/lib/studio/store";
import {
  sendStudioMilestoneDueReminder,
  sendStudioInvoiceReminder,
  sendStudioProposalExpiryReminder,
  sendStudioWeeklyDigest,
} from "@/lib/studio/automation-reminders";

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function isReminderDue(target: string | null, now: Date) {
  if (!target) return false;
  const due = new Date(target);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() <= now.getTime();
}

function hasReminderRecord(
  snapshot: Awaited<ReturnType<typeof getStudioSnapshot>>,
  entityId: string,
  templateKey: string,
  withinHours = 24
) {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  return snapshot.notifications.some(
    (item) =>
      item.entityId === entityId &&
      item.templateKey === templateKey &&
      item.createdAt >= since
  );
}

/**
 * V3 PASS 21 — Studio automation sweep.
 *
 * Idempotent per-run sweep that handles:
 *   - shared-account pending sync reconciliation
 *   - payment reminders (existing — gated by isReminderDue + dedupe)
 *   - milestone-due reminders (V3 PASS 21 §I — fires when due_at is in
 *     the next 48h and not completed)
 *   - invoice payment reminders at 3 / 7 / 14 days past due_date
 *   - proposal expiry reminders (fires when valid_until is in the next
 *     72h and proposal still in sent state)
 *   - weekly digest for PM + finance (Monday morning, dedupe within
 *     7 days)
 *
 * Each sub-sweep is best-effort: failures inside one do not abort the
 * others. The summary reports per-pass counts for observability.
 */
export async function runStudioAutomationSweep(now = new Date()) {
  const sharedSync = await reconcileStudioSharedPendingSyncs().catch(() => ({
    processed: 0,
    resolved: 0,
    skipped: 0,
  }));
  const snapshot = await getStudioSnapshot();

  let paymentRemindersSent = 0;
  let skipped = 0;

  for (const payment of snapshot.payments) {
    if (!["requested", "overdue"].includes(cleanText(payment.status))) continue;
    if (!isReminderDue(payment.dueDate, now)) continue;

    const alreadySent = hasReminderRecord(snapshot, payment.id, "payment_reminder", 24);
    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const project = snapshot.projects.find((item) => item.id === payment.projectId);
    const lead = snapshot.leads.find((item) => item.id === project?.leadId);

    if (!project || !lead) {
      skipped += 1;
      continue;
    }

    await sendPaymentReminderNotification({ lead, project, payment });
    paymentRemindersSent += 1;
  }

  const milestoneReminders = await sendStudioMilestoneDueReminder(now).catch((err) => {
    console.error("[studio-automation] milestone-due sweep failed", err);
    return { sent: 0, skipped: 0, errors: 1 };
  });

  const invoiceReminders3 = await sendStudioInvoiceReminder(now, 3).catch((err) => {
    console.error("[studio-automation] invoice-reminder 3d sweep failed", err);
    return { sent: 0, skipped: 0, errors: 1 };
  });
  const invoiceReminders7 = await sendStudioInvoiceReminder(now, 7).catch((err) => {
    console.error("[studio-automation] invoice-reminder 7d sweep failed", err);
    return { sent: 0, skipped: 0, errors: 1 };
  });
  const invoiceReminders14 = await sendStudioInvoiceReminder(now, 14).catch((err) => {
    console.error("[studio-automation] invoice-reminder 14d sweep failed", err);
    return { sent: 0, skipped: 0, errors: 1 };
  });

  const proposalExpiryReminders = await sendStudioProposalExpiryReminder(now).catch((err) => {
    console.error("[studio-automation] proposal-expiry sweep failed", err);
    return { sent: 0, skipped: 0, errors: 1 };
  });

  // Weekly digest: only run on Monday UTC.
  let weeklyDigest = { sent: 0, skipped: 0, errors: 0 };
  if (now.getUTCDay() === 1) {
    weeklyDigest = await sendStudioWeeklyDigest(now).catch((err) => {
      console.error("[studio-automation] weekly-digest sweep failed", err);
      return { sent: 0, skipped: 0, errors: 1 };
    });
  }

  return {
    sharedSync,
    paymentRemindersSent,
    skipped,
    milestoneReminders,
    invoiceReminders3,
    invoiceReminders7,
    invoiceReminders14,
    proposalExpiryReminders,
    weeklyDigest,
    executedAt: now.toISOString(),
  };
}
