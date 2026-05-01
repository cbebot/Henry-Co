/**
 * Severity + division presentation helpers shared by the bell, popover,
 * toast, and inbox row. Maps the publisher's typed `Severity` enum onto
 * (icon, color tokens, auto-dismiss policy) so each surface stays in
 * lockstep with the others.
 *
 * The Severity enum lives in @henryco/notifications. We accept the
 * legacy freeform string priority too (incoming Realtime rows stamp
 * priority="high" / "critical" / "normal") and normalize down to the
 * five-tier matrix.
 */

import type { ComponentType, SVGProps } from "react";
import {
  SeverityInfoIcon,
  SeveritySuccessIcon,
  SeveritySecurityIcon,
  SeverityUrgentIcon,
  SeverityWarningIcon,
} from "./icons/HenryCoIcons";

export type SignalSeverity = "info" | "success" | "warning" | "urgent" | "security";

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

const REGISTRY: Record<SignalSeverity, SeverityStyle> = {
  info: {
    severity: "info",
    Icon: SeverityInfoIcon,
    colorVar: "--acct-sev-info",
    softVar: "--acct-sev-info-soft",
    label: "Info",
  },
  success: {
    severity: "success",
    Icon: SeveritySuccessIcon,
    colorVar: "--acct-sev-success",
    softVar: "--acct-sev-success-soft",
    label: "Success",
  },
  warning: {
    severity: "warning",
    Icon: SeverityWarningIcon,
    colorVar: "--acct-sev-warning",
    softVar: "--acct-sev-warning-soft",
    label: "Warning",
  },
  urgent: {
    severity: "urgent",
    Icon: SeverityUrgentIcon,
    colorVar: "--acct-sev-urgent",
    softVar: "--acct-sev-urgent-soft",
    label: "Urgent",
  },
  security: {
    severity: "security",
    Icon: SeveritySecurityIcon,
    colorVar: "--acct-sev-security",
    softVar: "--acct-sev-security-soft",
    label: "Security",
  },
};

/**
 * Resolve any priority/severity string to the five-tier matrix.
 * Unknown values fall back to "info" — same default as the publisher.
 */
export function resolveSeverity(
  priority: string | null | undefined,
  category?: string | null,
): SeverityStyle {
  const value = String(priority || "").trim().toLowerCase();
  if (value === "info" || value === "success" || value === "warning" || value === "urgent" || value === "security") {
    return REGISTRY[value as SignalSeverity];
  }
  // Legacy mapping (priority field used freeform strings before B-followup).
  if (value === "critical" || value === "high") return REGISTRY.urgent;
  if (value === "low") return REGISTRY.info;
  // Category-driven fallback for security signals where priority was empty.
  const cat = String(category || "").trim().toLowerCase();
  if (cat === "security") return REGISTRY.security;
  return REGISTRY.info;
}

/**
 * Auto-dismiss policy for toast.
 * - info / success / warning: 6 s
 * - urgent: 12 s (still auto-dismisses, but lingers)
 * - security: NEVER (user must explicitly dismiss)
 */
export function autoDismissMs(severity: SignalSeverity): number | null {
  if (severity === "security") return null;
  if (severity === "urgent") return 12_000;
  return 6_000;
}

/** Severity-derived bell badge color when unread > 0. */
export function badgeColorVar(highest: SignalSeverity | null): string {
  if (!highest) return "--acct-gold";
  if (highest === "urgent") return "--acct-sev-urgent";
  if (highest === "security") return "--acct-sev-security";
  if (highest === "warning") return "--acct-sev-warning";
  if (highest === "success") return "--acct-sev-success";
  return "--acct-gold";
}

/** Pick the highest-priority severity from a notification list. */
const SEVERITY_RANK: Record<SignalSeverity, number> = {
  info: 1,
  success: 2,
  warning: 3,
  urgent: 4,
  security: 5,
};
export function highestSeverity(
  items: Array<{ priority?: string | null; category?: string | null; is_read?: boolean }>,
): SignalSeverity | null {
  let best: SeverityStyle | null = null;
  for (const item of items) {
    if (item.is_read) continue;
    const style = resolveSeverity(item.priority, item.category);
    if (!best || SEVERITY_RANK[style.severity] > SEVERITY_RANK[best.severity]) {
      best = style;
    }
  }
  return best?.severity ?? null;
}

/* ─── Division accent ────────────────────────────────────────────── */

export type Division =
  | "hub"
  | "account"
  | "staff"
  | "care"
  | "marketplace"
  | "property"
  | "logistics"
  | "jobs"
  | "learn"
  | "studio"
  | "security"
  | "system";

const DIVISION_VAR: Record<Division, string> = {
  hub: "--acct-div-hub",
  account: "--acct-div-account",
  staff: "--acct-div-staff",
  care: "--acct-div-care",
  marketplace: "--acct-div-marketplace",
  property: "--acct-div-property",
  logistics: "--acct-div-logistics",
  jobs: "--acct-div-jobs",
  learn: "--acct-div-learn",
  studio: "--acct-div-studio",
  security: "--acct-div-security",
  system: "--acct-div-system",
};

export function divisionAccentVar(division: string | null | undefined): string {
  const lowered = String(division || "").trim().toLowerCase();
  if (lowered in DIVISION_VAR) return DIVISION_VAR[lowered as Division];
  return "--acct-div-system";
}

/* ─── Deep-link guard ────────────────────────────────────────────── */

/**
 * Same-origin OR a HenryCo TLD. Mirrors packages/notifications's
 * isSafeHenryCoUrl but operates client-side without pulling the server-
 * only publisher dep. Reject everything else — javascript:, data:,
 * //evil.com, https://evil.com.
 */
const HENRYCO_HOST_SUFFIXES = ["henrycogroup.com", "henryco.local"];
export function isSafeNotificationDeepLink(value: string | null | undefined): boolean {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;
  if (trimmed.length > 1024) return false;
  // Relative paths starting with a single '/' (not '//') and no backslash, no HTML.
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return false;
    if (trimmed.includes("\\")) return false;
    if (trimmed.includes("<") || trimmed.includes(">") || trimmed.includes('"')) return false;
    return true;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  for (const suffix of HENRYCO_HOST_SUFFIXES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return true;
  }
  return false;
}
