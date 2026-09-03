import "server-only";

import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { isProjectPaid, summarizeInvoices, type InvoiceRow } from "@/lib/studio/project-payment";

/**
 * V3-73 — operator (PM) workspace signals: the client-side state mirror. For each
 * project, surface how many deliverables await client approval, how many change
 * rounds are open, and whether final files are locked vs unlocked by payment.
 * Read via the service-role admin client (the PM surface is staff-gated upstream)
 * and degraded gracefully if the revision table is not yet applied.
 */
export type PmProjectSignal = {
  projectId: string;
  awaitingApproval: number;
  changeRoundsOpen: number;
  finalsUnlocked: boolean;
  outstandingKobo: number;
};

type DeliverableRow = { id: string; project_id: string; status: string | null };
type RevisionRow = {
  deliverable_id: string;
  project_id: string;
  status: string;
  revision_number: number;
};
type ProjectInvoiceRow = { project_id: string } & InvoiceRow;

export async function getPmProjectSignals(
  projectIds: string[],
): Promise<Map<string, PmProjectSignal>> {
  const signals = new Map<string, PmProjectSignal>();
  const ids = projectIds.filter(Boolean);
  if (ids.length === 0 || !hasAdminSupabaseEnv()) return signals;

  const admin = createAdminSupabase();

  // Payment-unlock signal (always available — invoices predate this pass).
  try {
    const { data: invoices } = await admin
      .from("studio_invoices")
      .select("project_id, amount_kobo, status")
      .in("project_id", ids);

    const byProject = new Map<string, InvoiceRow[]>();
    for (const row of (invoices ?? []) as ProjectInvoiceRow[]) {
      const list = byProject.get(row.project_id) ?? [];
      list.push({ amount_kobo: row.amount_kobo, status: row.status });
      byProject.set(row.project_id, list);
    }
    for (const id of ids) {
      const summary = summarizeInvoices(byProject.get(id) ?? []);
      signals.set(id, {
        projectId: id,
        awaitingApproval: 0,
        changeRoundsOpen: 0,
        finalsUnlocked: isProjectPaid(summary),
        outstandingKobo: summary.outstandingKobo,
      });
    }
  } catch {
    /* invoices unreadable — leave payment signal at defaults */
  }

  // Approval + revision signals (degrade if the table is not yet applied).
  try {
    const [{ data: deliverables }, { data: revisions }] = await Promise.all([
      admin.from("studio_deliverables").select("id, project_id, status").in("project_id", ids),
      admin
        .from("studio_deliverable_revisions")
        .select("deliverable_id, project_id, status, revision_number")
        .in("project_id", ids),
    ]);

    // Resolve the LATEST round per deliverable (highest revision_number) so the
    // operator signals reflect current state, not all-time tallies.
    const latestRoundByDeliverable = new Map<string, RevisionRow>();
    for (const row of (revisions ?? []) as RevisionRow[]) {
      const current = latestRoundByDeliverable.get(row.deliverable_id);
      if (!current || row.revision_number > current.revision_number) {
        latestRoundByDeliverable.set(row.deliverable_id, row);
      }
    }
    const approvedDeliverables = new Set<string>();
    const changeRoundsByProject = new Map<string, number>();
    for (const [deliverableId, latest] of latestRoundByDeliverable) {
      if (latest.status === "approved") approvedDeliverables.add(deliverableId);
      // "Open" = the deliverable's CURRENT round is an unresolved change request.
      if (latest.status === "changes_requested") {
        changeRoundsByProject.set(
          latest.project_id,
          (changeRoundsByProject.get(latest.project_id) ?? 0) + 1,
        );
      }
    }

    const awaitingByProject = new Map<string, number>();
    for (const row of (deliverables ?? []) as DeliverableRow[]) {
      const isApproved = row.status === "approved" || approvedDeliverables.has(row.id);
      if (!isApproved) {
        awaitingByProject.set(row.project_id, (awaitingByProject.get(row.project_id) ?? 0) + 1);
      }
    }

    for (const id of ids) {
      const existing =
        signals.get(id) ??
        ({
          projectId: id,
          awaitingApproval: 0,
          changeRoundsOpen: 0,
          finalsUnlocked: false,
          outstandingKobo: 0,
        } satisfies PmProjectSignal);
      signals.set(id, {
        ...existing,
        awaitingApproval: awaitingByProject.get(id) ?? 0,
        changeRoundsOpen: changeRoundsByProject.get(id) ?? 0,
      });
    }
  } catch {
    /* revisions table not yet applied — approval signals stay at 0 */
  }

  return signals;
}
