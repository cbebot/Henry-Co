/**
 * V3 PASS 21 — Property inspection rules engine.
 *
 * The eligibility rules in
 * /docs/property-inspection-eligibility-rules.md describe when an
 * inspection must be required for a property listing. Until this pass,
 * those rules were spread across policy.ts as inline conditions.
 *
 * This module captures the same decisions as a small, deterministic,
 * data-driven engine. Rules can either live in code (the canonical
 * defaults in this file) OR in the `property_inspection_rules` table
 * (the migration seeds the canonical set, but moderation staff can edit
 * or add rows without a code deploy).
 *
 * Why both:
 *   - The canonical defaults survive a clean DB and a fresh local stack
 *     (so policy.ts can still call evaluateInspectionRules() on the
 *     submission path even when the DB rules table is empty).
 *   - The DB rules layer is the editorial control surface for staff —
 *     a moderator can raise the high_value_sale threshold without
 *     touching code.
 *
 * Evaluation contract:
 *   evaluateInspectionRules(input, rules?) returns a deterministic
 *   { requiresInspection, blocksPublication, matchedRules, reason }
 *   for the same input + same rule set.
 *
 * The PASS 21 P2 gate calls for ≥ 6 documented scenarios; the unit-test
 * exports below cover those scenarios via `evaluateInspectionRulesAgainstScenarios`.
 *
 * NO server-only marker on this file by design — the engine is pure
 * data + pure logic, so it can be used from server code, jest tests,
 * and (if needed) typed client validations.
 */

export type PropertyInspectionRuleCriteria = {
  service_type?: string[];
  intent?: string[];
  kind?: string[];
  min_price?: number;
  max_price?: number;
  min_risk_score?: number;
  max_risk_score?: number;
  requires_authority_proof?: boolean;
  requires_management_authorization?: boolean;
};

export type PropertyInspectionRule = {
  key: string;
  name: string;
  description: string;
  criteria: PropertyInspectionRuleCriteria;
  requireInspection: boolean;
  blockPublication: boolean;
  priority: number;
};

export type PropertyInspectionRuleInput = {
  serviceType: string;
  intent: string;
  kind: string;
  price: number;
  riskScore: number;
  requiresAuthorityProof: boolean;
  requiresManagementAuthorization: boolean;
};

export type PropertyInspectionRuleMatch = {
  rule: PropertyInspectionRule;
  matched: true;
  reason: string;
};

export type PropertyInspectionRuleDecision = {
  requiresInspection: boolean;
  blocksPublication: boolean;
  matchedRules: PropertyInspectionRuleMatch[];
  topRuleKey: string | null;
  reason: string;
};

/**
 * Canonical baseline rules. Mirrors the seed rows added by
 * `apps/property/supabase/migrations/20260515122500_property_inspection_rules.sql`.
 *
 * The engine reads from the DB rules table when present; this list is
 * the fallback so a fresh DB + empty seed still produces correct
 * behaviour from /api/property submission paths.
 */
export const PROPERTY_INSPECTION_RULES: PropertyInspectionRule[] = [
  {
    key: "rule.intent_inspection_request",
    name: "Owner explicitly requested inspection",
    description:
      "When the submission intent is `inspection_request` the rule fires unconditionally.",
    criteria: { intent: ["inspection_request"] },
    requireInspection: true,
    blockPublication: false,
    priority: 900,
  },
  {
    key: "rule.managed_property",
    name: "Managed-property always inspects",
    description:
      "Managed listings require a Henry Onyx agent on site before Henry Onyx accepts the operating handoff.",
    criteria: { service_type: ["managed_property"] },
    requireInspection: true,
    blockPublication: false,
    priority: 850,
  },
  {
    key: "rule.verified_property",
    name: "Verified-property listings require inspection",
    description:
      "Verified-property is a premium trust tier; Henry Onyx confirms in person before applying the badge.",
    criteria: { service_type: ["verified_property"] },
    requireInspection: true,
    blockPublication: false,
    priority: 800,
  },
  {
    key: "rule.land",
    name: "Land listings always inspect",
    description:
      "Land has unique fraud + boundary risk; site verification is non-negotiable.",
    criteria: { service_type: ["land"] },
    requireInspection: true,
    blockPublication: false,
    priority: 750,
  },
  {
    key: "rule.high_risk_score",
    name: "High risk score triggers inspection",
    description:
      "Listings with a policy risk score at or above 76 are routed through inspection.",
    criteria: { min_risk_score: 76 },
    requireInspection: true,
    blockPublication: false,
    priority: 600,
  },
  {
    key: "rule.high_value_sale",
    name: "High-value sale routes through inspection",
    description:
      "Sale listings priced at or above 50,000,000 NGN are routed through inspection.",
    criteria: {
      service_type: ["sale"],
      min_price: 50_000_000,
    },
    requireInspection: true,
    blockPublication: false,
    priority: 500,
  },
];

function arrayHas(values: string[] | undefined, candidate: string): boolean {
  if (!values || values.length === 0) return true;
  return values.includes(candidate);
}

function withinPriceWindow(
  criteria: PropertyInspectionRuleCriteria,
  price: number
): boolean {
  if (
    criteria.min_price !== undefined &&
    Number.isFinite(criteria.min_price) &&
    price < (criteria.min_price as number)
  ) {
    return false;
  }
  if (
    criteria.max_price !== undefined &&
    Number.isFinite(criteria.max_price) &&
    price > (criteria.max_price as number)
  ) {
    return false;
  }
  return true;
}

function withinRiskWindow(
  criteria: PropertyInspectionRuleCriteria,
  risk: number
): boolean {
  if (
    criteria.min_risk_score !== undefined &&
    Number.isFinite(criteria.min_risk_score) &&
    risk < (criteria.min_risk_score as number)
  ) {
    return false;
  }
  if (
    criteria.max_risk_score !== undefined &&
    Number.isFinite(criteria.max_risk_score) &&
    risk > (criteria.max_risk_score as number)
  ) {
    return false;
  }
  return true;
}

function ruleMatches(
  rule: PropertyInspectionRule,
  input: PropertyInspectionRuleInput
): boolean {
  const c = rule.criteria;

  if (!arrayHas(c.service_type, input.serviceType)) return false;
  if (!arrayHas(c.intent, input.intent)) return false;
  if (!arrayHas(c.kind, input.kind)) return false;
  if (!withinPriceWindow(c, input.price)) return false;
  if (!withinRiskWindow(c, input.riskScore)) return false;
  if (
    c.requires_authority_proof !== undefined &&
    c.requires_authority_proof !== input.requiresAuthorityProof
  ) {
    return false;
  }
  if (
    c.requires_management_authorization !== undefined &&
    c.requires_management_authorization !== input.requiresManagementAuthorization
  ) {
    return false;
  }

  return true;
}

export function evaluateInspectionRules(
  input: PropertyInspectionRuleInput,
  rules: PropertyInspectionRule[] = PROPERTY_INSPECTION_RULES
): PropertyInspectionRuleDecision {
  const matched = rules
    .filter((rule) => ruleMatches(rule, input))
    .sort((a, b) => b.priority - a.priority)
    .map<PropertyInspectionRuleMatch>((rule) => ({
      rule,
      matched: true,
      reason: rule.description,
    }));

  const requiresInspection = matched.some((m) => m.rule.requireInspection);
  const blocksPublication = matched.some((m) => m.rule.blockPublication);

  const topMatch = matched[0] ?? null;
  const topRuleKey = topMatch ? topMatch.rule.key : null;

  const reason = topMatch
    ? `${topMatch.rule.name}: ${topMatch.rule.description}`
    : "No documented inspection rule matched this submission.";

  return {
    requiresInspection,
    blocksPublication,
    matchedRules: matched,
    topRuleKey,
    reason,
  };
}

/**
 * The six documented inspection scenarios (P2 gate). Each scenario
 * pins a deterministic expected decision so a regression in rule
 * priority or evaluation order is caught by the property type-check
 * suite.
 */
export const PROPERTY_INSPECTION_SCENARIOS: Array<{
  name: string;
  input: PropertyInspectionRuleInput;
  expected: {
    requiresInspection: boolean;
    topRuleKey: string | null;
  };
}> = [
  {
    name: "Inspection request intent",
    input: {
      serviceType: "rent",
      intent: "inspection_request",
      kind: "rent",
      price: 1_500_000,
      riskScore: 40,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.intent_inspection_request",
    },
  },
  {
    name: "Managed property service",
    input: {
      serviceType: "managed_property",
      intent: "managed_property",
      kind: "managed",
      price: 3_000_000,
      riskScore: 45,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: true,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.managed_property",
    },
  },
  {
    name: "Verified property service",
    input: {
      serviceType: "verified_property",
      intent: "verified_property",
      kind: "rent",
      price: 4_000_000,
      riskScore: 50,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.verified_property",
    },
  },
  {
    name: "Land listing",
    input: {
      serviceType: "land",
      intent: "owner_listed",
      kind: "land",
      price: 12_000_000,
      riskScore: 60,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.land",
    },
  },
  {
    name: "High-risk rental",
    input: {
      serviceType: "rent",
      intent: "owner_listed",
      kind: "rent",
      price: 800_000,
      riskScore: 80,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.high_risk_score",
    },
  },
  {
    name: "High-value sale",
    input: {
      serviceType: "sale",
      intent: "owner_listed",
      kind: "sale",
      price: 75_000_000,
      riskScore: 55,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: true,
      topRuleKey: "rule.high_value_sale",
    },
  },
  {
    name: "Low-risk rent — no inspection required",
    input: {
      serviceType: "rent",
      intent: "owner_listed",
      kind: "rent",
      price: 800_000,
      riskScore: 40,
      requiresAuthorityProof: false,
      requiresManagementAuthorization: false,
    },
    expected: {
      requiresInspection: false,
      topRuleKey: null,
    },
  },
];

/** P2 gate: deterministic regression check. Used by typecheck-friendly
 * smoke tests. Returns the failing scenarios (empty array == pass). */
export function evaluateInspectionRulesAgainstScenarios(
  rules: PropertyInspectionRule[] = PROPERTY_INSPECTION_RULES
): Array<{
  scenario: string;
  expected: { requiresInspection: boolean; topRuleKey: string | null };
  actual: { requiresInspection: boolean; topRuleKey: string | null };
}> {
  const failures: ReturnType<typeof evaluateInspectionRulesAgainstScenarios> = [];
  for (const scenario of PROPERTY_INSPECTION_SCENARIOS) {
    const decision = evaluateInspectionRules(scenario.input, rules);
    if (
      decision.requiresInspection !== scenario.expected.requiresInspection ||
      decision.topRuleKey !== scenario.expected.topRuleKey
    ) {
      failures.push({
        scenario: scenario.name,
        expected: scenario.expected,
        actual: {
          requiresInspection: decision.requiresInspection,
          topRuleKey: decision.topRuleKey,
        },
      });
    }
  }
  return failures;
}
