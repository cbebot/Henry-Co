/**
 * Token schemes — the per-audience CSS variable names that severity-style
 * resolves to. Passed to `createSeverityResolver()` so the same logic
 * powers both customer and staff bells without baking app-specific token
 * names into the package.
 *
 * Each consumer (apps/account, the 9 staff workspace apps) defines its
 * own scheme that maps onto its already-shipped theme tokens. No app
 * needs to introduce new CSS variables to consume this package — the
 * scheme just points at what already exists.
 */

import type { Division, SignalSeverity } from "./types";

export type SeverityTokens = {
  /** Strong color (icon stroke, left border) per severity. */
  color: Record<SignalSeverity, string>;
  /** Soft tint (toast background) per severity. */
  soft: Record<SignalSeverity, string>;
  /** Per-division accent. Falls back to `system` when unknown. */
  division: Record<Division, string>;
  /** Default badge color when no severity dominates. */
  badge: string;
};

/**
 * Customer-facing scheme (apps/account). Maps onto the `--acct-*` tokens
 * shipped in apps/account/app/globals.css and theme files.
 */
export const ACCOUNT_NOTIFICATION_TOKENS: SeverityTokens = {
  color: {
    info: "--acct-sev-info",
    success: "--acct-sev-success",
    warning: "--acct-sev-warning",
    urgent: "--acct-sev-urgent",
    security: "--acct-sev-security",
  },
  soft: {
    info: "--acct-sev-info-soft",
    success: "--acct-sev-success-soft",
    warning: "--acct-sev-warning-soft",
    urgent: "--acct-sev-urgent-soft",
    security: "--acct-sev-security-soft",
  },
  division: {
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
  },
  badge: "--acct-gold",
};

/**
 * Staff-facing scheme — mounted on the 9 workspace apps (PR-β). Each
 * workspace already ships division-specific theme tokens; this scheme
 * normalizes them under a stable namespace so the bell looks identical
 * in care/workspace, marketplace/owner, etc., while still picking up the
 * host app's accent color via CSS cascade.
 */
export const STAFF_NOTIFICATION_TOKENS: SeverityTokens = {
  color: {
    info: "--staff-sev-info",
    success: "--staff-sev-success",
    warning: "--staff-sev-warning",
    urgent: "--staff-sev-urgent",
    security: "--staff-sev-security",
  },
  soft: {
    info: "--staff-sev-info-soft",
    success: "--staff-sev-success-soft",
    warning: "--staff-sev-warning-soft",
    urgent: "--staff-sev-urgent-soft",
    security: "--staff-sev-security-soft",
  },
  division: {
    hub: "--staff-div-hub",
    account: "--staff-div-account",
    staff: "--staff-div-staff",
    care: "--staff-div-care",
    marketplace: "--staff-div-marketplace",
    property: "--staff-div-property",
    logistics: "--staff-div-logistics",
    jobs: "--staff-div-jobs",
    learn: "--staff-div-learn",
    studio: "--staff-div-studio",
    security: "--staff-div-security",
    system: "--staff-div-system",
  },
  badge: "--staff-gold",
};
