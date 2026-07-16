import { z, type ZodType } from "zod";

/**
 * Founder Intelligence F4 — the PURE governance layer of the LOOKUP catalog.
 *
 * The read-side twin of action-governance.ts: no server imports (zod only), so
 * the invariant gate asserts these in a plain test. Every entry is a bounded,
 * READ-ONLY query the assistant may request by key; the server-only
 * lookup-catalog.ts binds each key to its executor. This is what turns
 * "give me the ID" into the assistant fetching the record itself — the live
 * finding (2026-07-16, the AI's own words): "I have every action, I'm blocked
 * on IDs and thread content because this surface shows me counts, not records."
 *
 * Invariants (asserted by __tests__/lookup-governance.test.ts):
 *   - keys unique, kebab/dot-cased, ≤ 64 chars
 *   - paramsSchema is `.strict()` — unknown keys REJECTED
 *   - params are STRINGS only (a read filter is never a number to invent)
 *   - readOnly is literally true on every entry (the catalog cannot hold a write)
 */

export type FounderLookupGovernance = {
  key: string;
  /** One prompt line: what the read returns + the params it takes. */
  description: string;
  readOnly: true;
  paramsSchema: ZodType;
};

const UUID = z.string().uuid();

export const supportThreadsListLookup: FounderLookupGovernance = {
  key: "support.threads.list",
  description:
    'support.threads.list — open support threads with ids, priority, and each customer\'s latest message. params: {"focus": "urgent" or "all" (optional, default urgent-first), "division": division slug (optional)}',
  readOnly: true,
  paramsSchema: z
    .object({
      focus: z.enum(["urgent", "all"]).optional(),
      division: z.string().min(1).max(24).optional(),
    })
    .strict(),
};

export const supportThreadGetLookup: FounderLookupGovernance = {
  key: "support.thread.get",
  description:
    'support.thread.get — one thread\'s subject, status, priority, and its recent messages (who said what). params: {"threadId": uuid}',
  readOnly: true,
  paramsSchema: z.object({ threadId: UUID }).strict(),
};

export const vendorApplicationsListLookup: FounderLookupGovernance = {
  key: "marketplace.vendor_applications.list",
  description:
    "marketplace.vendor_applications.list — seller applications awaiting a decision, with ids, store names, and emails. params: {}",
  readOnly: true,
  paramsSchema: z.object({}).strict(),
};

export const kycSubmissionsListLookup: FounderLookupGovernance = {
  key: "kyc.submissions.list",
  description:
    "kyc.submissions.list — identity submissions awaiting review, with ids, document types, and who submitted. params: {}",
  readOnly: true,
  paramsSchema: z.object({}).strict(),
};

export const productsPendingListLookup: FounderLookupGovernance = {
  key: "marketplace.products.pending.list",
  description:
    "marketplace.products.pending.list — products awaiting catalog review, with ids and titles. params: {}",
  readOnly: true,
  paramsSchema: z.object({}).strict(),
};

export const staffListLookup: FounderLookupGovernance = {
  key: "staff.list",
  description:
    "staff.list — the workforce with user ids, names, emails, roles, and active/suspended status (the id the staff toggle needs). params: {}",
  readOnly: true,
  paramsSchema: z.object({}).strict(),
};

export const FOUNDER_LOOKUP_GOVERNANCE: FounderLookupGovernance[] = [
  supportThreadsListLookup,
  supportThreadGetLookup,
  vendorApplicationsListLookup,
  kycSubmissionsListLookup,
  productsPendingListLookup,
  staffListLookup,
];

export function lookupParamKeys(g: FounderLookupGovernance): string[] {
  const shape = (g.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
  return shape ? Object.keys(shape) : [];
}
