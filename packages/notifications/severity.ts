/**
 * Severity normalization helper for cross-division bridges.
 *
 * Bridges accept freeform legacy `priority` strings ("normal", "high",
 * "urgent", "critical", "warning", "success", "security") from existing
 * callers and need to map them onto the typed Severity enum that the
 * publisher shim consumes. Unknown values fall back to "info" so strict
 * publishes never silently degrade to a misleading severity.
 *
 * Extracted from 7 duplicated copies across apps (account/care-sync,
 * studio/shared-account, property/shared-account, marketplace/projections,
 * logistics/shared-account, learn/shared-account, account/api/webhooks).
 */

import type { Severity } from "./types";

export function severityFromPriority(priority: string | null | undefined): Severity {
  const value = String(priority || "").trim().toLowerCase();
  if (value === "high" || value === "urgent" || value === "critical") return "urgent";
  if (value === "warning") return "warning";
  if (value === "success") return "success";
  if (value === "security") return "security";
  return "info";
}
