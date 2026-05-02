/**
 * Severity + division presentation helpers shared by the bell, popover,
 * toast, inbox row, and recently-deleted page. Maps the publisher's typed
 * `Severity` enum onto (icon, color tokens, auto-dismiss policy) so each
 * surface stays in lockstep with the others.
 *
 * Audience-agnostic: the token names are passed in via `SeverityTokens`
 * (see tokens.ts) so the same logic powers customer + staff bells.
 *
 * The Severity enum lives in @henryco/notifications. We accept the
 * legacy freeform string priority too (incoming Realtime rows stamped
 * priority="high" / "critical" / "normal" before the matrix tightened)
 * and normalize down to the five-tier matrix.
 */

import type { ComponentType, SVGProps } from "react";
import {
  SeverityInfoIcon,
  SeveritySuccessIcon,
  SeveritySecurityIcon,
  SeverityUrgentIcon,
  SeverityWarningIcon,
} from "./icons";
import type { Division, SignalSeverity } from "./types";
import type { SeverityTokens } from "./tokens";

export type SeverityStyle = {
  severity: SignalSeverity;
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** CSS variable name for strong color (icon stroke, left border). */
  colorVar: string;
  /** CSS variable name for soft tint (toast background). */
  softVar: string;
  /** Aria-friendly short label. */
  label: string;
};

const SEVERITY_LABELS: Record<SignalSeverity, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  urgent: "Urgent",
  security: "Security",
};

const SEVERITY_ICONS: Record<
  SignalSeverity,
  ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
> = {
  info: SeverityInfoIcon,
  success: SeveritySuccessIcon,
  warning: SeverityWarningIcon,
  urgent: SeverityUrgentIcon,
  security: SeveritySecurityIcon,
};

const SEVERITY_RANK: Record<SignalSeverity, number> = {
  info: 1,
  success: 2,
  warning: 3,
  urgent: 4,
  security: 5,
};

function normalizeSeverity(
  priority: string | null | undefined,
  category: string | null | undefined,
): SignalSeverity {
  const value = String(priority || "").trim().toLowerCase();
  if (
    value === "info" ||
    value === "success" ||
    value === "warning" ||
    value === "urgent" ||
    value === "security"
  ) {
    return value;
  }
  if (value === "critical" || value === "high") return "urgent";
  if (value === "low") return "info";
  const cat = String(category || "").trim().toLowerCase();
  if (cat === "security") return "security";
  return "info";
}

export type SeverityResolver = {
  /** Resolve any priority/severity string + category to a SeverityStyle. */
  resolveSeverity: (
    priority: string | null | undefined,
    category?: string | null,
  ) => SeverityStyle;
  /** Auto-dismiss policy for toast (security never auto-dismisses). */
  autoDismissMs: (severity: SignalSeverity) => number | null;
  /** Severity-derived bell badge color when unread > 0. */
  badgeColorVar: (highest: SignalSeverity | null) => string;
  /** Pick the highest-priority severity from a notification list. */
  highestSeverity: (
    items: Array<{
      priority?: string | null;
      category?: string | null;
      is_read?: boolean;
    }>,
  ) => SignalSeverity | null;
  /** Resolve division accent CSS variable; unknown → system. */
  divisionAccentVar: (division: string | null | undefined) => string;
  /** The token scheme used by this resolver. Exposed for diagnostics. */
  tokens: SeverityTokens;
};

/**
 * Build a SeverityResolver that maps severities to the supplied token
 * scheme. Both customer and staff audiences pass their own scheme; the
 * call shape and return values are otherwise identical.
 */
export function createSeverityResolver(
  tokens: SeverityTokens,
): SeverityResolver {
  function buildStyle(severity: SignalSeverity): SeverityStyle {
    return {
      severity,
      Icon: SEVERITY_ICONS[severity],
      colorVar: tokens.color[severity],
      softVar: tokens.soft[severity],
      label: SEVERITY_LABELS[severity],
    };
  }

  return {
    resolveSeverity(priority, category) {
      return buildStyle(normalizeSeverity(priority, category));
    },
    autoDismissMs(severity) {
      if (severity === "security") return null;
      if (severity === "urgent") return 12_000;
      return 6_000;
    },
    badgeColorVar(highest) {
      if (!highest) return tokens.badge;
      if (highest === "urgent") return tokens.color.urgent;
      if (highest === "security") return tokens.color.security;
      if (highest === "warning") return tokens.color.warning;
      if (highest === "success") return tokens.color.success;
      return tokens.badge;
    },
    highestSeverity(items) {
      let best: SignalSeverity | null = null;
      let bestRank = 0;
      for (const item of items) {
        if (item.is_read) continue;
        const sev = normalizeSeverity(item.priority, item.category);
        const rank = SEVERITY_RANK[sev];
        if (rank > bestRank) {
          best = sev;
          bestRank = rank;
        }
      }
      return best;
    },
    divisionAccentVar(division) {
      const lowered = String(division || "").trim().toLowerCase();
      const divisionsMap = tokens.division as Record<string, string>;
      if (lowered in divisionsMap) {
        return divisionsMap[lowered];
      }
      return tokens.division.system;
    },
    tokens,
  };
}

export type { Division, SignalSeverity };
