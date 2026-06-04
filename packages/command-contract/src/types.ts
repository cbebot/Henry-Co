/**
 * @henryco/command-contract — the publish-to-command contract.
 *
 * The single typed shape every division uses to report attention-items UP to
 * the Henry Onyx Command Center. Node-only, zero runtime deps, raw-TS source —
 * the same monorepo convention and money-correctness discipline as
 * `@henryco/payment-router`. See `docs/v3/command-center-architecture.md`.
 *
 * This package is STAGED (V3-COMMAND-02): the only sink is in-memory and the
 * only feed is mock. Live wiring (Supabase store + per-division publishers +
 * real predicates) is V3-COMMAND-03.
 */

/**
 * Discriminated-union result idiom (shared with the payment router). Callers
 * branch on `ok` before touching `value`/`error`, so a validation failure is
 * never silently coerced into a published item.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Branded id so a raw string can't be passed where an attention-item id is meant. */
export type AttentionItemId = string & { readonly __brand: "AttentionItemId" };

/** Construct a branded id from a provenance-stable string (e.g. `learn:app:42`). */
export function attentionItemId(raw: string): AttentionItemId {
  return raw as AttentionItemId;
}

/**
 * The 10 registry divisions (`packages/config/company.ts`) plus `system` — the
 * hub/company lane for items not owned by a product division.
 */
export type Division =
  | "hub"
  | "care"
  | "building"
  | "hotel"
  | "marketplace"
  | "property"
  | "logistics"
  | "studio"
  | "jobs"
  | "learn"
  | "system";

export const ALL_DIVISIONS: readonly Division[] = [
  "hub",
  "care",
  "building",
  "hotel",
  "marketplace",
  "property",
  "logistics",
  "studio",
  "jobs",
  "learn",
  "system",
] as const;

/**
 * The 12 staff divisions the SQL `is_staff_in()` predicate recognises. Mirrors
 * `StaffDivision` in `@henryco/auth` exactly (redefined here to keep this
 * package zero-dependency); the live wiring re-unifies them.
 */
export type StaffDivision =
  | "marketplace"
  | "studio"
  | "property"
  | "learn"
  | "logistics"
  | "jobs"
  | "care"
  | "hub"
  | "staff"
  | "account"
  | "security"
  | "system";

export const ALL_STAFF_DIVISIONS: readonly StaffDivision[] = [
  "marketplace",
  "studio",
  "property",
  "learn",
  "logistics",
  "jobs",
  "care",
  "hub",
  "staff",
  "account",
  "security",
  "system",
] as const;

/**
 * The closed cross-division attention taxonomy (derived from the live `learn`
 * audit, generalised across divisions). Every division's owner/staff attention
 * reduces to one of these. See §5 of the architecture doc.
 */
export type AttentionType =
  | "seller-application"
  | "kyc-review"
  | "high-value-listing"
  | "flagged-transaction"
  | "pending-payout"
  | "pending-payment"
  | "refund-request"
  | "dispute"
  | "moderation-item"
  | "booking-exception"
  | "support-escalation"
  | "publish-review"
  | "config-risk";

export const ALL_ATTENTION_TYPES: readonly AttentionType[] = [
  "seller-application",
  "kyc-review",
  "high-value-listing",
  "flagged-transaction",
  "pending-payout",
  "pending-payment",
  "refund-request",
  "dispute",
  "moderation-item",
  "booking-exception",
  "support-escalation",
  "publish-review",
  "config-risk",
] as const;

/** Urgency tiers. `PRIORITY_RANK` gives the sort weight (higher = more urgent). */
export type AttentionPriority = "critical" | "high" | "medium" | "low";

export const ALL_PRIORITIES: readonly AttentionPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export const PRIORITY_RANK: Record<AttentionPriority, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Who must act: the owner, operational staff, or staff-handle-owner-aware. */
export type AttentionSurface = "owner" | "staff" | "both";

export const ALL_SURFACES: readonly AttentionSurface[] = ["owner", "staff", "both"] as const;

/**
 * Attention-item lifecycle. Legal transitions live in `./state-machine`
 * (mirrored by the SQL trigger at live-wiring). `escalated` is the honest
 * staff→owner bump; `resolved`/`dismissed` are terminal.
 */
export type AttentionStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "dismissed";

export const ALL_ATTENTION_STATUSES: readonly AttentionStatus[] = [
  "open",
  "acknowledged",
  "in_progress",
  "escalated",
  "resolved",
  "dismissed",
] as const;

/**
 * The publish-to-command shape. Carries exactly what the owner/staff surfaces
 * need to triage and act: source division, type, priority, who-must-act,
 * status, the action verb, and the deep-link to act through.
 */
export interface AttentionItem {
  id: AttentionItemId;
  division: Division;
  type: AttentionType;
  priority: AttentionPriority;
  /** Who must act. */
  surface: AttentionSurface;
  status: AttentionStatus;
  title: string;
  summary: string;
  /** The verb the operator performs ("Review payout", "Approve listing"). */
  actionLabel: string;
  /** The route the operator acts through. */
  deepLink: string;
  /** ISO-8601; supplied by the publisher — the pure core never reads the clock. */
  createdAt: string;
  /** Which staff divisions may see/act. Empty/omitted ⇒ `[division]` is assumed. */
  staffScope?: readonly StaffDivision[];
  /** Money context in minor units (for money items). */
  amountMinor?: number | null;
  /** ISO-4217 currency for `amountMinor`. */
  currency?: string | null;
  /** Source row id (provenance). */
  entityRef?: string | null;
  /** Source table/lib provenance string. */
  source?: string | null;
}

/**
 * What a publisher supplies. `status` is assigned by `publishAttentionItem`
 * (always starts `open`), so a division can never publish a pre-resolved item.
 */
export type AttentionItemInput = Omit<AttentionItem, "status">;
