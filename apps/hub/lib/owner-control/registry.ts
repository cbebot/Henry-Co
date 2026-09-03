/**
 * V3-OWNER-CONTROL-01 — the owner action catalogue.
 *
 * ONE declaration per thing the owner may do from HQ. The registry is the only
 * place that decides:
 *   - which entity states an action is legal from (`fromStates`),
 *   - whether a written reason is mandatory (`requiresNote`),
 *   - whether the action demands a fresh identity step-up (`requiresReauth`),
 *   - the audit action path and division recorded for it.
 *
 * The route handler reads this and nothing else. That matters for review: to
 * answer "can the owner reject a seller without a reason?" or "does suspending
 * a vendor require a password?" you read one table, not six handlers.
 *
 * WHY A CLOSED CATALOGUE: the endpoint takes an `actionKey` from the client.
 * If the handler dispatched on that string directly, an unknown key would be an
 * open question. Here an unrecognised key resolves to `undefined` and the
 * request is refused before any state is read — the client cannot name an
 * action the server has not declared.
 *
 * MONEY IS ABSENT BY CONSTRUCTION. No entry in this catalogue writes
 * `marketplace_order_groups.payout_status`, `payments_private`, the ledger, or
 * any refund path. Dispute resolution is deliberately NOT here: both of its
 * branches move the payout state machine (`refunded` releases money to the
 * buyer, `awaiting_auto_release` releases it to the vendor), so shipping it
 * would mean standing up a second writer of a money path. The approvals console
 * shows disputes with full evidence and says plainly that resolution stays in
 * the guarded marketplace path.
 *
 * DELIBERATELY NOT `server-only`. The console renders its buttons from this same
 * table, so the label on a button, the "reason required" hint under it, and the
 * "asks for your password" badge are the SAME facts the route enforces. A second
 * client-side copy would drift, and the first symptom of that drift is a button
 * that promises something the server refuses. Nothing here is a secret: every
 * action key already travels in the request body, and knowing that a key exists
 * grants nothing — `authorizeOwnerControl()` and the SQL `is_owner()` gate decide
 * whether it may be used.
 */

import {
  KYC_PENDING,
  MODERATION_PENDING,
  PRODUCT_REVIEW_PENDING,
  SELLER_APPLICATION_PENDING,
  TEACHER_APPLICATION_PENDING,
  VENDOR_LIFECYCLE,
} from "./statuses";

export type OwnerControlActionKey =
  | "marketplace.seller.approve"
  | "marketplace.seller.request_changes"
  | "marketplace.seller.reject"
  | "marketplace.vendor.suspend"
  | "marketplace.vendor.reinstate"
  | "marketplace.product.approve"
  | "marketplace.product.request_changes"
  | "marketplace.product.reject"
  | "account.kyc.approve"
  | "account.kyc.reject"
  | "learn.teacher.approve"
  | "learn.teacher.reject"
  | "moderation.item.remove"
  | "moderation.item.dismiss";

export type OwnerControlAction = {
  key: OwnerControlActionKey;
  /** Audit action path. Convention: dot-path under `owner.*`. */
  auditAction: string;
  /** Stable entity label recorded on the ledger + audit rows. */
  entityType: string;
  division: string;
  /**
   * Consequential actions demand a fresh password step-up. Per the pass brief
   * this covers suspension and deletion-class actions; approvals stay one-tap
   * so the everyday queue does not train the owner to type his password
   * reflexively — which is precisely what makes the prompt meaningless when it
   * appears on something that matters.
   */
  requiresReauth: boolean;
  /** A decision that goes against the applicant must carry a reason. */
  requiresNote: boolean;
  /**
   * The states the entity may legally be in for this action. Checked against
   * freshly-read state at execute time, so a queue rendered 10 minutes ago
   * cannot drive a transition that is no longer valid.
   */
  fromStates: readonly string[];
  /** The state the entity is expected to reach. Recorded on the ledger. */
  toState: string;
  /**
   * Button label in English source form. The console passes it through
   * `translateSurfaceLabel` exactly like every other string on the surface, so
   * this is a translation source string, not a hardcoded JSX literal.
   */
  label: string;
  /** Visual weight. The verdict that removes something must not read as neutral. */
  tone: "primary" | "neutral" | "danger";
};

const ACTIONS: Record<OwnerControlActionKey, OwnerControlAction> = {
  "marketplace.seller.approve": {
    key: "marketplace.seller.approve",
    label: "Approve seller",
    tone: "primary",
    auditAction: "owner.marketplace.seller.approve",
    entityType: "marketplace_vendor_application",
    division: "marketplace",
    requiresReauth: false,
    requiresNote: false,
    // See `statuses.ts` for why this set is what it is — 'draft' is excluded
    // because approving one would open a store its owner never asked for, and
    // 'under_review' is included because leaving it out hid every application
    // parked in manual review.
    fromStates: SELLER_APPLICATION_PENDING,
    toState: "approved",
  },
  "marketplace.seller.request_changes": {
    key: "marketplace.seller.request_changes",
    label: "Request changes",
    tone: "neutral",
    auditAction: "owner.marketplace.seller.request-changes",
    entityType: "marketplace_vendor_application",
    division: "marketplace",
    requiresReauth: false,
    requiresNote: true,
    // 'changes_requested' is excluded, matching the identical exclusion on
    // `marketplace.product.request_changes` above. Asking again for changes
    // already requested lands on the same status it started from: the
    // compare-and-set matches, so the write reports success, and the pass banks
    // a ledger row, an audit row and a fresh notification to the applicant for a
    // lifecycle event that did not happen.
    //
    // This entry read `SELLER_APPLICATION_PENDING` until the registry invariant
    // test caught it — the two request-changes actions had drifted apart, one
    // reasoning carefully about the self-transition and the other inheriting the
    // whole pending set because that was the convenient constant. The queue
    // still lists `changes_requested` applications and the owner can still
    // approve or reject them; only the button that would change nothing is gone.
    fromStates: SELLER_APPLICATION_PENDING.filter((status) => status !== "changes_requested"),
    toState: "changes_requested",
  },
  "marketplace.seller.reject": {
    key: "marketplace.seller.reject",
    label: "Reject application",
    tone: "danger",
    auditAction: "owner.marketplace.seller.reject",
    entityType: "marketplace_vendor_application",
    division: "marketplace",
    requiresReauth: false,
    requiresNote: true,
    fromStates: SELLER_APPLICATION_PENDING,
    toState: "rejected",
  },

  "marketplace.vendor.suspend": {
    key: "marketplace.vendor.suspend",
    label: "Suspend store",
    tone: "danger",
    auditAction: "owner.marketplace.vendor.suspend",
    entityType: "marketplace_vendor",
    division: "marketplace",
    // Suspension takes a live seller offline and revokes their workspace role.
    requiresReauth: true,
    requiresNote: true,
    fromStates: ["approved"],
    toState: "suspended",
  },
  "marketplace.vendor.reinstate": {
    key: "marketplace.vendor.reinstate",
    label: "Reinstate store",
    tone: "primary",
    auditAction: "owner.marketplace.vendor.reinstate",
    entityType: "marketplace_vendor",
    division: "marketplace",
    requiresReauth: true,
    requiresNote: false,
    fromStates: ["suspended"],
    toState: "approved",
  },

  "marketplace.product.approve": {
    key: "marketplace.product.approve",
    label: "Approve listing",
    tone: "primary",
    auditAction: "owner.marketplace.product.approve",
    entityType: "marketplace_product",
    division: "marketplace",
    requiresReauth: false,
    requiresNote: false,
    fromStates: PRODUCT_REVIEW_PENDING,
    toState: "approved",
  },
  "marketplace.product.request_changes": {
    key: "marketplace.product.request_changes",
    label: "Request changes",
    tone: "neutral",
    auditAction: "owner.marketplace.product.request-changes",
    entityType: "marketplace_product",
    division: "marketplace",
    requiresReauth: false,
    requiresNote: true,
    // 'approved' is EXCLUDED, and the exclusion is the whole point. Marketplace
    // builds its public catalogue with `.eq("approval_status", "approved")`, so
    // moving a live listing to `changes_requested` delists it — the same
    // commercial effect as rejecting it. Leaving 'approved' here would have made
    // this unprompted button a way around the password step-up on
    // `marketplace.product.reject`. Taking a live listing down goes through the
    // gated verdict; this action is for listings not yet in the catalogue.
    //
    // 'changes_requested' is excluded as well — asking again for changes already
    // requested moves nothing and would bank an audit row for a non-event.
    fromStates: ["submitted", "under_review"],
    toState: "changes_requested",
  },
  "marketplace.product.reject": {
    key: "marketplace.product.reject",
    label: "Reject listing",
    tone: "danger",
    auditAction: "owner.marketplace.product.reject",
    entityType: "marketplace_product",
    division: "marketplace",
    // Rejecting pulls a listing out of the catalogue — removal-class.
    requiresReauth: true,
    requiresNote: true,
    // 'approved' IS included here, unlike the two actions above: taking a live
    // listing down is a real thing an owner must be able to do, and this is the
    // action that demands a password before doing it.
    fromStates: [...PRODUCT_REVIEW_PENDING, "approved"],
    toState: "rejected",
  },

  "account.kyc.approve": {
    key: "account.kyc.approve",
    label: "Approve identity",
    tone: "primary",
    auditAction: "owner.account.kyc.approve",
    entityType: "customer_verification_submission",
    division: "account",
    requiresReauth: false,
    requiresNote: false,
    fromStates: KYC_PENDING,
    toState: "approved",
  },
  "account.kyc.reject": {
    key: "account.kyc.reject",
    label: "Reject identity",
    tone: "danger",
    auditAction: "owner.account.kyc.reject",
    entityType: "customer_verification_submission",
    division: "account",
    requiresReauth: false,
    requiresNote: true,
    fromStates: KYC_PENDING,
    toState: "rejected",
  },

  "learn.teacher.approve": {
    key: "learn.teacher.approve",
    label: "Approve teacher",
    tone: "primary",
    auditAction: "owner.learn.teacher.approve",
    entityType: "learn_teacher_application",
    division: "learn",
    requiresReauth: false,
    requiresNote: false,
    fromStates: TEACHER_APPLICATION_PENDING,
    toState: "approved",
  },
  "learn.teacher.reject": {
    key: "learn.teacher.reject",
    label: "Reject application",
    tone: "danger",
    auditAction: "owner.learn.teacher.reject",
    entityType: "learn_teacher_application",
    division: "learn",
    requiresReauth: false,
    requiresNote: true,
    fromStates: TEACHER_APPLICATION_PENDING,
    toState: "rejected",
  },

  "moderation.item.remove": {
    key: "moderation.item.remove",
    label: "Uphold and remove",
    tone: "danger",
    auditAction: "owner.moderation.item.remove",
    entityType: "platform_moderation_queue",
    division: "hub",
    // Upholding a report is the deletion-class verdict in this catalogue.
    requiresReauth: true,
    requiresNote: true,
    fromStates: MODERATION_PENDING,
    toState: "actioned",
  },
  "moderation.item.dismiss": {
    key: "moderation.item.dismiss",
    label: "Dismiss report",
    tone: "neutral",
    auditAction: "owner.moderation.item.dismiss",
    entityType: "platform_moderation_queue",
    division: "hub",
    requiresReauth: false,
    requiresNote: true,
    fromStates: MODERATION_PENDING,
    toState: "dismissed",
  },
};

/**
 * Resolve an action key supplied by the client. Returns `null` for anything not
 * declared above — the caller MUST treat that as a refusal, not a default.
 */
export function getOwnerControlAction(key: unknown): OwnerControlAction | null {
  if (typeof key !== "string") return null;
  // `Object.hasOwn` rather than a bare index: `ACTIONS["constructor"]` and
  // `ACTIONS["__proto__"]` are truthy inherited members, and an object that is
  // not an action has `requiresReauth === undefined` — i.e. every gate off. The
  // request is refused a step later today because `readOwnerControlState` does
  // not recognise the entity type, but that is ordering luck, not a guarantee.
  // Refuse it here, where the guarantee belongs.
  if (!Object.hasOwn(ACTIONS, key)) return null;
  return ACTIONS[key as OwnerControlActionKey] ?? null;
}

/** Every declared action — used by the surface to render controls and by tests. */
export function listOwnerControlActions(): OwnerControlAction[] {
  return Object.values(ACTIONS);
}

export type OwnerControlQueueId =
  | "seller-applications"
  | "kyc-submissions"
  | "teacher-applications"
  | "product-reviews"
  | "moderation-reports"
  | "live-sellers";

export type OwnerControlQueueBinding = {
  id: OwnerControlQueueId;
  division: string;
  /** The statuses the queue LISTS — the `.in()` filter, declared once. */
  listStates: readonly string[];
  /** The actions offered on each row, in render order. */
  actions: OwnerControlActionKey[];
};

/**
 * Which rows each queue shows, and which verdicts it offers on them — bound
 * together in ONE declaration.
 *
 * These two facts were previously written in two files, and they drifted
 * immediately. `queues.ts` listed listings whose status was `pending` or
 * `flagged` while `registry.ts` accepted transitions from `submitted`,
 * `under_review` and `changes_requested`. The two sets did not intersect at
 * all, so the queue was permanently empty; had it not been, every row in it
 * would have rendered with no buttons.
 *
 * Binding them here makes that particular drift unrepresentable rather than
 * merely tested: there is one `listStates` and one `actions`, and the reader and
 * the console both take them from here.
 *
 * The invariant that remains testable — and is tested in
 * `__tests__/owner-control-registry.test.ts` — is CONTAINMENT: every status a
 * queue lists must be accepted by at least one of that queue's own actions.
 * Violating it produces a row the owner can see and cannot act on, which is the
 * exact experience that sent him to the SQL editor.
 */
const QUEUE_BINDINGS: readonly OwnerControlQueueBinding[] = [
  {
    id: "seller-applications",
    division: "marketplace",
    listStates: SELLER_APPLICATION_PENDING,
    actions: [
      "marketplace.seller.approve",
      "marketplace.seller.request_changes",
      "marketplace.seller.reject",
    ],
  },
  {
    id: "kyc-submissions",
    division: "account",
    listStates: KYC_PENDING,
    actions: ["account.kyc.approve", "account.kyc.reject"],
  },
  {
    id: "teacher-applications",
    division: "learn",
    listStates: TEACHER_APPLICATION_PENDING,
    actions: ["learn.teacher.approve", "learn.teacher.reject"],
  },
  {
    id: "product-reviews",
    division: "marketplace",
    listStates: PRODUCT_REVIEW_PENDING,
    actions: [
      "marketplace.product.approve",
      "marketplace.product.request_changes",
      "marketplace.product.reject",
    ],
  },
  {
    id: "moderation-reports",
    division: "hub",
    listStates: MODERATION_PENDING,
    actions: ["moderation.item.dismiss", "moderation.item.remove"],
  },
  {
    // Not a backlog: these are the live and suspended stores, listed so the
    // owner has a lifecycle control rather than a queue that drains.
    id: "live-sellers",
    division: "marketplace",
    listStates: VENDOR_LIFECYCLE,
    actions: ["marketplace.vendor.suspend", "marketplace.vendor.reinstate"],
  },
];

export function getOwnerControlQueueBinding(id: OwnerControlQueueId): OwnerControlQueueBinding {
  const binding = QUEUE_BINDINGS.find((entry) => entry.id === id);
  // Unreachable through the type system; throwing rather than returning a
  // default keeps a future typo from silently producing a queue that filters on
  // nothing and therefore lists everything.
  if (!binding) throw new Error(`owner-control: no queue binding for "${id}"`);
  return binding;
}

/** Every queue binding — used by the invariant test. */
export function listOwnerControlQueueBindings(): readonly OwnerControlQueueBinding[] {
  return QUEUE_BINDINGS;
}
