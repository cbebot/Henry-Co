/**
 * V3-38 — availability badge (S4). Presentational and copy-blind: the host
 * resolves the localized label (Pattern A typed copy via `@henryco/i18n`
 * `getAvailabilityCopy`) and the availability status server- or client-side,
 * then hands both down. Renders ONLY for `available` / `limited` — `unknown`
 * renders nothing (fail-safe honesty: no data must never read as "not here"),
 * and `unavailable` is owned by `UnavailableState`.
 *
 * Token-only: structural classes here; every colour arrives via the host's
 * `className` (each division passes its own proven AA token combo). When the
 * location was IP-inferred the host passes `disclosure` — rendered for screen
 * readers so the approximate-location caveat always ships with the claim.
 */

import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type AvailabilityBadgeStatus = "available" | "limited" | "unavailable" | "unknown";

export interface AvailabilityBadgeProps {
  status: AvailabilityBadgeStatus;
  /** Localized badge label, resolved by the host (never hardcoded here). */
  label: string;
  /** Localized approximate-location disclosure (sr-only), when IP-inferred. */
  disclosure?: string;
  /** Optional leading icon node (the host owns its icon set). */
  icon?: ReactNode;
  className?: string;
}

export function AvailabilityBadge({
  status,
  label,
  disclosure,
  icon,
  className,
}: AvailabilityBadgeProps) {
  if (status !== "available" && status !== "limited") return null;
  return (
    <span
      data-availability={status}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}
    >
      {icon}
      {label}
      {disclosure ? <span className="sr-only"> {disclosure}</span> : null}
    </span>
  );
}
