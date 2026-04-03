import "server-only";

import { sendPaymentReminderNotification } from "@/lib/studio/email/send";
import { getStudioSnapshot } from "@/lib/studio/store";

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

export async function runStudioAutomationSweep(now = new Date()) {
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

  return {
    paymentRemindersSent,
    skipped,
    executedAt: now.toISOString(),
  };
}
