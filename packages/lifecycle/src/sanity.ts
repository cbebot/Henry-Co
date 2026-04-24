import {
  LIFECYCLE_PILLARS,
  LIFECYCLE_STAGES,
  LIFECYCLE_PRIORITIES,
  LIFECYCLE_STAGE_LABEL,
  LIFECYCLE_PILLAR_LABEL,
  LIFECYCLE_PRIORITY_WEIGHT,
  LIFECYCLE_TRUST_GATED_PILLARS,
} from "./types";
import {
  derivePriority,
  deriveWaitStage,
  isAwaitingUserStalled,
  isAwaitingBusinessStalled,
  isChurnRisk,
  isDormantSignal,
  isReEngagementCandidate,
  LIFECYCLE_CHURN_RISK_DAYS,
  LIFECYCLE_DORMANCY_DAYS,
  LIFECYCLE_REENGAGEMENT_DAYS,
} from "./rules";
import { rankActionables } from "./selectors";
import type { LifecycleActionable } from "./types";

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function check(name: string, condition: boolean, detail?: string) {
  checks.push({ name, pass: Boolean(condition), detail });
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

check("stages has exactly 14 canonical entries", LIFECYCLE_STAGES.length === 14);
check("pillars has at least 12 canonical entries", LIFECYCLE_PILLARS.length >= 12);
check("priorities has exactly 4 canonical entries", LIFECYCLE_PRIORITIES.length === 4);

for (const stage of LIFECYCLE_STAGES) {
  check(`stage ${stage} has a human label`, Boolean(LIFECYCLE_STAGE_LABEL[stage]));
}
for (const pillar of LIFECYCLE_PILLARS) {
  check(`pillar ${pillar} has a human label`, Boolean(LIFECYCLE_PILLAR_LABEL[pillar]));
}
for (const priority of LIFECYCLE_PRIORITIES) {
  check(
    `priority ${priority} has a numeric weight`,
    typeof LIFECYCLE_PRIORITY_WEIGHT[priority] === "number"
  );
}

check(
  "critical outranks high outranks normal outranks low",
  LIFECYCLE_PRIORITY_WEIGHT.critical > LIFECYCLE_PRIORITY_WEIGHT.high &&
    LIFECYCLE_PRIORITY_WEIGHT.high > LIFECYCLE_PRIORITY_WEIGHT.normal &&
    LIFECYCLE_PRIORITY_WEIGHT.normal > LIFECYCLE_PRIORITY_WEIGHT.low
);

check(
  "trust-gated pillars include marketplace, jobs, property, wallet",
  LIFECYCLE_TRUST_GATED_PILLARS.has("marketplace") &&
    LIFECYCLE_TRUST_GATED_PILLARS.has("jobs") &&
    LIFECYCLE_TRUST_GATED_PILLARS.has("property") &&
    LIFECYCLE_TRUST_GATED_PILLARS.has("wallet")
);

check(
  "dormancy days > re-engagement days",
  LIFECYCLE_DORMANCY_DAYS > LIFECYCLE_REENGAGEMENT_DAYS
);
check(
  "churn risk days >= dormancy days",
  LIFECYCLE_CHURN_RISK_DAYS >= LIFECYCLE_DORMANCY_DAYS
);

check(
  "dormant detected after threshold",
  isDormantSignal(daysAgo(LIFECYCLE_DORMANCY_DAYS + 1))
);
check(
  "re-engagement candidate between thresholds",
  isReEngagementCandidate(
    daysAgo(LIFECYCLE_REENGAGEMENT_DAYS + 1)
  ) &&
    !isDormantSignal(daysAgo(LIFECYCLE_REENGAGEMENT_DAYS + 1))
);
check("no dormancy for recent activity", !isDormantSignal(daysAgo(1)));
check("churn risk at boundary", isChurnRisk(daysAgo(LIFECYCLE_CHURN_RISK_DAYS + 1)));

check(
  "awaiting-user stall after 72h",
  isAwaitingUserStalled(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString())
);
check(
  "awaiting-business stall after 48h",
  isAwaitingBusinessStalled(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
);

check(
  "deriveWaitStage: hard blocker always wins",
  deriveWaitStage({
    hasHardBlocker: true,
    hasPendingBusinessReview: true,
    hasUnresolvedAction: true,
    lastActivityAt: new Date().toISOString(),
  }) === "blocked"
);
check(
  "deriveWaitStage: business review before user action",
  deriveWaitStage({
    hasHardBlocker: false,
    hasPendingBusinessReview: true,
    hasUnresolvedAction: true,
    lastActivityAt: new Date().toISOString(),
  }) === "awaiting_business"
);
check(
  "deriveWaitStage: user action next",
  deriveWaitStage({
    hasHardBlocker: false,
    hasPendingBusinessReview: false,
    hasUnresolvedAction: true,
    lastActivityAt: new Date().toISOString(),
  }) === "awaiting_user"
);
check(
  "deriveWaitStage: dormant on stale quiet",
  deriveWaitStage({
    hasHardBlocker: false,
    hasPendingBusinessReview: false,
    hasUnresolvedAction: false,
    lastActivityAt: daysAgo(LIFECYCLE_DORMANCY_DAYS + 1),
  }) === "dormant"
);

check(
  "derivePriority: blocked => critical",
  derivePriority({ stage: "blocked" }) === "critical"
);
check(
  "derivePriority: awaiting_user stalled => high",
  derivePriority({ stage: "awaiting_user", stalled: true }) === "high"
);
check(
  "derivePriority: dormant => low unless escalated",
  derivePriority({ stage: "dormant" }) === "low"
);

const rankInput: LifecycleActionable[] = [
  {
    pillar: "jobs",
    division: "jobs",
    stage: "in_progress",
    priority: "normal",
    title: "Continue application",
    detail: "",
    actionUrl: "/jobs",
    actionLabel: "Open",
    blockerReason: null,
    lastActiveAt: daysAgo(1),
    referenceId: null,
    referenceType: null,
  },
  {
    pillar: "trust",
    division: "account",
    stage: "blocked",
    priority: "critical",
    title: "Complete verification",
    detail: "",
    actionUrl: "/verification",
    actionLabel: "Open",
    blockerReason: "identity",
    lastActiveAt: daysAgo(2),
    referenceId: null,
    referenceType: null,
  },
  {
    pillar: "marketplace",
    division: "marketplace",
    stage: "awaiting_user",
    priority: "high",
    title: "Confirm order",
    detail: "",
    actionUrl: "/marketplace",
    actionLabel: "Open",
    blockerReason: null,
    lastActiveAt: daysAgo(3),
    referenceId: null,
    referenceType: null,
  },
];

const ranked = rankActionables(rankInput);
check(
  "rankActionables: blocked is first",
  ranked[0]?.stage === "blocked" && ranked[0]?.priority === "critical"
);
check(
  "rankActionables: awaiting_user beats in_progress",
  (ranked.findIndex((item) => item.stage === "awaiting_user") ?? 99) <
    (ranked.findIndex((item) => item.stage === "in_progress") ?? -1)
);

const failures = checks.filter((c) => !c.pass);
if (failures.length > 0) {
  for (const failure of failures) {
    // eslint-disable-next-line no-console
    console.error(`FAIL: ${failure.name}`, failure.detail ?? "");
  }
  // eslint-disable-next-line no-console
  console.error(`\n${failures.length}/${checks.length} lifecycle sanity checks failed.`);
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log(`OK: ${checks.length}/${checks.length} lifecycle sanity checks passed.`);
}
