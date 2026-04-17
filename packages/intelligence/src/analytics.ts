type DivisionLike = string;

export const HENRY_ANALYTICS_VERSION = 1 as const;

export type HenryAnalyticsClassification = "user_action" | "system_state";
export type HenryAnalyticsOutcome =
  | "started"
  | "completed"
  | "saved"
  | "submitted"
  | "requested"
  | "updated"
  | "removed"
  | "approved"
  | "rejected"
  | "blocked"
  | "failed"
  | "pending"
  | "paid"
  | "verified"
  | "resolved"
  | "delivered"
  | "issued"
  | "unknown";

export type HenryFunnelKey =
  | "visitor_to_account"
  | "verification_completion"
  | "marketplace_purchase"
  | "care_booking"
  | "learn_enrollment"
  | "jobs_application"
  | "property_inquiry"
  | "property_submission"
  | "studio_lead"
  | "logistics_booking"
  | "wallet_funding"
  | "wallet_withdrawal"
  | "support_recovery";

export type HenryExperimentBoundary =
  | "safe_ui"
  | "content"
  | "navigation"
  | "operator_reporting"
  | "non_financial_ranking"
  | "high_risk";

export type HenryExperimentDefinition = {
  key: string;
  boundary: HenryExperimentBoundary;
  variants: Array<{ key: string; allocation: number }>;
};

export type HenryExperimentAssignment = {
  key: string;
  boundary: HenryExperimentBoundary;
  variant: string;
  bucket: number;
  allowed: boolean;
};

export type HenryAnalyticsDescriptor = {
  canonicalName: string;
  classification: HenryAnalyticsClassification;
  funnelKey?: HenryFunnelKey;
  funnelStep?: string;
  defaultOutcome?: HenryAnalyticsOutcome;
  entityType?: string;
  touches?: {
    support?: boolean;
    trust?: boolean;
    finance?: boolean;
    notification?: boolean;
  };
  experimentSafe?: boolean;
  ownerVisible?: boolean;
  operatorVisible?: boolean;
};

export type HenryCanonicalAnalytics = {
  version: typeof HENRY_ANALYTICS_VERSION;
  canonicalName: string;
  classification: HenryAnalyticsClassification;
  division: string;
  activityType: string;
  outcome: HenryAnalyticsOutcome;
  status: string | null;
  funnelKey: HenryFunnelKey | null;
  funnelStep: string | null;
  entityType: string | null;
  entityId: string | null;
  experimentSafe: boolean;
  ownerVisible: boolean;
  operatorVisible: boolean;
  touches: {
    support: boolean;
    trust: boolean;
    finance: boolean;
    notification: boolean;
  };
  properties: Record<string, unknown>;
  redactions: string[];
};

export type HenryActivityRowLike = {
  id?: unknown;
  user_id?: unknown;
  division?: unknown;
  activity_type?: unknown;
  status?: unknown;
  reference_type?: unknown;
  reference_id?: unknown;
  metadata?: unknown;
  created_at?: unknown;
  amount_kobo?: unknown;
  action_url?: unknown;
};

export type HenryNormalizedActivityRow = {
  id: string;
  userId: string | null;
  division: string;
  activityType: string;
  status: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string | null;
  amountKobo: number | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  analytics: HenryCanonicalAnalytics;
};

export type HenryFunnelDefinition = {
  key: HenryFunnelKey;
  division: string;
  label: string;
  description: string;
  steps: Array<{ key: string; label: string }>;
};

export type HenryFunnelStepSummary = {
  key: string;
  label: string;
  count: number;
  blocked: number;
  failed: number;
  pending: number;
};

export type HenryFunnelSummary = {
  key: HenryFunnelKey;
  division: string;
  label: string;
  description: string;
  participants: number;
  terminalCount: number;
  conversionRate: number | null;
  bottleneckStep: string | null;
  steps: HenryFunnelStepSummary[];
};

export type HenryIntegritySummary = {
  totalRows: number;
  canonicalRows: number;
  funnelRows: number;
  supportRows: number;
  trustRows: number;
  financeRows: number;
  notificationRows: number;
  possibleDuplicateRows: number;
  redactedRows: number;
};

type MetadataBuildInput = {
  division: DivisionLike;
  activityType: string;
  status?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ActionMetadataBuildInput = {
  division: DivisionLike;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

const HIGH_RISK_EXPERIMENT_BOUNDARIES = new Set<HenryExperimentBoundary>(["high_risk"]);

const SENSITIVE_KEY_PATTERN =
  /(email|phone|message|body|note|token|secret|password|otp|pin|address|document|file|attachment|proof|public_id|url|bank_name|account_name|account_number|payout_reference|reviewer_note|ip|user_agent|location)/i;

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toStatus(value: unknown) {
  const status = cleanText(value).toLowerCase();
  return status || null;
}

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function inferOutcome(status: unknown): HenryAnalyticsOutcome {
  const normalized = toStatus(status);
  if (!normalized) return "unknown";
  if (["active", "completed", "complete", "done"].includes(normalized)) return "completed";
  if (["saved"].includes(normalized)) return "saved";
  if (["submitted", "applied"].includes(normalized)) return "submitted";
  if (["requested"].includes(normalized)) return "requested";
  if (["pending", "awaiting_payment", "awaiting_reply", "under_review", "review", "draft"].includes(normalized)) return "pending";
  if (["updated", "visible", "open", "in_progress", "assigned"].includes(normalized)) return "updated";
  if (["removed", "deleted", "revoked", "withdrawn"].includes(normalized)) return "removed";
  if (["approved", "shortlisted", "offer"].includes(normalized)) return "approved";
  if (["rejected", "flagged"].includes(normalized)) return "rejected";
  if (["blocked", "forbidden"].includes(normalized)) return "blocked";
  if (["failed", "error"].includes(normalized)) return "failed";
  if (["paid", "sponsored"].includes(normalized)) return "paid";
  if (["verified"].includes(normalized)) return "verified";
  if (["resolved"].includes(normalized)) return "resolved";
  if (["delivered", "issued"].includes(normalized)) return normalized as HenryAnalyticsOutcome;
  return "unknown";
}

function sanitizeValue(
  keyPath: string,
  value: unknown,
  redactions: Set<string>,
  depth = 0
): unknown {
  if (depth > 2) return undefined;
  if (SENSITIVE_KEY_PATTERN.test(keyPath)) {
    redactions.add(keyPath);
    return undefined;
  }

  if (value == null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
  }

  if (Array.isArray(value)) {
    const next = value
      .slice(0, 10)
      .map((item, index) => sanitizeValue(`${keyPath}[${index}]`, item, redactions, depth + 1))
      .filter((item) => item !== undefined);
    return next.length ? next : undefined;
  }

  if (typeof value === "object") {
    const nextEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, sanitizeValue(`${keyPath}.${key}`, entry, redactions, depth + 1)] as const)
      .filter(([, entry]) => entry !== undefined);
    return nextEntries.length ? Object.fromEntries(nextEntries) : undefined;
  }

  return undefined;
}

function sanitizeAnalyticsProperties(value: Record<string, unknown> | null | undefined) {
  const redactions = new Set<string>();
  const sanitized = Object.fromEntries(
    Object.entries(value ?? {})
      .map(([key, entry]) => [key, sanitizeValue(key, entry, redactions)] as const)
      .filter(([, entry]) => entry !== undefined)
  );

  return {
    properties: sanitized,
    redactions: [...redactions].sort(),
  };
}

const HIGH_SIGNAL_ACTIVITY_DESCRIPTORS: Record<string, HenryAnalyticsDescriptor> = {
  "account:account_created": {
    canonicalName: "henry.auth.account.created",
    classification: "system_state",
    funnelKey: "visitor_to_account",
    funnelStep: "account_created",
    defaultOutcome: "completed",
    entityType: "account",
  },
  "account:support_created": {
    canonicalName: "henry.support.thread.created",
    classification: "user_action",
    funnelKey: "support_recovery",
    funnelStep: "support_created",
    defaultOutcome: "submitted",
    entityType: "support_thread",
    touches: { support: true },
  },
  "account:support_replied": {
    canonicalName: "henry.support.thread.replied",
    classification: "user_action",
    funnelKey: "support_recovery",
    funnelStep: "support_replied",
    defaultOutcome: "updated",
    entityType: "support_thread",
    touches: { support: true },
  },
  "account:notification_read": {
    canonicalName: "henry.account.notification.read",
    classification: "user_action",
    defaultOutcome: "completed",
    entityType: "customer_notification",
    touches: { notification: true },
  },
  "account:notification_unread": {
    canonicalName: "henry.account.notification.unread",
    classification: "user_action",
    defaultOutcome: "updated",
    entityType: "customer_notification",
    touches: { notification: true },
  },
  "account:notification_archive": {
    canonicalName: "henry.account.notification.archived",
    classification: "user_action",
    defaultOutcome: "updated",
    entityType: "customer_notification",
    touches: { notification: true },
  },
  "account:verification_submitted": {
    canonicalName: "henry.trust.verification.submitted",
    classification: "user_action",
    funnelKey: "verification_completion",
    funnelStep: "verification_submitted",
    defaultOutcome: "submitted",
    entityType: "verification_submission",
    touches: { trust: true },
  },
  "account:verification_resolved": {
    canonicalName: "henry.trust.verification.resolved",
    classification: "system_state",
    funnelKey: "verification_completion",
    funnelStep: "verification_resolved",
    defaultOutcome: "resolved",
    entityType: "verification_submission",
    touches: { trust: true },
  },
  "wallet:wallet_funding_requested": {
    canonicalName: "henry.wallet.funding.requested",
    classification: "user_action",
    funnelKey: "wallet_funding",
    funnelStep: "wallet_funding_requested",
    defaultOutcome: "requested",
    entityType: "wallet_funding_request",
    touches: { finance: true },
  },
  "wallet:wallet_funding_proof_uploaded": {
    canonicalName: "henry.wallet.funding.proof_uploaded",
    classification: "user_action",
    funnelKey: "wallet_funding",
    funnelStep: "wallet_proof_uploaded",
    defaultOutcome: "submitted",
    entityType: "wallet_funding_request",
    touches: { finance: true, trust: true },
  },
  "wallet:wallet_withdrawal_requested": {
    canonicalName: "henry.wallet.withdrawal.requested",
    classification: "user_action",
    funnelKey: "wallet_withdrawal",
    funnelStep: "wallet_withdrawal_requested",
    defaultOutcome: "requested",
    entityType: "wallet_withdrawal_request",
    touches: { finance: true, trust: true },
  },
  "wallet:wallet_withdrawal_blocked": {
    canonicalName: "henry.wallet.withdrawal.blocked",
    classification: "system_state",
    funnelKey: "wallet_withdrawal",
    funnelStep: "wallet_withdrawal_requested",
    defaultOutcome: "blocked",
    entityType: "wallet_withdrawal_request",
    touches: { finance: true, trust: true },
    experimentSafe: false,
  },
  "care:care_booking": {
    canonicalName: "henry.care.booking.updated",
    classification: "system_state",
    funnelKey: "care_booking",
    funnelStep: "booking_confirmed",
    defaultOutcome: "updated",
    entityType: "care_booking",
    touches: { finance: true },
  },
  "jobs:jobs_candidate_profile": {
    canonicalName: "henry.jobs.profile.updated",
    classification: "user_action",
    defaultOutcome: "updated",
    entityType: "jobs_candidate_profile",
  },
  "jobs:jobs_saved_post": {
    canonicalName: "henry.jobs.role.saved",
    classification: "user_action",
    funnelKey: "jobs_application",
    funnelStep: "job_saved",
    defaultOutcome: "saved",
    entityType: "jobs_post",
  },
  "jobs:jobs_application": {
    canonicalName: "henry.jobs.application.updated",
    classification: "system_state",
    funnelKey: "jobs_application",
    funnelStep: "job_applied",
    defaultOutcome: "submitted",
    entityType: "jobs_application",
    touches: { support: true },
  },
  "jobs:jobs_employer_verification": {
    canonicalName: "henry.jobs.employer.verification_updated",
    classification: "system_state",
    defaultOutcome: "verified",
    entityType: "jobs_employer",
    touches: { trust: true },
  },
  "learn:learn_enrollment_created": {
    canonicalName: "henry.learn.enrollment.created",
    classification: "user_action",
    funnelKey: "learn_enrollment",
    funnelStep: "course_enrolled",
    defaultOutcome: "submitted",
    entityType: "learn_course",
    touches: { finance: true },
  },
  "learn:learn_payment_confirmed": {
    canonicalName: "henry.learn.payment.confirmed",
    classification: "system_state",
    funnelKey: "learn_enrollment",
    funnelStep: "payment_confirmed",
    defaultOutcome: "paid",
    entityType: "learn_payment",
    touches: { finance: true },
  },
  "learn:learn_lesson_completed": {
    canonicalName: "henry.learn.progress.lesson_completed",
    classification: "user_action",
    defaultOutcome: "completed",
    entityType: "learn_lesson",
  },
  "learn:learn_certificate_issued": {
    canonicalName: "henry.learn.certificate.issued",
    classification: "system_state",
    funnelKey: "learn_enrollment",
    funnelStep: "certificate_issued",
    defaultOutcome: "issued",
    entityType: "learn_certificate",
  },
  "learn:learn_support_thread_created": {
    canonicalName: "henry.support.thread.created",
    classification: "user_action",
    funnelKey: "support_recovery",
    funnelStep: "support_created",
    defaultOutcome: "submitted",
    entityType: "support_thread",
    touches: { support: true },
  },
  "logistics:logistics_quote": {
    canonicalName: "henry.logistics.quote.requested",
    classification: "user_action",
    funnelKey: "logistics_booking",
    funnelStep: "quote_requested",
    defaultOutcome: "requested",
    entityType: "logistics_shipment",
    touches: { finance: true },
  },
  "logistics:logistics_booking": {
    canonicalName: "henry.logistics.booking.created",
    classification: "user_action",
    funnelKey: "logistics_booking",
    funnelStep: "shipment_booked",
    defaultOutcome: "submitted",
    entityType: "logistics_shipment",
    touches: { finance: true },
  },
  "property:property_saved": {
    canonicalName: "henry.property.listing.saved",
    classification: "user_action",
    funnelKey: "property_inquiry",
    funnelStep: "listing_saved",
    defaultOutcome: "saved",
    entityType: "property_listing",
  },
  "property:property_unsaved": {
    canonicalName: "henry.property.listing.unsaved",
    classification: "user_action",
    defaultOutcome: "removed",
    entityType: "property_listing",
  },
  "property:property_inquiry": {
    canonicalName: "henry.property.inquiry.submitted",
    classification: "user_action",
    funnelKey: "property_inquiry",
    funnelStep: "listing_inquired",
    defaultOutcome: "submitted",
    entityType: "property_inquiry",
    touches: { support: true },
  },
  "property:property_viewing_requested": {
    canonicalName: "henry.property.viewing.requested",
    classification: "user_action",
    funnelKey: "property_inquiry",
    funnelStep: "viewing_requested",
    defaultOutcome: "requested",
    entityType: "property_viewing_request",
    touches: { support: true },
  },
  "property:property_listing_submitted": {
    canonicalName: "henry.property.listing.submitted",
    classification: "user_action",
    funnelKey: "property_submission",
    funnelStep: "listing_submitted",
    defaultOutcome: "submitted",
    entityType: "property_listing",
    touches: { trust: true },
  },
  "property:property_listing_updated": {
    canonicalName: "henry.property.listing.updated",
    classification: "user_action",
    funnelKey: "property_submission",
    funnelStep: "listing_submitted",
    defaultOutcome: "updated",
    entityType: "property_listing",
    touches: { trust: true },
  },
  "property:property_listing_reviewed": {
    canonicalName: "henry.property.listing.reviewed",
    classification: "system_state",
    funnelKey: "property_submission",
    funnelStep: "listing_reviewed",
    defaultOutcome: "resolved",
    entityType: "property_listing",
    touches: { trust: true },
  },
  "studio:studio_lead_submitted": {
    canonicalName: "henry.studio.lead.submitted",
    classification: "user_action",
    funnelKey: "studio_lead",
    funnelStep: "lead_submitted",
    defaultOutcome: "submitted",
    entityType: "studio_lead",
  },
  "studio:studio_proposal_ready": {
    canonicalName: "henry.studio.proposal.ready",
    classification: "system_state",
    funnelKey: "studio_lead",
    funnelStep: "proposal_ready",
    defaultOutcome: "completed",
    entityType: "studio_proposal",
  },
  "studio:studio_payment_updated": {
    canonicalName: "henry.studio.payment.updated",
    classification: "system_state",
    funnelKey: "studio_lead",
    funnelStep: "project_paid",
    defaultOutcome: "paid",
    entityType: "studio_payment",
    touches: { finance: true },
  },
  "studio:studio_project_updated": {
    canonicalName: "henry.studio.project.updated",
    classification: "system_state",
    defaultOutcome: "updated",
    entityType: "studio_project",
  },
  "studio:studio_message_added": {
    canonicalName: "henry.studio.message.added",
    classification: "user_action",
    defaultOutcome: "updated",
    entityType: "studio_project_message",
    touches: { support: true },
  },
};

const MARKETPLACE_ACTION_DESCRIPTORS: Record<string, HenryAnalyticsDescriptor> = {
  cart_item_added: {
    canonicalName: "henry.marketplace.cart.updated",
    classification: "user_action",
    funnelKey: "marketplace_purchase",
    funnelStep: "cart_add",
    defaultOutcome: "saved",
    entityType: "product",
  },
  wishlist_added: {
    canonicalName: "henry.marketplace.wishlist.updated",
    classification: "user_action",
    funnelKey: "marketplace_purchase",
    funnelStep: "wishlist_update",
    defaultOutcome: "saved",
    entityType: "product",
  },
  wishlist_removed: {
    canonicalName: "henry.marketplace.wishlist.updated",
    classification: "user_action",
    defaultOutcome: "removed",
    entityType: "product",
  },
  vendor_followed: {
    canonicalName: "henry.marketplace.vendor.follow_updated",
    classification: "user_action",
    funnelKey: "marketplace_purchase",
    funnelStep: "vendor_follow",
    defaultOutcome: "saved",
    entityType: "vendor",
  },
  vendor_unfollowed: {
    canonicalName: "henry.marketplace.vendor.follow_updated",
    classification: "user_action",
    defaultOutcome: "removed",
    entityType: "vendor",
  },
  address_set_default: {
    canonicalName: "henry.marketplace.address.default_set",
    classification: "user_action",
    defaultOutcome: "updated",
    entityType: "address",
  },
  address_deleted: {
    canonicalName: "henry.marketplace.address.deleted",
    classification: "user_action",
    defaultOutcome: "removed",
    entityType: "address",
  },
  marketplace_mutation_failed: {
    canonicalName: "henry.marketplace.mutation.failed",
    classification: "system_state",
    defaultOutcome: "failed",
    entityType: "marketplace",
    experimentSafe: false,
  },
};

export const HENRY_FUNNEL_DEFINITIONS: HenryFunnelDefinition[] = [
  {
    key: "visitor_to_account",
    division: "account",
    label: "Visitor to account creation",
    description: "New account creation and early account readiness.",
    steps: [
      { key: "account_created", label: "Account created" },
      { key: "verification_submitted", label: "Verification submitted" },
      { key: "verification_resolved", label: "Verification resolved" },
    ],
  },
  {
    key: "verification_completion",
    division: "account",
    label: "Verification completion",
    description: "KYC submission through verified or rejected resolution.",
    steps: [
      { key: "verification_submitted", label: "Submitted" },
      { key: "verification_resolved", label: "Resolved" },
    ],
  },
  {
    key: "marketplace_purchase",
    division: "marketplace",
    label: "Marketplace purchase funnel",
    description: "Cart intent through paid order progression.",
    steps: [
      { key: "cart_add", label: "Cart add" },
      { key: "wishlist_update", label: "Wishlist update" },
      { key: "checkout_started", label: "Checkout started" },
      { key: "order_placed", label: "Order placed" },
      { key: "order_paid", label: "Payment verified" },
      { key: "order_fulfillment", label: "Fulfillment update" },
    ],
  },
  {
    key: "care_booking",
    division: "care",
    label: "Care booking funnel",
    description: "Booking creation and operational completion.",
    steps: [
      { key: "booking_requested", label: "Booking requested" },
      { key: "booking_confirmed", label: "Booking confirmed" },
      { key: "booking_completed", label: "Booking completed" },
    ],
  },
  {
    key: "learn_enrollment",
    division: "learn",
    label: "Learn enrollment funnel",
    description: "Enrollment, payment, and certificate issuance.",
    steps: [
      { key: "course_enrolled", label: "Enrollment" },
      { key: "payment_confirmed", label: "Payment confirmed" },
      { key: "certificate_issued", label: "Certificate issued" },
    ],
  },
  {
    key: "jobs_application",
    division: "jobs",
    label: "Jobs application funnel",
    description: "Saved roles through application progress.",
    steps: [
      { key: "job_saved", label: "Role saved" },
      { key: "job_applied", label: "Applied" },
      { key: "application_progressed", label: "Progressed" },
    ],
  },
  {
    key: "property_inquiry",
    division: "property",
    label: "Property inquiry funnel",
    description: "Saved listing through inquiry and viewing.",
    steps: [
      { key: "listing_saved", label: "Saved" },
      { key: "listing_inquired", label: "Inquiry submitted" },
      { key: "viewing_requested", label: "Viewing requested" },
    ],
  },
  {
    key: "property_submission",
    division: "property",
    label: "Property submission funnel",
    description: "Listing submission through review.",
    steps: [
      { key: "listing_submitted", label: "Submitted" },
      { key: "listing_reviewed", label: "Reviewed" },
    ],
  },
  {
    key: "studio_lead",
    division: "studio",
    label: "Studio lead funnel",
    description: "Lead intake through proposal and payment progression.",
    steps: [
      { key: "lead_submitted", label: "Lead submitted" },
      { key: "proposal_ready", label: "Proposal ready" },
      { key: "project_paid", label: "Payment updated" },
    ],
  },
  {
    key: "logistics_booking",
    division: "logistics",
    label: "Logistics quote and booking funnel",
    description: "Quote requests converting into bookings.",
    steps: [
      { key: "quote_requested", label: "Quote requested" },
      { key: "shipment_booked", label: "Shipment booked" },
    ],
  },
  {
    key: "wallet_funding",
    division: "wallet",
    label: "Wallet funding funnel",
    description: "Funding request through proof submission.",
    steps: [
      { key: "wallet_funding_requested", label: "Funding requested" },
      { key: "wallet_proof_uploaded", label: "Proof uploaded" },
    ],
  },
  {
    key: "wallet_withdrawal",
    division: "wallet",
    label: "Wallet withdrawal funnel",
    description: "Withdrawal attempt with trust-gate visibility.",
    steps: [{ key: "wallet_withdrawal_requested", label: "Withdrawal requested" }],
  },
  {
    key: "support_recovery",
    division: "account",
    label: "Support recovery funnel",
    description: "Support friction and reply progression.",
    steps: [
      { key: "support_created", label: "Thread created" },
      { key: "support_replied", label: "Reply added" },
    ],
  },
];

function descriptorForActivity(input: MetadataBuildInput): HenryAnalyticsDescriptor {
  const key = `${cleanText(input.division).toLowerCase()}:${cleanText(input.activityType).toLowerCase()}`;
  const descriptor = HIGH_SIGNAL_ACTIVITY_DESCRIPTORS[key];
  if (descriptor) return descriptor;

  if (cleanText(input.activityType).startsWith("intel:henry.")) {
    const eventName = cleanText(input.activityType).slice("intel:".length);
    return {
      canonicalName: eventName,
      classification: "system_state",
      defaultOutcome: inferOutcome(input.status),
      entityType: cleanText(input.referenceType) || "intel_event",
    };
  }

  return {
    canonicalName: `henry.${cleanText(input.division).toLowerCase() || "system"}.activity.recorded`,
    classification: "system_state",
    defaultOutcome: inferOutcome(input.status),
    entityType: cleanText(input.referenceType) || "activity",
  };
}

function descriptorForMarketplaceAction(input: ActionMetadataBuildInput): HenryAnalyticsDescriptor {
  return (
    MARKETPLACE_ACTION_DESCRIPTORS[cleanText(input.eventType).toLowerCase()] || {
      canonicalName: "henry.marketplace.activity.recorded",
      classification: "user_action",
      defaultOutcome: "updated",
      entityType: cleanText(input.entityType) || "marketplace",
    }
  );
}

function buildAnalytics(
  division: string,
  activityType: string,
  descriptor: HenryAnalyticsDescriptor,
  status: string | null,
  entityType: string | null,
  entityId: string | null,
  sourceProperties: Record<string, unknown> | null | undefined
): HenryCanonicalAnalytics {
  const { properties, redactions } = sanitizeAnalyticsProperties(sourceProperties);
  const inferredOutcome = inferOutcome(status);
  return {
    version: HENRY_ANALYTICS_VERSION,
    canonicalName: descriptor.canonicalName,
    classification: descriptor.classification,
    division,
    activityType,
    outcome:
      inferredOutcome !== "unknown"
        ? inferredOutcome
        : descriptor.defaultOutcome || "unknown",
    status,
    funnelKey: descriptor.funnelKey || null,
    funnelStep: descriptor.funnelStep || null,
    entityType: entityType || descriptor.entityType || null,
    entityId,
    experimentSafe: descriptor.experimentSafe ?? true,
    ownerVisible: descriptor.ownerVisible ?? true,
    operatorVisible: descriptor.operatorVisible ?? true,
    touches: {
      support: Boolean(descriptor.touches?.support),
      trust: Boolean(descriptor.touches?.trust),
      finance: Boolean(descriptor.touches?.finance),
      notification: Boolean(descriptor.touches?.notification),
    },
    properties,
    redactions,
  };
}

export function buildCanonicalActivityMetadata(input: MetadataBuildInput) {
  const division = cleanText(input.division).toLowerCase() || "system";
  const activityType = cleanText(input.activityType).toLowerCase() || "event";
  const descriptor = descriptorForActivity(input);
  const analytics = buildAnalytics(
    division,
    activityType,
    descriptor,
    toStatus(input.status),
    cleanText(input.referenceType) || descriptor.entityType || null,
    cleanText(input.referenceId) || null,
    input.metadata
  );

  return {
    ...(input.metadata ?? {}),
    analytics,
    analytics_version: analytics.version,
    analytics_event_name: analytics.canonicalName,
    analytics_classification: analytics.classification,
    analytics_outcome: analytics.outcome,
    analytics_funnel_key: analytics.funnelKey,
    analytics_funnel_step: analytics.funnelStep,
  };
}

export function buildCanonicalActionMetadata(input: ActionMetadataBuildInput) {
  const descriptor = descriptorForMarketplaceAction(input);
  const analytics = buildAnalytics(
    cleanText(input.division).toLowerCase() || "system",
    cleanText(input.eventType).toLowerCase(),
    descriptor,
    descriptor.defaultOutcome || null,
    cleanText(input.entityType) || descriptor.entityType || null,
    cleanText(input.entityId) || null,
    input.details
  );

  return {
    analytics,
    analytics_version: analytics.version,
    analytics_event_name: analytics.canonicalName,
    analytics_classification: analytics.classification,
    analytics_outcome: analytics.outcome,
    analytics_funnel_key: analytics.funnelKey,
    analytics_funnel_step: analytics.funnelStep,
  };
}

export function readActivityAnalytics(row: HenryActivityRowLike): HenryNormalizedActivityRow | null {
  const division = cleanText(row.division).toLowerCase();
  const activityType = cleanText(row.activity_type).toLowerCase();
  if (!division || !activityType) return null;

  const metadata = asRecord(row.metadata);
  const existingAnalytics = asRecord(metadata.analytics);
  const analytics =
    existingAnalytics.canonicalName && existingAnalytics.version
      ? ({
          version: Number(existingAnalytics.version) as typeof HENRY_ANALYTICS_VERSION,
          canonicalName: cleanText(existingAnalytics.canonicalName),
          classification:
            cleanText(existingAnalytics.classification) === "user_action"
              ? "user_action"
              : "system_state",
          division: cleanText(existingAnalytics.division) || division,
          activityType: cleanText(existingAnalytics.activityType) || activityType,
          outcome: (cleanText(existingAnalytics.outcome) || "unknown") as HenryAnalyticsOutcome,
          status: toStatus(existingAnalytics.status) || toStatus(row.status),
          funnelKey: (cleanText(existingAnalytics.funnelKey) || null) as HenryFunnelKey | null,
          funnelStep: cleanText(existingAnalytics.funnelStep) || null,
          entityType: cleanText(existingAnalytics.entityType) || cleanText(row.reference_type) || null,
          entityId: cleanText(existingAnalytics.entityId) || cleanText(row.reference_id) || null,
          experimentSafe: Boolean(existingAnalytics.experimentSafe ?? true),
          ownerVisible: Boolean(existingAnalytics.ownerVisible ?? true),
          operatorVisible: Boolean(existingAnalytics.operatorVisible ?? true),
          touches: {
            support: Boolean(asRecord(existingAnalytics.touches).support),
            trust: Boolean(asRecord(existingAnalytics.touches).trust),
            finance: Boolean(asRecord(existingAnalytics.touches).finance),
            notification: Boolean(asRecord(existingAnalytics.touches).notification),
          },
          properties: asRecord(existingAnalytics.properties),
          redactions: Array.isArray(existingAnalytics.redactions)
            ? existingAnalytics.redactions.map((item) => cleanText(item)).filter(Boolean)
            : [],
        } satisfies HenryCanonicalAnalytics)
      : buildAnalytics(
          division,
          activityType,
          descriptorForActivity({
            division,
            activityType,
            status: toStatus(row.status),
            referenceType: cleanText(row.reference_type),
            referenceId: cleanText(row.reference_id),
            metadata,
          }),
          toStatus(row.status),
          cleanText(row.reference_type) || null,
          cleanText(row.reference_id) || null,
          metadata
        );

  return {
    id: cleanText(row.id) || `${division}:${activityType}:${cleanText(row.reference_id)}`,
    userId: cleanText(row.user_id) || null,
    division,
    activityType,
    status: toStatus(row.status),
    referenceType: cleanText(row.reference_type) || null,
    referenceId: cleanText(row.reference_id) || null,
    createdAt: cleanText(row.created_at) || null,
    amountKobo: Number.isFinite(Number(row.amount_kobo)) ? Number(row.amount_kobo) : null,
    actionUrl: cleanText(row.action_url) || null,
    metadata,
    analytics,
  };
}

export function summarizeFunnels(rows: HenryActivityRowLike[]): HenryFunnelSummary[] {
  const normalized = rows.map(readActivityAnalytics).filter((row): row is HenryNormalizedActivityRow => Boolean(row));
  return HENRY_FUNNEL_DEFINITIONS.map((definition) => {
    const relevant = normalized.filter((row) => row.analytics.funnelKey === definition.key);
    const stepSets = new Map<string, Set<string>>();
    const stepBlocked = new Map<string, number>();
    const stepFailed = new Map<string, number>();
    const stepPending = new Map<string, number>();

    for (const step of definition.steps) {
      stepSets.set(step.key, new Set<string>());
      stepBlocked.set(step.key, 0);
      stepFailed.set(step.key, 0);
      stepPending.set(step.key, 0);
    }

    for (const row of relevant) {
      const stepKey = row.analytics.funnelStep || definition.steps[0]?.key;
      if (!stepKey || !stepSets.has(stepKey)) continue;
      const subjectKey = row.userId || row.referenceId || row.id;
      stepSets.get(stepKey)?.add(subjectKey);
      if (row.analytics.outcome === "blocked") {
        stepBlocked.set(stepKey, (stepBlocked.get(stepKey) || 0) + 1);
      }
      if (row.analytics.outcome === "failed" || row.analytics.outcome === "rejected") {
        stepFailed.set(stepKey, (stepFailed.get(stepKey) || 0) + 1);
      }
      if (row.analytics.outcome === "pending") {
        stepPending.set(stepKey, (stepPending.get(stepKey) || 0) + 1);
      }
    }

    const steps = definition.steps.map((step) => ({
      key: step.key,
      label: step.label,
      count: stepSets.get(step.key)?.size || 0,
      blocked: stepBlocked.get(step.key) || 0,
      failed: stepFailed.get(step.key) || 0,
      pending: stepPending.get(step.key) || 0,
    }));

    const participants = steps[0]?.count || 0;
    const terminalCount = steps.at(-1)?.count || 0;
    const conversionRate = participants > 0 ? Number((terminalCount / participants).toFixed(4)) : null;

    let bottleneckStep: string | null = null;
    let largestDrop = -1;
    for (let index = 1; index < steps.length; index += 1) {
      const previous = steps[index - 1]?.count || 0;
      const current = steps[index]?.count || 0;
      const drop = previous - current;
      if (drop > largestDrop) {
        largestDrop = drop;
        bottleneckStep = steps[index]?.label || null;
      }
    }

    return {
      key: definition.key,
      division: definition.division,
      label: definition.label,
      description: definition.description,
      participants,
      terminalCount,
      conversionRate,
      bottleneckStep,
      steps,
    };
  }).filter((summary) => summary.participants > 0);
}

export function summarizeIntegrity(rows: HenryActivityRowLike[]): HenryIntegritySummary {
  const normalized = rows.map(readActivityAnalytics).filter((row): row is HenryNormalizedActivityRow => Boolean(row));
  const duplicateKeys = new Map<string, number>();

  for (const row of normalized) {
    const key = [
      row.userId || "anonymous",
      row.analytics.canonicalName,
      row.referenceType || row.analytics.entityType || "entity",
      row.referenceId || row.analytics.entityId || "none",
      row.analytics.outcome,
    ].join(":");
    duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
  }

  return {
    totalRows: rows.length,
    canonicalRows: normalized.length,
    funnelRows: normalized.filter((row) => Boolean(row.analytics.funnelKey)).length,
    supportRows: normalized.filter((row) => row.analytics.touches.support).length,
    trustRows: normalized.filter((row) => row.analytics.touches.trust).length,
    financeRows: normalized.filter((row) => row.analytics.touches.finance).length,
    notificationRows: normalized.filter((row) => row.analytics.touches.notification).length,
    possibleDuplicateRows: [...duplicateKeys.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0),
    redactedRows: normalized.filter((row) => row.analytics.redactions.length > 0).length,
  };
}

export function assignExperimentVariant(
  definition: HenryExperimentDefinition,
  subjectKey: string
): HenryExperimentAssignment {
  const bucket = fnv1a(`${definition.key}:${subjectKey}`) % 10000;
  const percent = bucket / 100;
  let cursor = 0;
  let variant = definition.variants[0]?.key || "control";

  for (const candidate of definition.variants) {
    cursor += Math.max(0, candidate.allocation);
    if (percent < cursor) {
      variant = candidate.key;
      break;
    }
  }

  return {
    key: definition.key,
    boundary: definition.boundary,
    variant,
    bucket,
    allowed: !HIGH_RISK_EXPERIMENT_BOUNDARIES.has(definition.boundary),
  };
}

export function buildExperimentAuditMetadata(
  definition: HenryExperimentDefinition,
  subjectKey: string
) {
  const assignment = assignExperimentVariant(definition, subjectKey);
  return {
    experiment: {
      key: assignment.key,
      boundary: assignment.boundary,
      variant: assignment.variant,
      bucket: assignment.bucket,
      allowed: assignment.allowed,
    },
  };
}
