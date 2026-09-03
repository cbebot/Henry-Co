import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * The server-derived seller tier (V3-58). Stored as an English enum; the visible
 * label is always a translated string the caller supplies (never hardcoded here).
 */
export type SellerTier = "none" | "bronze" | "silver" | "gold";

type SellerTierBadgeSize = "sm" | "md";

/**
 * Metallic tints, built ONLY from design-system scale utilities + `dark:`
 * variants (the same locked-token idiom as PublicBadge) — no ad-hoc hex. Fixed
 * height + `ring-inset` (not `border`) keep the box from ever reflowing → CLS ≈ 0.
 */
const TIER: Record<Exclude<SellerTier, "none">, string> = {
  bronze:
    "bg-amber-700/10 text-amber-800 ring-1 ring-inset ring-amber-700/25 dark:bg-amber-600/10 dark:text-amber-300/90 dark:ring-amber-600/30",
  silver:
    "bg-zinc-400/10 text-zinc-700 ring-1 ring-inset ring-zinc-400/35 dark:bg-zinc-300/10 dark:text-zinc-200 dark:ring-zinc-300/25",
  gold:
    "bg-amber-400/15 text-amber-800 ring-1 ring-inset ring-amber-500/30 dark:bg-amber-300/10 dark:text-amber-200 dark:ring-amber-300/30",
};

const SIZE: Record<SellerTierBadgeSize, string> = {
  sm: "h-[22px] px-2 text-[11px] tracking-[0.05em]",
  md: "h-[26px] px-2.5 text-xs tracking-[0.05em]",
};

function TierMedal() {
  // Calm inline medal glyph; inherits currentColor so it tracks the tier text.
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="6.2" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.4 9.4 4 14l4-2 4 2-1.4-4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * SellerTierBadge — the earned Bronze/Silver/Gold mark for a business, rendered on
 * the business profile and on marketplace listings/PDP.
 *
 * Honest-state rule (spec S3): a `none` (or unknown) tier renders NOTHING — never a
 * placeholder. `label` is the already-translated tier name; `tooltip` is the
 * already-translated explanation. The component owns no copy and no business logic.
 */
export function SellerTierBadge({
  tier,
  label,
  tooltip,
  size = "md",
  showIcon = true,
  className,
}: {
  tier: SellerTier | string | null | undefined;
  /** Translated tier name (e.g. getSellerAcademyCopy(locale).tierNames.gold). */
  label: string;
  /** Translated tooltip/aria explanation. */
  tooltip?: string;
  size?: SellerTierBadgeSize;
  showIcon?: boolean;
  className?: string;
}): ReactNode {
  if (tier !== "bronze" && tier !== "silver" && tier !== "gold") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        SIZE[size],
        TIER[tier],
        className,
      )}
      title={tooltip ?? label}
      aria-label={tooltip ? `${label} — ${tooltip}` : label}
    >
      {showIcon ? <TierMedal /> : null}
      {label}
    </span>
  );
}
