export const LIFECYCLE_STAGES = [
  "new",
  "onboarding",
  "browsing",
  "evaluating",
  "started",
  "awaiting_user",
  "awaiting_business",
  "blocked",
  "in_progress",
  "completed",
  "retained",
  "dormant",
  "reengagement_candidate",
  "churn_risk",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_PILLARS = [
  "identity",
  "trust",
  "wallet",
  "support",
  "marketplace",
  "care",
  "jobs",
  "learn",
  "logistics",
  "property",
  "studio",
  "subscriptions",
] as const;

export type LifecyclePillar = (typeof LIFECYCLE_PILLARS)[number];

export const LIFECYCLE_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type LifecyclePriority = (typeof LIFECYCLE_PRIORITIES)[number];

/**
 * Staff role families that are allowed to see lifecycle context for a customer.
 * Ops roles see most; support/trust/finance see slices.
 */
export const LIFECYCLE_STAFF_ROLE_FAMILIES = [
  "owner",
  "operations",
  "support",
  "trust",
  "finance",
  "division_admin",
] as const;

export type LifecycleStaffRoleFamily = (typeof LIFECYCLE_STAFF_ROLE_FAMILIES)[number];

export type LifecycleDivision =
  | "account"
  | "care"
  | "jobs"
  | "learn"
  | "logistics"
  | "marketplace"
  | "property"
  | "studio"
  | "wallet"
  | "support"
  | "hub";

export type LifecycleActionable = {
  pillar: LifecyclePillar;
  division: LifecycleDivision;
  stage: LifecycleStage;
  priority: LifecyclePriority;
  title: string;
  detail: string;
  actionUrl: string;
  actionLabel: string;
  blockerReason: string | null;
  lastActiveAt: string | null;
  referenceId: string | null;
  referenceType: string | null;
};

export type LifecycleSnapshotEntry = {
  pillar: LifecyclePillar;
  division: LifecycleDivision;
  stage: LifecycleStage;
  status: string;
  priority: LifecyclePriority;
  lastActiveAt: string | null;
  lastEventAt: string | null;
  blockerReason: string | null;
  nextActionLabel: string | null;
  nextActionUrl: string | null;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown>;
};

export type LifecycleSnapshot = {
  userId: string;
  generatedAt: string;
  entries: LifecycleSnapshotEntry[];
  /** Derived continuation surface — the most relevant next actions for the user, ranked. */
  actionables: LifecycleActionable[];
  /** True if there is any lifecycle entry currently in a blocked state. */
  hasBlocker: boolean;
  /** True if any pillar shows dormancy/re-engagement candidacy. */
  hasReEngagement: boolean;
  /** ISO timestamp of the most recent cross-pillar activity we could observe. */
  overallLastActiveAt: string | null;
};

export const LIFECYCLE_PRIORITY_WEIGHT: Record<LifecyclePriority, number> = {
  critical: 100,
  high: 75,
  normal: 50,
  low: 25,
};

export const LIFECYCLE_STAGE_LABEL: Record<LifecycleStage, string> = {
  new: "New",
  onboarding: "Onboarding",
  browsing: "Browsing",
  evaluating: "Evaluating",
  started: "Started",
  awaiting_user: "Awaiting you",
  awaiting_business: "Awaiting HenryCo",
  blocked: "Blocked",
  in_progress: "In progress",
  completed: "Completed",
  retained: "Retained",
  dormant: "Dormant",
  reengagement_candidate: "Re-engagement candidate",
  churn_risk: "Churn risk",
};

export const LIFECYCLE_PILLAR_LABEL: Record<LifecyclePillar, string> = {
  identity: "Identity",
  trust: "Trust & Verification",
  wallet: "Wallet & Funding",
  support: "Support",
  marketplace: "Marketplace",
  care: "Care",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  property: "Property",
  studio: "Studio",
  subscriptions: "Subscriptions",
};

/** Which pillars require identity verification before high-value actions unlock. */
export const LIFECYCLE_TRUST_GATED_PILLARS: ReadonlySet<LifecyclePillar> = new Set([
  "marketplace",
  "jobs",
  "property",
  "wallet",
]);
