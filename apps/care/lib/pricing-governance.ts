import "server-only";

import { getAdminPricing, type AdminPricingRow } from "@/lib/admin/care-admin";
import { createAdminSupabase } from "@/lib/supabase";

export const PRICING_PROPOSAL_EVENT_TYPES = {
  draftSaved: "pricing_proposal_saved",
  submitted: "pricing_proposal_submitted",
  approved: "pricing_proposal_approved",
  rejected: "pricing_proposal_rejected",
  superseded: "pricing_proposal_superseded",
} as const;

export type PricingProposalStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "superseded";

export type PricingProposalPayload = {
  pricingId: string | null;
  category: string;
  itemName: string;
  description: string | null;
  unit: string;
  price: number;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
};

export type PricingProposalRecord = {
  proposalId: string;
  status: PricingProposalStatus;
  payload: PricingProposalPayload;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  createdByName: string;
  createdByEmail: string | null;
  createdByRole: string | null;
  decidedByName: string | null;
  decidedByEmail: string | null;
  decidedByRole: string | null;
  decisionNote: string | null;
  publishedPricingId: string | null;
};

export type PricingProposalHistoryEvent = {
  id: string;
  eventType: string;
  proposalId: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  note: string | null;
  payload: PricingProposalPayload | null;
  publishedPricingId: string | null;
};

export type PricingGovernanceSnapshot = {
  publishedPricing: AdminPricingRow[];
  proposals: PricingProposalRecord[];
  history: PricingProposalHistoryEvent[];
};

type ProposalLogRow = {
  id: string;
  event_type: string;
  email: string | null;
  role: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asBool(value: unknown) {
  return Boolean(value);
}

function normalizeStatus(eventType: string): PricingProposalStatus | null {
  const normalized = cleanText(eventType).toLowerCase();

  if (normalized === PRICING_PROPOSAL_EVENT_TYPES.draftSaved) return "draft";
  if (normalized === PRICING_PROPOSAL_EVENT_TYPES.submitted) return "submitted";
  if (normalized === PRICING_PROPOSAL_EVENT_TYPES.approved) return "approved";
  if (normalized === PRICING_PROPOSAL_EVENT_TYPES.rejected) return "rejected";
  if (normalized === PRICING_PROPOSAL_EVENT_TYPES.superseded) return "superseded";

  return null;
}

function normalizePayload(details: Record<string, unknown> | null): PricingProposalPayload | null {
  const payload = asRecord(details?.payload) || details;
  if (!payload) return null;

  const category = cleanText(String(payload.category || ""));
  const itemName = cleanText(String(payload.item_name || payload.itemName || ""));

  if (!category || !itemName) {
    return null;
  }

  return {
    pricingId: cleanText(String(payload.pricing_id || payload.pricingId || "")) || null,
    category,
    itemName,
    description: cleanText(String(payload.description || "")) || null,
    unit: cleanText(String(payload.unit || "")) || "item",
    price: Math.max(0, asNumber(payload.price)),
    sortOrder: asNumber(payload.sort_order ?? payload.sortOrder, 100),
    isFeatured: asBool(payload.is_featured ?? payload.isFeatured),
    isActive: payload.is_active === undefined ? true : asBool(payload.is_active),
  };
}

async function fetchProposalLogs() {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("id, event_type, email, role, details, created_at")
    .in("event_type", Object.values(PRICING_PROPOSAL_EVENT_TYPES))
    .order("created_at", { ascending: true })
    .limit(400);

  return (data ?? []) as ProposalLogRow[];
}

function actorName(details: Record<string, unknown> | null, email?: string | null) {
  return (
    cleanText(String(details?.actor_name || details?.actor_full_name || "")) ||
    cleanText(email) ||
    null
  );
}

function toHistoryEvent(row: ProposalLogRow): PricingProposalHistoryEvent | null {
  const details = asRecord(row.details);
  const proposalId = cleanText(String(details?.proposal_id || "")) || null;
  const payload = normalizePayload(details);
  const publishedPricingId =
    cleanText(String(details?.published_pricing_id || details?.pricing_id || "")) || null;

  return {
    id: row.id,
    eventType: cleanText(row.event_type),
    proposalId,
    createdAt: row.created_at,
    actorName: actorName(details, row.email),
    actorEmail: cleanText(row.email) || null,
    actorRole: cleanText(row.role) || null,
    note: cleanText(String(details?.decision_note || details?.note || "")) || null,
    payload,
    publishedPricingId,
  };
}

export async function getPricingGovernanceSnapshot(): Promise<PricingGovernanceSnapshot> {
  const [publishedPricing, logs] = await Promise.all([getAdminPricing(), fetchProposalLogs()]);
  const proposals = new Map<string, PricingProposalRecord>();

  for (const row of logs) {
    const details = asRecord(row.details);
    const proposalId = cleanText(String(details?.proposal_id || ""));
    const status = normalizeStatus(row.event_type);
    const payload = normalizePayload(details);

    if (!proposalId || !status || !payload) {
      continue;
    }

    const existing = proposals.get(proposalId);
    const next: PricingProposalRecord = existing
      ? {
          ...existing,
          status,
          payload,
          updatedAt: row.created_at,
          submittedAt: status === "submitted" ? row.created_at : existing.submittedAt,
          decidedByName:
            status === "approved" || status === "rejected" || status === "superseded"
              ? actorName(details, row.email)
              : existing.decidedByName,
          decidedByEmail:
            status === "approved" || status === "rejected" || status === "superseded"
              ? cleanText(row.email) || null
              : existing.decidedByEmail,
          decidedByRole:
            status === "approved" || status === "rejected" || status === "superseded"
              ? cleanText(row.role) || null
              : existing.decidedByRole,
          decisionNote:
            cleanText(String(details?.decision_note || details?.note || "")) || existing.decisionNote,
          publishedPricingId:
            cleanText(String(details?.published_pricing_id || "")) || existing.publishedPricingId,
        }
      : {
          proposalId,
          status,
          payload,
          createdAt: row.created_at,
          updatedAt: row.created_at,
          submittedAt: status === "submitted" ? row.created_at : null,
          createdByName: actorName(details, row.email) || "Pricing manager",
          createdByEmail: cleanText(row.email) || null,
          createdByRole: cleanText(row.role) || null,
          decidedByName: null,
          decidedByEmail: null,
          decidedByRole: null,
          decisionNote: cleanText(String(details?.decision_note || details?.note || "")) || null,
          publishedPricingId: cleanText(String(details?.published_pricing_id || "")) || null,
        };

    proposals.set(proposalId, next);
  }

  const history = logs
    .map((row) => toHistoryEvent(row))
    .filter(Boolean)
    .reverse() as PricingProposalHistoryEvent[];

  return {
    publishedPricing,
    proposals: [...proposals.values()].sort((a, b) => {
      const aPriority =
        a.status === "submitted" ? 0 : a.status === "draft" ? 1 : a.status === "rejected" ? 2 : 3;
      const bPriority =
        b.status === "submitted" ? 0 : b.status === "draft" ? 1 : b.status === "rejected" ? 2 : 3;

      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
    history,
  };
}

export async function getPricingProposalById(proposalId: string) {
  const snapshot = await getPricingGovernanceSnapshot();
  return (
    snapshot.proposals.find((proposal) => proposal.proposalId === cleanText(proposalId)) ?? null
  );
}
