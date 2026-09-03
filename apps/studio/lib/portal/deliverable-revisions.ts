import "server-only";

import { createSupabaseServer } from "@/lib/supabase/server";
import { computeRoundTrip, type RoundTripState } from "@/lib/studio/revision-rounds";

/**
 * V3-73 — RLS-scoped reads of the per-deliverable revision rounds for the client
 * portal + PM augment. Degrades to an empty map if the table is absent (the
 * migration is committed-not-applied until owner-gated apply) so the portal never
 * crashes — the Approvals surface simply shows the truthful empty state.
 */
export type DeliverableRevisionRound = {
  id: string;
  revisionNumber: number;
  status: "submitted" | "changes_requested" | "approved";
  changeNotes: string | null;
  billable: boolean;
  hasSignature: boolean;
  createdAt: string | null;
};

export type DeliverableRevisionState = RoundTripState & {
  deliverableId: string;
  latestStatus: DeliverableRevisionRound["status"] | null;
  rounds: DeliverableRevisionRound[];
};

type RevisionRow = {
  id: string;
  deliverable_id: string;
  revision_number: number;
  status: string;
  change_notes: string | null;
  billable: boolean | null;
  approval_signature: string | null;
  created_at: string | null;
};

type DeliverableAllowanceRow = { id: string; revision_allowance: number | null };

const DEFAULT_ALLOWANCE = 3;

export async function getDeliverableRevisionStates(
  projectId: string,
): Promise<Map<string, DeliverableRevisionState>> {
  const result = new Map<string, DeliverableRevisionState>();
  try {
    const supabase = await createSupabaseServer();

    const [{ data: deliverables }, { data: revisions }] = await Promise.all([
      supabase
        .from("studio_deliverables")
        .select("id, revision_allowance")
        .eq("project_id", projectId),
      supabase
        .from("studio_deliverable_revisions")
        .select("id, deliverable_id, revision_number, status, change_notes, billable, approval_signature, created_at")
        .eq("project_id", projectId)
        .order("revision_number", { ascending: true }),
    ]);

    const allowanceById = new Map<string, number>();
    for (const row of (deliverables ?? []) as DeliverableAllowanceRow[]) {
      allowanceById.set(row.id, row.revision_allowance ?? DEFAULT_ALLOWANCE);
    }

    const roundsByDeliverable = new Map<string, DeliverableRevisionRound[]>();
    for (const row of (revisions ?? []) as RevisionRow[]) {
      const list = roundsByDeliverable.get(row.deliverable_id) ?? [];
      list.push({
        id: row.id,
        revisionNumber: row.revision_number,
        status: (row.status as DeliverableRevisionRound["status"]) ?? "submitted",
        changeNotes: row.change_notes,
        billable: Boolean(row.billable),
        hasSignature: Boolean(row.approval_signature),
        createdAt: row.created_at,
      });
      roundsByDeliverable.set(row.deliverable_id, list);
    }

    // Build state for every deliverable that has either an allowance or rounds.
    const deliverableIds = new Set<string>([
      ...allowanceById.keys(),
      ...roundsByDeliverable.keys(),
    ]);
    for (const deliverableId of deliverableIds) {
      const rounds = roundsByDeliverable.get(deliverableId) ?? [];
      const allowance = allowanceById.get(deliverableId) ?? DEFAULT_ALLOWANCE;
      const used = rounds.filter((r) => r.status === "changes_requested").length;
      const roundTrip = computeRoundTrip(allowance, used);
      const latest = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      result.set(deliverableId, {
        ...roundTrip,
        deliverableId,
        latestStatus: latest?.status ?? null,
        rounds,
      });
    }
  } catch {
    // table not yet applied / read failed — truthful empty Approvals state
    return result;
  }
  return result;
}
