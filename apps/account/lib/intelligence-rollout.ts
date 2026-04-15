import "server-only";

import {
  HenryEventNames,
  nextAccountSteps,
  noopSink,
  trackEvent,
  triageSupportStub,
  type HenryEventEnvelope,
  type TaskItem,
  type UserContext,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import type { AccountTrustProfile } from "@/lib/trust";

function nowIso() {
  return new Date().toISOString();
}

function trustToState(profile: AccountTrustProfile): UserContext["trustState"] {
  if (profile.signals.verificationStatus === "verified") return "verified";
  if (profile.signals.verificationStatus === "pending") return "pending_review";
  return "needs_action";
}

export async function emitIntelligenceEvent(
  event: Omit<HenryEventEnvelope, "version" | "occurredAt">
) {
  trackEvent(noopSink, {
    ...event,
    version: "1",
    occurredAt: nowIso(),
  });

  const admin = createAdminSupabase();
  await admin.from("customer_activity").insert({
    user_id: event.actor?.subjectRef || null,
    division: event.division,
    activity_type: `intel:${event.name}`,
    title: String(event.properties.title || event.name),
    description: String(event.properties.summary || "Intelligence event captured."),
    status: String(event.properties.status || "recorded"),
    reference_type: "intel_event",
    reference_id: String(event.eventId || ""),
    metadata: {
      ...event.properties,
      event_name: event.name,
      correlation_id: event.correlationId || null,
    },
  } as never);
}

export function buildAccountTasks(input: {
  userId: string;
  unreadNotificationCount: number;
  pendingFundingKobo: number;
  openSupportCount: number;
  trust: AccountTrustProfile;
}): TaskItem[] {
  const tasks: TaskItem[] = [];
  if (input.trust.nextTier) {
    tasks.push({
      id: `trust:${input.userId}`,
      title: "Complete trust verification steps",
      description: input.trust.requirements[0] || "Upgrade trust tier to unlock more capabilities.",
      sourceDivision: "account",
      deeplinkTemplate: "/verification",
      priority: "high",
      blocking: input.trust.tier === "basic",
      createdAt: nowIso(),
      readState: "unread",
    });
  }
  if (input.pendingFundingKobo > 0) {
    tasks.push({
      id: `wallet-funding:${input.userId}`,
      title: "Follow up on pending wallet funding",
      description: "Your proof is waiting for finance confirmation.",
      sourceDivision: "wallet",
      deeplinkTemplate: "/wallet/funding",
      priority: "high",
      blocking: false,
      createdAt: nowIso(),
      readState: "unread",
    });
  }
  if (input.openSupportCount > 0) {
    tasks.push({
      id: `support:${input.userId}`,
      title: "Reply to open support thread",
      description: `${input.openSupportCount} support thread(s) still open.`,
      sourceDivision: "care",
      deeplinkTemplate: "/support",
      priority: "normal",
      blocking: false,
      createdAt: nowIso(),
      readState: "unread",
    });
  }
  if (input.unreadNotificationCount > 0) {
    tasks.push({
      id: `notifications:${input.userId}`,
      title: "Review unread notifications",
      description: `${input.unreadNotificationCount} update(s) waiting for review.`,
      sourceDivision: "account",
      deeplinkTemplate: "/notifications",
      priority: "normal",
      blocking: false,
      createdAt: nowIso(),
      readState: "unread",
    });
  }
  return tasks;
}

export function buildAccountRecommendations(input: {
  trust: AccountTrustProfile;
  savedJobsCount: number;
  activeDivisionHints: UserContext["recentDivisions"];
}) {
  const context: UserContext = {
    roleHint: "buyer",
    trustState: trustToState(input.trust),
    profileCompleteness: Math.max(0, Math.min(1, input.trust.signals.profileCompletion / 100)),
    recentDivisions: input.activeDivisionHints || ["account"],
    savedJobIds: input.savedJobsCount > 0 ? ["saved-jobs"] : [],
  };
  return nextAccountSteps(context);
}

export function triageSupportInput(message: string) {
  return triageSupportStub({ message });
}

export const AccountIntelEvents = {
  supportOpened: HenryEventNames.SUPPORT_CONVERSATION_OPENED,
  supportEscalated: HenryEventNames.SUPPORT_CONVERSATION_ESCALATED,
  supportResolved: HenryEventNames.SUPPORT_CONVERSATION_RESOLVED,
  walletDeposit: HenryEventNames.WALLET_DEPOSIT_INITIATED,
  walletWithdraw: HenryEventNames.WALLET_WITHDRAW_REQUESTED,
  profileUpdated: HenryEventNames.PROFILE_UPDATED,
} as const;

