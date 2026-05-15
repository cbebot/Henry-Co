import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/env";
import { getStudioSnapshot } from "@/lib/studio/store";
import { addStudioNotificationRecord } from "@/lib/studio/email/send";

/**
 * V3 PASS 21 — Studio cron automation reminders.
 *
 * These helpers are invoked from /api/cron/studio-automation via
 * runStudioAutomationSweep(). They are intentionally self-contained
 * and best-effort: each loop catches its own row-level errors so a
 * single bad record does not poison the sweep.
 *
 * Dedupe strategy:
 *   - Each helper writes a studio_notifications row (via
 *     addStudioNotificationRecord) whose template_key uniquely
 *     identifies the reminder type. Subsequent runs check the
 *     notification ledger and skip rows already sent within a
 *     reasonable dedupe window:
 *       milestone_due_reminder   → 24h window
 *       invoice_reminder_3d/7d/14d → 24h window per tier
 *       proposal_expiry_reminder → 24h window
 *       weekly_digest_pm/finance → 6 day window (Monday cron only)
 *
 * Email path: existing renderAndSendEmail helper in
 * studio/email/send.ts; we intentionally call addStudioNotificationRecord
 * directly for digests where there is no transactional email yet
 * (digest dispatch is owner email + WhatsApp owner alert). Future
 * passes can wire a digest template.
 */

type SweepResult = {
  sent: number;
  skipped: number;
  errors: number;
};

function emptyResult(): SweepResult {
  return { sent: 0, skipped: 0, errors: 0 };
}

function withinDays(target: string | null | undefined, now: Date, daysAhead: number): boolean {
  if (!target) return false;
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return false;
  const horizon = now.getTime() + daysAhead * 24 * 60 * 60 * 1000;
  return t > now.getTime() && t <= horizon;
}

function pastDueByDays(target: string | null | undefined, now: Date, daysPast: number, tolerance = 1): boolean {
  if (!target) return false;
  const t = new Date(target).getTime();
  if (Number.isNaN(t)) return false;
  const lowerBound = now.getTime() - (daysPast + tolerance) * 24 * 60 * 60 * 1000;
  const upperBound = now.getTime() - daysPast * 24 * 60 * 60 * 1000;
  return t >= lowerBound && t <= upperBound;
}

async function hasRecentNotification(
  entityId: string,
  templateKey: string,
  hours = 24
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const admin = createAdminSupabase();
    const { count } = await admin
      .from("studio_notifications")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", entityId)
      .eq("template_key", templateKey)
      .gte("created_at", since);
    return (count ?? 0) > 0;
  } catch {
    // Best-effort: degrade to "no recent" so the reminder still fires
    // (better to over-notify than to silently miss).
    return false;
  }
}

// ---------------------------------------------------------------------------
// Milestone-due reminders (next 48h, not completed)
// ---------------------------------------------------------------------------

type MilestoneDueRow = {
  id: string;
  project_id: string;
  name: string;
  due_at: string | null;
  status: string;
  reminder_sent_at: string | null;
};

export async function sendStudioMilestoneDueReminder(now: Date): Promise<SweepResult> {
  const result = emptyResult();
  const admin = createAdminSupabase();
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("studio_project_milestones")
    .select("id, project_id, name, due_at, status, reminder_sent_at")
    .lt("due_at", horizon)
    .gt("due_at", now.toISOString())
    .neq("status", "completed")
    .returns<MilestoneDueRow[]>();

  if (error) {
    console.error("[automation-reminders] milestone-due fetch failed", error);
    result.errors = 1;
    return result;
  }

  for (const milestone of data ?? []) {
    try {
      if (await hasRecentNotification(milestone.id, "milestone_due_reminder", 24)) {
        result.skipped += 1;
        continue;
      }
      await addStudioNotificationRecord({
        entityId: milestone.id,
        channel: "email",
        templateKey: "milestone_due_reminder",
        recipient: "internal-pm",
        subject: `Milestone due • ${milestone.name}`,
        status: "queued",
        reason: `due_at=${milestone.due_at}`,
      });
      await admin
        .from("studio_project_milestones")
        .update({
          reminder_sent_at: now.toISOString(),
          reminder_count: 0,
        } as never)
        .eq("id", milestone.id);
      result.sent += 1;
    } catch (err) {
      console.error("[automation-reminders] milestone-due row failed", err);
      result.errors += 1;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Invoice reminders at 3 / 7 / 14 days past due
// ---------------------------------------------------------------------------

type InvoiceRow = {
  id: string;
  project_id: string;
  invoice_number: string;
  amount_kobo: number;
  currency: string;
  status: string;
  due_date: string | null;
  normalized_email: string | null;
};

export async function sendStudioInvoiceReminder(now: Date, daysPast: 3 | 7 | 14): Promise<SweepResult> {
  const result = emptyResult();
  const admin = createAdminSupabase();
  const templateKey = `invoice_reminder_${daysPast}d`;

  const { data, error } = await admin
    .from("studio_invoices")
    .select("id, project_id, invoice_number, amount_kobo, currency, status, due_date, normalized_email")
    .eq("status", "sent")
    .returns<InvoiceRow[]>();

  if (error) {
    console.error(`[automation-reminders] invoice-${daysPast}d fetch failed`, error);
    result.errors = 1;
    return result;
  }

  for (const invoice of data ?? []) {
    try {
      if (!pastDueByDays(invoice.due_date, now, daysPast)) {
        result.skipped += 1;
        continue;
      }
      if (await hasRecentNotification(invoice.id, templateKey, 24)) {
        result.skipped += 1;
        continue;
      }
      const amountLabel = formatCurrency(invoice.amount_kobo, invoice.currency || "NGN");
      await addStudioNotificationRecord({
        entityId: invoice.id,
        channel: "email",
        templateKey,
        recipient: invoice.normalized_email || "internal-finance",
        subject: `Payment reminder • Invoice ${invoice.invoice_number} • ${amountLabel}`,
        status: "queued",
        reason: `due_date=${invoice.due_date}; days_past=${daysPast}`,
      });
      result.sent += 1;
    } catch (err) {
      console.error(`[automation-reminders] invoice-${daysPast}d row failed`, err);
      result.errors += 1;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Proposal expiry reminders (next 72h, status = 'sent')
// ---------------------------------------------------------------------------

type ProposalExpiryRow = {
  id: string;
  status: string;
  valid_until: string;
  title: string;
  lead_id: string;
};

export async function sendStudioProposalExpiryReminder(now: Date): Promise<SweepResult> {
  const result = emptyResult();
  const admin = createAdminSupabase();
  const horizon = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("studio_proposals")
    .select("id, status, valid_until, title, lead_id")
    .eq("status", "sent")
    .lt("valid_until", horizon)
    .gt("valid_until", now.toISOString())
    .returns<ProposalExpiryRow[]>();

  if (error) {
    console.error("[automation-reminders] proposal-expiry fetch failed", error);
    result.errors = 1;
    return result;
  }

  for (const proposal of data ?? []) {
    try {
      if (await hasRecentNotification(proposal.id, "proposal_expiry_reminder", 24)) {
        result.skipped += 1;
        continue;
      }
      await addStudioNotificationRecord({
        entityId: proposal.id,
        channel: "email",
        templateKey: "proposal_expiry_reminder",
        recipient: "internal-sales",
        subject: `Proposal expires soon • ${proposal.title}`,
        status: "queued",
        reason: `valid_until=${proposal.valid_until}`,
      });
      result.sent += 1;
    } catch (err) {
      console.error("[automation-reminders] proposal-expiry row failed", err);
      result.errors += 1;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Weekly digest for PM + finance (Mondays only — gated upstream)
// ---------------------------------------------------------------------------

export async function sendStudioWeeklyDigest(now: Date): Promise<SweepResult> {
  const result = emptyResult();
  try {
    if (await hasRecentNotification("studio-weekly-digest", "weekly_digest_pm", 24 * 6)) {
      result.skipped = 1;
      return result;
    }

    const snapshot = await getStudioSnapshot();

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentUpdates = snapshot.projects.filter(
      (p) => p.updatedAt && p.updatedAt >= sevenDaysAgo
    ).length;
    const activeProjects = snapshot.projects.filter(
      (p) => p.status !== "delivered" && p.status !== "archived"
    ).length;
    const openPayments = snapshot.payments.filter((p) =>
      ["requested", "overdue", "pending_verification"].includes(String(p.status))
    ).length;
    const openRevisions = snapshot.revisions.filter((r) => r.status === "open").length;

    const summary = [
      `Active projects: ${activeProjects}`,
      `Recent project updates: ${recentUpdates}`,
      `Open payments: ${openPayments}`,
      `Open revisions: ${openRevisions}`,
    ].join("\n");

    await addStudioNotificationRecord({
      entityId: "studio-weekly-digest",
      channel: "email",
      templateKey: "weekly_digest_pm",
      recipient: "internal-pm",
      subject: "Studio weekly digest — PM",
      status: "queued",
      reason: summary,
    });
    await addStudioNotificationRecord({
      entityId: "studio-weekly-digest",
      channel: "email",
      templateKey: "weekly_digest_finance",
      recipient: "internal-finance",
      subject: "Studio weekly digest — finance",
      status: "queued",
      reason: summary,
    });

    result.sent = 2;
  } catch (err) {
    console.error("[automation-reminders] weekly-digest failed", err);
    result.errors = 1;
  }
  return result;
}
