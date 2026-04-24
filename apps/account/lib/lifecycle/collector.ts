import "server-only";

import { getAccountUrl, getDivisionUrl } from "@henryco/config";
import {
  LIFECYCLE_SNAPSHOT_TABLE,
  derivePriority,
  deriveWaitStage,
  isDormantSignal,
  isReEngagementCandidate,
  isChurnRisk,
  isAwaitingBusinessStalled,
  isAwaitingUserStalled,
  rankActionables,
  type LifecycleActionable,
  type LifecycleDivision,
  type LifecyclePillar,
  type LifecycleSnapshot,
  type LifecycleSnapshotEntry,
} from "@henryco/lifecycle";
import { createAdminSupabase } from "@/lib/supabase";
import { getAccountTrustProfile, type AccountTrustProfile } from "@/lib/trust";

const admin = () => createAdminSupabase();

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function toIso(value: unknown): string | null {
  const text = asNullableText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function maxIso(...values: (string | null | undefined)[]): string | null {
  let best: number | null = null;
  let bestIso: string | null = null;
  for (const value of values) {
    if (!value) continue;
    const parsed = new Date(value).getTime();
    if (!Number.isFinite(parsed)) continue;
    if (best == null || parsed > best) {
      best = parsed;
      bestIso = new Date(parsed).toISOString();
    }
  }
  return bestIso;
}

const ACCOUNT_ORIGIN = getAccountUrl("").replace(/\/$/, "");
const MARKETPLACE_ORIGIN = getDivisionUrl("marketplace");
const JOBS_ORIGIN = getDivisionUrl("jobs");
const CARE_ORIGIN = getDivisionUrl("care");
const LOGISTICS_ORIGIN = getDivisionUrl("logistics");
const STUDIO_ORIGIN = getDivisionUrl("studio");
const PROPERTY_ORIGIN = getDivisionUrl("property");
const LEARN_ORIGIN = getDivisionUrl("learn");

function url(origin: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${clean}`;
}

function hasOpenThreadStatus(status: unknown): boolean {
  const text = asText(status).toLowerCase();
  if (!text) return false;
  return !["closed", "resolved", "archived", "won", "lost"].includes(text);
}

type RawProfile = Record<string, unknown> | null | undefined;
type RawList = Array<Record<string, unknown>>;

type PillarCtx = {
  pillar: LifecyclePillar;
  division: LifecycleDivision;
  origin: string;
};

function toEntry(
  ctx: PillarCtx,
  partial: {
    stage: LifecycleSnapshotEntry["stage"];
    status: string;
    priority: LifecycleSnapshotEntry["priority"];
    lastActiveAt: string | null;
    lastEventAt?: string | null;
    blockerReason?: string | null;
    nextActionLabel?: string | null;
    nextActionUrl?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    metadata?: Record<string, unknown>;
  }
): LifecycleSnapshotEntry {
  return {
    pillar: ctx.pillar,
    division: ctx.division,
    stage: partial.stage,
    status: partial.status,
    priority: partial.priority,
    lastActiveAt: partial.lastActiveAt,
    lastEventAt: partial.lastEventAt ?? partial.lastActiveAt,
    blockerReason: partial.blockerReason ?? null,
    nextActionLabel: partial.nextActionLabel ?? null,
    nextActionUrl: partial.nextActionUrl ?? null,
    referenceType: partial.referenceType ?? null,
    referenceId: partial.referenceId ?? null,
    metadata: partial.metadata ?? {},
  };
}

function entryToActionable(entry: LifecycleSnapshotEntry): LifecycleActionable | null {
  if (!entry.nextActionLabel || !entry.nextActionUrl) return null;
  return {
    pillar: entry.pillar,
    division: entry.division,
    stage: entry.stage,
    priority: entry.priority,
    title: entry.nextActionLabel,
    detail: entry.status,
    actionUrl: entry.nextActionUrl,
    actionLabel: entry.nextActionLabel,
    blockerReason: entry.blockerReason,
    lastActiveAt: entry.lastActiveAt,
    referenceId: entry.referenceId,
    referenceType: entry.referenceType,
  };
}

// ──────────────────────────────────────────────────────────────
// Pillar builders
// ──────────────────────────────────────────────────────────────

function buildIdentityEntry(input: {
  profile: RawProfile;
  trust: AccountTrustProfile;
  accountAgeDays: number;
  lastActivityAt: string | null;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "identity", division: "account", origin: ACCOUNT_ORIGIN };
  const completion = input.trust.signals.profileCompletion;
  const isNew = input.accountAgeDays <= 2;
  const hasName = Boolean(asNullableText(input.profile?.full_name));
  const hasPhone = Boolean(asNullableText(input.profile?.phone));
  const profileIncomplete = completion < 60 || !hasName || !hasPhone;

  const stage = isNew
    ? "onboarding"
    : deriveWaitStage({
        hasHardBlocker: false,
        hasPendingBusinessReview: false,
        hasUnresolvedAction: profileIncomplete,
        lastActivityAt: input.lastActivityAt,
      });

  const priority = derivePriority({ stage, stalled: isAwaitingUserStalled(input.lastActivityAt) });

  const next =
    stage === "onboarding" || profileIncomplete
      ? { label: "Complete your profile", href: url(ACCOUNT_ORIGIN, "/settings") }
      : { label: null, href: null };

  return toEntry(ctx, {
    stage,
    status: profileIncomplete ? `Profile ${completion}% complete` : "Profile on file",
    priority,
    lastActiveAt: input.lastActivityAt,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    metadata: {
      profile_completion: completion,
      account_age_days: input.accountAgeDays,
      has_full_name: hasName,
      has_phone: hasPhone,
    },
  });
}

function buildTrustEntry(input: {
  trust: AccountTrustProfile;
  lastActivityAt: string | null;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "trust", division: "account", origin: ACCOUNT_ORIGIN };
  const status = input.trust.signals.verificationStatus;
  const pendingReview = status === "pending";
  const rejected = status === "rejected";
  const verified = status === "verified";
  const overlapsFlagged = input.trust.signals.duplicateEmailMatches > 0 || input.trust.signals.duplicatePhoneMatches > 0;

  const stage = verified
    ? "retained"
    : rejected
      ? "blocked"
      : pendingReview
        ? "awaiting_business"
        : "awaiting_user";

  const priority = derivePriority({
    stage,
    escalate: rejected,
    stalled: stage === "awaiting_business" ? isAwaitingBusinessStalled(input.lastActivityAt) : isAwaitingUserStalled(input.lastActivityAt),
  });

  const label =
    stage === "retained"
      ? null
      : stage === "awaiting_business"
        ? "Check verification status"
        : stage === "blocked"
          ? "Resolve verification"
          : "Submit verification";

  return toEntry(ctx, {
    stage,
    status: `Trust tier: ${input.trust.tier.replace(/_/g, " ")}`,
    priority,
    lastActiveAt: input.lastActivityAt,
    blockerReason: rejected ? "verification_rejected" : overlapsFlagged ? "contact_overlap_review" : null,
    nextActionLabel: label,
    nextActionUrl: label ? url(ACCOUNT_ORIGIN, "/verification") : null,
    metadata: {
      tier: input.trust.tier,
      score: input.trust.score,
      verification_status: status,
      duplicate_email_matches: input.trust.signals.duplicateEmailMatches,
      duplicate_phone_matches: input.trust.signals.duplicatePhoneMatches,
    },
  });
}

function buildWalletEntry(input: {
  wallet: RawProfile;
  fundingRequests: RawList;
  withdrawalRequests: RawList;
  lastActivityAt: string | null;
  trust: AccountTrustProfile;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "wallet", division: "account", origin: ACCOUNT_ORIGIN };

  const pendingFunding = input.fundingRequests.find((row) => {
    const status = asText(row.status).toLowerCase();
    return status !== "completed" && status !== "verified" && status !== "failed" && status !== "rejected";
  });
  const pendingWithdrawal = input.withdrawalRequests.find((row) => {
    const status = asText(row.status).toLowerCase();
    return ["pending", "processing", "review", "under_review", "submitted"].includes(status);
  });

  const payoutEligible = input.trust.flags.payoutEligible;
  const hasWallet = Boolean(input.wallet);
  const walletFrozen = Boolean(input.wallet && input.wallet.is_active === false);

  let stage: LifecycleSnapshotEntry["stage"] = "in_progress";
  let status = "Wallet active";
  let next: { label: string | null; href: string | null } = { label: null, href: null };
  let blockerReason: string | null = null;
  let referenceType: string | null = null;
  let referenceId: string | null = null;

  if (walletFrozen) {
    stage = "blocked";
    status = "Wallet frozen";
    blockerReason = "wallet_frozen";
    next = { label: "Contact finance support", href: url(ACCOUNT_ORIGIN, "/support") };
  } else if (pendingFunding) {
    stage = "awaiting_business";
    status = "Funding awaiting verification";
    referenceType = "wallet_funding_request";
    referenceId = asNullableText(pendingFunding.id);
    next = { label: "Review funding request", href: url(ACCOUNT_ORIGIN, "/wallet/funding") };
  } else if (pendingWithdrawal) {
    stage = "awaiting_business";
    status = "Withdrawal in review";
    referenceType = "wallet_withdrawal_request";
    referenceId = asNullableText(pendingWithdrawal.id);
    next = { label: "Track withdrawal", href: url(ACCOUNT_ORIGIN, "/wallet") };
  } else if (!payoutEligible) {
    stage = "awaiting_user";
    status = "Payout eligibility pending";
    next = { label: "Complete trust requirements", href: url(ACCOUNT_ORIGIN, "/verification") };
  } else if (!hasWallet) {
    stage = "new";
    status = "Wallet not yet provisioned";
  } else if (isDormantSignal(input.lastActivityAt)) {
    stage = "dormant";
    status = "Wallet idle";
  } else if (isReEngagementCandidate(input.lastActivityAt)) {
    stage = "reengagement_candidate";
    status = "Wallet quiet recently";
  }

  const priority = derivePriority({
    stage,
    stalled:
      stage === "awaiting_business"
        ? isAwaitingBusinessStalled(input.lastActivityAt)
        : isAwaitingUserStalled(input.lastActivityAt),
  });

  return toEntry(ctx, {
    stage,
    status,
    priority,
    lastActiveAt: input.lastActivityAt,
    blockerReason,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    referenceType,
    referenceId,
    metadata: {
      pending_funding_count: input.fundingRequests.length,
      pending_withdrawal_count: input.withdrawalRequests.length,
      payout_eligible: payoutEligible,
      wallet_active: !walletFrozen && hasWallet,
    },
  });
}

function buildSupportEntry(input: {
  threads: RawList;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "support", division: "support", origin: ACCOUNT_ORIGIN };
  const openThreads = input.threads.filter((thread) => hasOpenThreadStatus(thread.status));
  const awaitingBusiness = openThreads.filter((thread) => {
    const status = asText(thread.status).toLowerCase();
    return ["pending", "awaiting_agent", "awaiting_staff", "in_review", "escalated"].some(
      (token) => status.includes(token)
    );
  });
  const awaitingUser = openThreads.filter((thread) => {
    const status = asText(thread.status).toLowerCase();
    return status.includes("awaiting_customer") || status.includes("awaiting_user");
  });
  const lastActiveAt = openThreads.reduce<string | null>((acc, thread) => {
    const candidate = toIso(thread.updated_at) ?? toIso(thread.created_at);
    return maxIso(acc, candidate);
  }, null);

  let stage: LifecycleSnapshotEntry["stage"];
  let statusLabel: string;
  let referenceId: string | null = null;
  let next: { label: string | null; href: string | null } = { label: null, href: null };

  if (awaitingUser.length > 0) {
    const thread = awaitingUser[0];
    stage = "awaiting_user";
    statusLabel = awaitingUser.length > 1 ? `${awaitingUser.length} threads waiting on you` : "Support thread waiting on you";
    referenceId = asNullableText(thread.id);
    next = { label: "Reply to support", href: url(ACCOUNT_ORIGIN, `/support/${asText(thread.id)}`) };
  } else if (awaitingBusiness.length > 0) {
    const thread = awaitingBusiness[0];
    stage = "awaiting_business";
    statusLabel = awaitingBusiness.length > 1 ? `${awaitingBusiness.length} threads with our team` : "Support is handling your thread";
    referenceId = asNullableText(thread.id);
    next = { label: "Open support thread", href: url(ACCOUNT_ORIGIN, `/support/${asText(thread.id)}`) };
  } else if (openThreads.length > 0) {
    const thread = openThreads[0];
    stage = "in_progress";
    statusLabel = openThreads.length > 1 ? `${openThreads.length} open threads` : "Support thread open";
    referenceId = asNullableText(thread.id);
    next = { label: "View open support thread", href: url(ACCOUNT_ORIGIN, `/support/${asText(thread.id)}`) };
  } else {
    stage = "retained";
    statusLabel = "No open support threads";
  }

  const priority = derivePriority({
    stage,
    stalled:
      stage === "awaiting_user"
        ? isAwaitingUserStalled(lastActiveAt)
        : stage === "awaiting_business"
          ? isAwaitingBusinessStalled(lastActiveAt)
          : false,
  });

  return toEntry(ctx, {
    stage,
    status: statusLabel,
    priority,
    lastActiveAt,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    referenceType: referenceId ? "support_thread" : null,
    referenceId,
    metadata: {
      open_thread_count: openThreads.length,
      awaiting_user_count: awaitingUser.length,
      awaiting_business_count: awaitingBusiness.length,
    },
  });
}

function buildMarketplaceEntry(input: {
  orders: RawList;
  disputes: RawList;
  vendorApplication: RawProfile;
  trust: AccountTrustProfile;
  lastActivityAt: string | null;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "marketplace", division: "marketplace", origin: MARKETPLACE_ORIGIN };

  const openDisputes = input.disputes.filter((dispute) => {
    const status = asText(dispute.status).toLowerCase();
    return !["resolved", "closed", "cancelled"].includes(status);
  });
  const unfinishedOrders = input.orders.filter((order) => {
    const status = asText(order.status).toLowerCase();
    const paymentStatus = asText(order.payment_status).toLowerCase();
    return !["completed", "delivered", "cancelled", "refunded", "closed"].includes(status) &&
      paymentStatus !== "failed";
  });

  const vendorStatus = asText(input.vendorApplication?.status).toLowerCase();
  const vendorPending = vendorStatus === "submitted" || vendorStatus === "under_review" || vendorStatus === "pending";
  const vendorRejected = vendorStatus === "rejected";

  const marketplaceEligible = input.trust.flags.marketplaceEligible;

  let stage: LifecycleSnapshotEntry["stage"];
  let status: string;
  let next: { label: string | null; href: string | null } = { label: null, href: null };
  let blockerReason: string | null = null;
  let referenceType: string | null = null;
  let referenceId: string | null = null;

  if (openDisputes.length > 0) {
    const dispute = openDisputes[0];
    stage = "blocked";
    status = `Dispute ${asText(dispute.dispute_no) || "open"}`;
    blockerReason = "marketplace_dispute";
    referenceType = "marketplace_dispute";
    referenceId = asNullableText(dispute.id);
    next = { label: "Open dispute", href: url(MARKETPLACE_ORIGIN, "/account/disputes") };
  } else if (vendorRejected) {
    stage = "blocked";
    status = "Vendor application rejected";
    blockerReason = "vendor_application_rejected";
    next = { label: "Review vendor status", href: url(MARKETPLACE_ORIGIN, "/sell/apply") };
  } else if (vendorPending) {
    stage = "awaiting_business";
    status = "Vendor application under review";
    referenceType = "marketplace_vendor_application";
    referenceId = asNullableText(input.vendorApplication?.id);
    next = { label: "View vendor status", href: url(MARKETPLACE_ORIGIN, "/sell/apply") };
  } else if (unfinishedOrders.length > 0) {
    const order = unfinishedOrders[0];
    stage = "in_progress";
    status = unfinishedOrders.length > 1 ? `${unfinishedOrders.length} orders in progress` : "Order in progress";
    referenceType = "marketplace_order";
    referenceId = asNullableText(order.id);
    next = { label: "View order", href: url(MARKETPLACE_ORIGIN, "/account/orders") };
  } else if (input.orders.length === 0) {
    stage = marketplaceEligible ? "browsing" : "evaluating";
    status = "No orders yet";
    next = { label: "Explore marketplace", href: url(MARKETPLACE_ORIGIN, "/") };
  } else if (isDormantSignal(input.lastActivityAt)) {
    stage = isChurnRisk(input.lastActivityAt) ? "churn_risk" : "dormant";
    status = "No recent marketplace activity";
    next = { label: "Return to marketplace", href: url(MARKETPLACE_ORIGIN, "/") };
  } else if (isReEngagementCandidate(input.lastActivityAt)) {
    stage = "reengagement_candidate";
    status = "Marketplace engagement quieting";
    next = { label: "Browse new listings", href: url(MARKETPLACE_ORIGIN, "/") };
  } else {
    stage = "retained";
    status = `${input.orders.length} marketplace orders on file`;
  }

  const priority = derivePriority({
    stage,
    stalled:
      stage === "awaiting_business" ? isAwaitingBusinessStalled(input.lastActivityAt) : false,
  });

  return toEntry(ctx, {
    stage,
    status,
    priority,
    lastActiveAt: input.lastActivityAt,
    blockerReason,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    referenceType,
    referenceId,
    metadata: {
      order_count: input.orders.length,
      open_dispute_count: openDisputes.length,
      unfinished_order_count: unfinishedOrders.length,
      vendor_status: vendorStatus || null,
    },
  });
}

function buildJobsEntry(input: {
  activity: RawList;
  interviews: RawList;
  trust: AccountTrustProfile;
  lastActivityAt: string | null;
}): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "jobs", division: "jobs", origin: JOBS_ORIGIN };

  const applications = input.activity.filter((row) => asText(row.reference_type) === "jobs_application");
  const activeApplications = applications.filter((app) => {
    const status = asText(app.status).toLowerCase();
    return !["rejected", "withdrawn", "hired"].includes(status);
  });
  const awaitingEmployer = activeApplications.filter((app) => {
    const status = asText(app.status).toLowerCase();
    return ["applied", "reviewing", "shortlisted", "submitted"].includes(status);
  });
  const interviewStage = activeApplications.find((app) => asText(app.status).toLowerCase() === "interview");

  const upcomingInterviews = input.interviews.filter((row) => {
    const status = asText(row.status).toLowerCase();
    return ["scheduled", "pending", "confirmed"].includes(status);
  });

  const jobsEligible = input.trust.flags.jobsPostingEligible;

  let stage: LifecycleSnapshotEntry["stage"];
  let status: string;
  let next: { label: string | null; href: string | null } = { label: null, href: null };
  let referenceType: string | null = null;
  let referenceId: string | null = null;

  if (upcomingInterviews.length > 0) {
    const interview = upcomingInterviews[0];
    stage = "awaiting_user";
    status = "Interview scheduled";
    referenceType = "jobs_interview";
    referenceId = asNullableText(interview.id);
    next = { label: "Prepare for interview", href: url(JOBS_ORIGIN, "/account/interviews") };
  } else if (interviewStage) {
    stage = "in_progress";
    status = "Interview round";
    referenceType = "jobs_application";
    referenceId = asNullableText(interviewStage.reference_id);
    next = { label: "Track application", href: url(JOBS_ORIGIN, "/account/applications") };
  } else if (awaitingEmployer.length > 0) {
    stage = "awaiting_business";
    status = awaitingEmployer.length > 1
      ? `${awaitingEmployer.length} applications with employers`
      : "Application with employer";
    referenceType = "jobs_application";
    referenceId = asNullableText(awaitingEmployer[0].reference_id);
    next = { label: "View applications", href: url(JOBS_ORIGIN, "/account/applications") };
  } else if (applications.length === 0) {
    stage = jobsEligible ? "browsing" : "evaluating";
    status = "No applications yet";
    next = { label: "Explore jobs", href: url(JOBS_ORIGIN, "/") };
  } else if (isDormantSignal(input.lastActivityAt)) {
    stage = isChurnRisk(input.lastActivityAt) ? "churn_risk" : "dormant";
    status = "No recent jobs activity";
    next = { label: "Browse jobs", href: url(JOBS_ORIGIN, "/") };
  } else if (isReEngagementCandidate(input.lastActivityAt)) {
    stage = "reengagement_candidate";
    status = "Jobs engagement quieting";
    next = { label: "Browse new roles", href: url(JOBS_ORIGIN, "/") };
  } else {
    stage = "retained";
    status = `${applications.length} applications on file`;
  }

  const priority = derivePriority({
    stage,
    stalled:
      stage === "awaiting_business"
        ? isAwaitingBusinessStalled(input.lastActivityAt)
        : stage === "awaiting_user"
          ? isAwaitingUserStalled(input.lastActivityAt)
          : false,
  });

  return toEntry(ctx, {
    stage,
    status,
    priority,
    lastActiveAt: input.lastActivityAt,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    referenceType,
    referenceId,
    metadata: {
      application_count: applications.length,
      active_application_count: activeApplications.length,
      upcoming_interview_count: upcomingInterviews.length,
      jobs_eligible: jobsEligible,
    },
  });
}

function buildSimpleActivityEntry(
  ctx: PillarCtx,
  activity: RawList,
  opts: {
    inFlightStatuses: string[];
    pendingBusinessStatuses?: string[];
    lastActivityAt: string | null;
    exploreLabel: string;
    exploreHref: string;
    continueLabel: string;
    continueHref: string;
    referenceTypePrefix?: string;
  }
): LifecycleSnapshotEntry {
  const inFlight = activity.filter((row) => {
    const status = asText(row.status).toLowerCase();
    return opts.inFlightStatuses.includes(status);
  });
  const pendingBusiness = opts.pendingBusinessStatuses
    ? activity.filter((row) => {
        const status = asText(row.status).toLowerCase();
        return opts.pendingBusinessStatuses!.includes(status);
      })
    : [];

  let stage: LifecycleSnapshotEntry["stage"];
  let status: string;
  let next: { label: string | null; href: string | null } = { label: null, href: null };
  let referenceType: string | null = null;
  let referenceId: string | null = null;

  if (pendingBusiness.length > 0) {
    const row = pendingBusiness[0];
    stage = "awaiting_business";
    status = `${pendingBusiness.length} ${ctx.pillar} item(s) pending review`;
    referenceType = asNullableText(row.reference_type);
    referenceId = asNullableText(row.reference_id);
    next = { label: opts.continueLabel, href: opts.continueHref };
  } else if (inFlight.length > 0) {
    const row = inFlight[0];
    stage = "in_progress";
    status = `${inFlight.length} ${ctx.pillar} item(s) in progress`;
    referenceType = asNullableText(row.reference_type);
    referenceId = asNullableText(row.reference_id);
    next = { label: opts.continueLabel, href: opts.continueHref };
  } else if (activity.length === 0) {
    stage = "browsing";
    status = "No activity yet";
    next = { label: opts.exploreLabel, href: opts.exploreHref };
  } else if (isDormantSignal(opts.lastActivityAt)) {
    stage = isChurnRisk(opts.lastActivityAt) ? "churn_risk" : "dormant";
    status = "No recent activity";
    next = { label: opts.exploreLabel, href: opts.exploreHref };
  } else if (isReEngagementCandidate(opts.lastActivityAt)) {
    stage = "reengagement_candidate";
    status = "Engagement quieting";
    next = { label: opts.exploreLabel, href: opts.exploreHref };
  } else {
    stage = "retained";
    status = `${activity.length} ${ctx.pillar} item(s) on file`;
  }

  const priority = derivePriority({
    stage,
    stalled:
      stage === "awaiting_business" ? isAwaitingBusinessStalled(opts.lastActivityAt) : false,
  });

  return toEntry(ctx, {
    stage,
    status,
    priority,
    lastActiveAt: opts.lastActivityAt,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    referenceType,
    referenceId,
    metadata: {
      activity_count: activity.length,
      in_flight_count: inFlight.length,
      pending_business_count: pendingBusiness.length,
    },
  });
}

function buildSubscriptionsEntry(subscriptions: RawList): LifecycleSnapshotEntry {
  const ctx: PillarCtx = { pillar: "subscriptions", division: "account", origin: ACCOUNT_ORIGIN };
  const active = subscriptions.filter((row) => asText(row.status).toLowerCase() === "active");
  const pastDue = subscriptions.filter((row) => {
    const status = asText(row.status).toLowerCase();
    return status.includes("past_due") || status.includes("failed");
  });
  const lastActiveAt = subscriptions.reduce<string | null>((acc, row) => {
    return maxIso(acc, toIso(row.updated_at) ?? toIso(row.created_at));
  }, null);

  let stage: LifecycleSnapshotEntry["stage"];
  let status: string;
  let next: { label: string | null; href: string | null } = { label: null, href: null };

  if (pastDue.length > 0) {
    stage = "blocked";
    status = `${pastDue.length} subscription(s) past due`;
    next = { label: "Resolve subscription", href: url(ACCOUNT_ORIGIN, "/subscriptions") };
  } else if (active.length > 0) {
    stage = "retained";
    status = `${active.length} active subscription(s)`;
  } else if (subscriptions.length === 0) {
    stage = "browsing";
    status = "No subscriptions";
  } else {
    stage = "dormant";
    status = "No active subscriptions";
    next = { label: "Review subscriptions", href: url(ACCOUNT_ORIGIN, "/subscriptions") };
  }

  const priority = derivePriority({
    stage,
    escalate: pastDue.length > 0,
  });

  return toEntry(ctx, {
    stage,
    status,
    priority,
    lastActiveAt,
    blockerReason: pastDue.length > 0 ? "subscription_past_due" : null,
    nextActionLabel: next.label,
    nextActionUrl: next.href,
    metadata: {
      total_count: subscriptions.length,
      active_count: active.length,
      past_due_count: pastDue.length,
    },
  });
}

// ──────────────────────────────────────────────────────────────
// Main collector
// ──────────────────────────────────────────────────────────────

export async function collectLifecycleSnapshot(userId: string): Promise<LifecycleSnapshot> {
  const client = admin();
  const trust = await getAccountTrustProfile(userId);

  const [
    profileRes,
    walletRes,
    walletActivityRes,
    fundingRes,
    withdrawalRes,
    supportRes,
    marketplaceOrdersRes,
    marketplaceDisputesRes,
    marketplaceVendorRes,
    marketplaceActivityRes,
    jobsActivityRes,
    jobsInterviewsRes,
    careActivityRes,
    learnActivityRes,
    logisticsActivityRes,
    studioActivityRes,
    propertyActivityRes,
    subscriptionsRes,
    activityRes,
    authRes,
  ] = await Promise.allSettled([
    client.from("customer_profiles").select("*").eq("id", userId).maybeSingle(),
    client.from("customer_wallets").select("*").eq("user_id", userId).maybeSingle(),
    client
      .from("customer_activity")
      .select("created_at")
      .eq("user_id", userId)
      .eq("division", "wallet")
      .order("created_at", { ascending: false })
      .limit(1),
    client
      .from("customer_wallet_funding_requests")
      .select("id, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    client
      .from("customer_wallet_withdrawal_requests")
      .select("id, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    client
      .from("support_threads")
      .select("id, status, updated_at, created_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20),
    client
      .from("marketplace_orders")
      .select("id, status, payment_status, placed_at, updated_at")
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })
      .limit(12),
    client
      .from("marketplace_disputes")
      .select("id, dispute_no, status, updated_at")
      .eq("opened_by_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
    client
      .from("marketplace_vendor_applications")
      .select("id, status, submitted_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("customer_activity")
      .select("created_at")
      .eq("user_id", userId)
      .eq("division", "marketplace")
      .order("created_at", { ascending: false })
      .limit(1),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "jobs")
      .order("created_at", { ascending: false })
      .limit(40),
    client
      .from("jobs_interview_sessions")
      .select("id, status, scheduled_at, updated_at")
      .eq("candidate_user_id", userId)
      .order("scheduled_at", { ascending: false })
      .limit(10),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "care")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "learn")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "logistics")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "studio")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_activity")
      .select("reference_type, reference_id, status, created_at")
      .eq("user_id", userId)
      .eq("division", "property")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_subscriptions")
      .select("id, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("customer_activity")
      .select("division, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    client.auth.admin.getUserById(userId),
  ]);

  function asData<T>(result: PromiseSettledResult<{ data: T | null; error?: unknown }>): T | null {
    if (result.status !== "fulfilled") return null;
    const value = result.value as { data: T | null; error?: unknown } | null;
    if (!value || value.error) return null;
    return value.data;
  }
  function asList(result: PromiseSettledResult<{ data: unknown; error?: unknown }>): RawList {
    if (result.status !== "fulfilled") return [];
    const value = result.value as { data: unknown; error?: unknown } | null;
    if (!value || value.error || !Array.isArray(value.data)) return [];
    return value.data as RawList;
  }

  const profile = asData<Record<string, unknown>>(profileRes);
  const wallet = asData<Record<string, unknown>>(walletRes);
  const vendorApplication = asData<Record<string, unknown>>(marketplaceVendorRes);

  const overallLastActivity = (() => {
    if (activityRes.status !== "fulfilled") return null;
    const rows = asList(activityRes);
    return rows.length > 0 ? toIso(rows[0]?.created_at) : null;
  })();

  const authUser =
    authRes.status === "fulfilled" ? (authRes.value as { data?: { user?: { created_at?: string | null } } }).data?.user : null;
  const accountAgeDays = authUser?.created_at
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const walletLastActivity = maxIso(
    (() => {
      const rows = asList(walletActivityRes);
      return rows.length > 0 ? toIso(rows[0]?.created_at) : null;
    })(),
    toIso(wallet?.updated_at),
    ...asList(fundingRes).map((row) => toIso(row.updated_at) ?? toIso(row.created_at)),
    ...asList(withdrawalRes).map((row) => toIso(row.updated_at) ?? toIso(row.created_at))
  );

  const marketplaceLastActivity = maxIso(
    (() => {
      const rows = asList(marketplaceActivityRes);
      return rows.length > 0 ? toIso(rows[0]?.created_at) : null;
    })(),
    ...asList(marketplaceOrdersRes).map((row) => toIso(row.updated_at) ?? toIso(row.placed_at)),
    ...asList(marketplaceDisputesRes).map((row) => toIso(row.updated_at))
  );

  const jobsLastActivity = maxIso(
    ...asList(jobsActivityRes).map((row) => toIso(row.created_at)),
    ...asList(jobsInterviewsRes).map((row) => toIso(row.updated_at) ?? toIso(row.scheduled_at))
  );

  const careActivity = asList(careActivityRes);
  const learnActivity = asList(learnActivityRes);
  const logisticsActivity = asList(logisticsActivityRes);
  const studioActivity = asList(studioActivityRes);
  const propertyActivity = asList(propertyActivityRes);

  const careLastActivity = maxIso(...careActivity.map((row) => toIso(row.created_at)));
  const learnLastActivity = maxIso(...learnActivity.map((row) => toIso(row.created_at)));
  const logisticsLastActivity = maxIso(...logisticsActivity.map((row) => toIso(row.created_at)));
  const studioLastActivity = maxIso(...studioActivity.map((row) => toIso(row.created_at)));
  const propertyLastActivity = maxIso(...propertyActivity.map((row) => toIso(row.created_at)));

  const entries: LifecycleSnapshotEntry[] = [
    buildIdentityEntry({
      profile,
      trust,
      accountAgeDays,
      lastActivityAt: overallLastActivity,
    }),
    buildTrustEntry({ trust, lastActivityAt: overallLastActivity }),
    buildWalletEntry({
      wallet,
      fundingRequests: asList(fundingRes),
      withdrawalRequests: asList(withdrawalRes),
      lastActivityAt: walletLastActivity,
      trust,
    }),
    buildSupportEntry({ threads: asList(supportRes) }),
    buildMarketplaceEntry({
      orders: asList(marketplaceOrdersRes),
      disputes: asList(marketplaceDisputesRes),
      vendorApplication,
      trust,
      lastActivityAt: marketplaceLastActivity,
    }),
    buildJobsEntry({
      activity: asList(jobsActivityRes),
      interviews: asList(jobsInterviewsRes),
      trust,
      lastActivityAt: jobsLastActivity,
    }),
    buildSimpleActivityEntry(
      { pillar: "care", division: "care", origin: CARE_ORIGIN },
      careActivity,
      {
        inFlightStatuses: ["scheduled", "confirmed", "in_progress", "checked_in"],
        pendingBusinessStatuses: ["pending", "awaiting_provider"],
        lastActivityAt: careLastActivity,
        exploreLabel: "Explore care",
        exploreHref: url(CARE_ORIGIN, "/"),
        continueLabel: "View care bookings",
        continueHref: url(ACCOUNT_ORIGIN, "/division/care"),
      }
    ),
    buildSimpleActivityEntry(
      { pillar: "learn", division: "learn", origin: LEARN_ORIGIN },
      learnActivity,
      {
        inFlightStatuses: ["in_progress", "enrolled", "active"],
        pendingBusinessStatuses: ["pending_review", "awaiting_grading"],
        lastActivityAt: learnLastActivity,
        exploreLabel: "Browse courses",
        exploreHref: url(LEARN_ORIGIN, "/"),
        continueLabel: "Continue learning",
        continueHref: url(LEARN_ORIGIN, "/me"),
      }
    ),
    buildSimpleActivityEntry(
      { pillar: "logistics", division: "logistics", origin: LOGISTICS_ORIGIN },
      logisticsActivity,
      {
        inFlightStatuses: ["in_transit", "dispatched", "picked_up", "processing"],
        pendingBusinessStatuses: ["pending", "awaiting_pickup", "awaiting_dispatch"],
        lastActivityAt: logisticsLastActivity,
        exploreLabel: "Explore logistics",
        exploreHref: url(LOGISTICS_ORIGIN, "/"),
        continueLabel: "Track shipments",
        continueHref: url(ACCOUNT_ORIGIN, "/division/logistics"),
      }
    ),
    buildSimpleActivityEntry(
      { pillar: "studio", division: "studio", origin: STUDIO_ORIGIN },
      studioActivity,
      {
        inFlightStatuses: ["in_progress", "active", "proposal_review"],
        pendingBusinessStatuses: ["pending", "awaiting_studio"],
        lastActivityAt: studioLastActivity,
        exploreLabel: "Explore studio",
        exploreHref: url(STUDIO_ORIGIN, "/"),
        continueLabel: "Open studio project",
        continueHref: url(ACCOUNT_ORIGIN, "/division/studio"),
      }
    ),
    buildSimpleActivityEntry(
      { pillar: "property", division: "property", origin: PROPERTY_ORIGIN },
      propertyActivity,
      {
        inFlightStatuses: ["published", "listed", "active"],
        pendingBusinessStatuses: ["pending_review", "awaiting_verification"],
        lastActivityAt: propertyLastActivity,
        exploreLabel: "Explore property",
        exploreHref: url(PROPERTY_ORIGIN, "/"),
        continueLabel: "Manage listings",
        continueHref: url(ACCOUNT_ORIGIN, "/division/property"),
      }
    ),
    buildSubscriptionsEntry(asList(subscriptionsRes)),
  ];

  const actionables = rankActionables(
    entries.map(entryToActionable).filter((item): item is LifecycleActionable => item != null)
  );

  const hasBlocker = entries.some((entry) => entry.stage === "blocked");
  const hasReEngagement = entries.some(
    (entry) =>
      entry.stage === "dormant" ||
      entry.stage === "reengagement_candidate" ||
      entry.stage === "churn_risk"
  );

  return {
    userId,
    generatedAt: new Date().toISOString(),
    entries,
    actionables,
    hasBlocker,
    hasReEngagement,
    overallLastActiveAt: overallLastActivity,
  };
}

// ──────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────

export async function persistLifecycleSnapshot(snapshot: LifecycleSnapshot): Promise<void> {
  const client = admin();
  const now = new Date().toISOString();
  const rows = snapshot.entries.map((entry) => ({
    user_id: snapshot.userId,
    pillar: entry.pillar,
    division: entry.division,
    stage: entry.stage,
    status: entry.status,
    priority: entry.priority,
    blocker_reason: entry.blockerReason,
    last_active_at: entry.lastActiveAt,
    last_event_at: entry.lastEventAt ?? entry.lastActiveAt,
    next_action_label: entry.nextActionLabel,
    next_action_url: entry.nextActionUrl,
    reference_type: entry.referenceType,
    reference_id: entry.referenceId,
    metadata: entry.metadata,
    updated_at: now,
  }));

  const { error } = await client
    .from(LIFECYCLE_SNAPSHOT_TABLE)
    .upsert(rows, { onConflict: "user_id,pillar" });

  if (error) {
    console.warn("[lifecycle] snapshot persist failed:", error.message);
  }
}

export async function collectAndPersistLifecycleSnapshot(userId: string): Promise<LifecycleSnapshot> {
  const snapshot = await collectLifecycleSnapshot(userId);
  await persistLifecycleSnapshot(snapshot);
  return snapshot;
}

export async function readPersistedLifecycleSnapshot(
  userId: string
): Promise<LifecycleSnapshotEntry[]> {
  const client = admin();
  const { data, error } = await client
    .from(LIFECYCLE_SNAPSHOT_TABLE)
    .select("*")
    .eq("user_id", userId);

  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    pillar: asText(row.pillar) as LifecycleSnapshotEntry["pillar"],
    division: asText(row.division) as LifecycleSnapshotEntry["division"],
    stage: asText(row.stage) as LifecycleSnapshotEntry["stage"],
    status: asText(row.status),
    priority: asText(row.priority) as LifecycleSnapshotEntry["priority"],
    lastActiveAt: toIso(row.last_active_at),
    lastEventAt: toIso(row.last_event_at),
    blockerReason: asNullableText(row.blocker_reason),
    nextActionLabel: asNullableText(row.next_action_label),
    nextActionUrl: asNullableText(row.next_action_url),
    referenceType: asNullableText(row.reference_type),
    referenceId: asNullableText(row.reference_id),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}
