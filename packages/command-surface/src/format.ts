import type {
  AttentionPriority,
  AttentionStatus,
  AttentionType,
  Division,
} from "@henryco/command-contract";

/** Display names for the registry divisions (Henry Onyx voice). */
export const DIVISION_LABEL: Record<Division, string> = {
  hub: "Henry Onyx HQ",
  care: "Care",
  building: "Building & Interiors",
  hotel: "Rooms",
  marketplace: "Marketplace",
  property: "Property",
  logistics: "Logistics",
  studio: "Studio",
  jobs: "Jobs",
  learn: "Learn",
  system: "System",
};

/** The locked Henry Onyx division accent palette (from `--acct-div-*`). */
export const DIVISION_ACCENT: Record<Division, string> = {
  hub: "#c9a227",
  care: "#19b67e",
  building: "#a16207",
  hotel: "#0e9aa7",
  marketplace: "#e0851f",
  property: "#9b7bf0",
  logistics: "#1ba6c4",
  studio: "#c2722e",
  jobs: "#e0507e",
  learn: "#7c83f5",
  system: "#8a8175",
};

const TYPE_LABEL: Record<AttentionType, string> = {
  "seller-application": "Application",
  "kyc-review": "KYC review",
  "high-value-listing": "High-value",
  "flagged-transaction": "Flagged txn",
  "pending-payout": "Payout",
  "pending-payment": "Payment",
  "refund-request": "Refund / claim",
  dispute: "Dispute",
  "moderation-item": "Moderation",
  "booking-exception": "Exception",
  "support-escalation": "Escalation",
  "publish-review": "Publish review",
  "config-risk": "Config risk",
};

export const divisionLabel = (d: Division): string => DIVISION_LABEL[d];
export const divisionAccent = (d: Division): string => DIVISION_ACCENT[d];
export const typeLabel = (t: AttentionType): string => TYPE_LABEL[t];

export const PRIORITY_META: Record<
  AttentionPriority,
  { label: string; color: string; soft: string }
> = {
  critical: { label: "Critical", color: "var(--cc-critical)", soft: "var(--cc-critical-soft)" },
  high: { label: "High", color: "var(--cc-high)", soft: "var(--cc-high-soft)" },
  medium: { label: "Medium", color: "var(--cc-medium)", soft: "var(--cc-medium-soft)" },
  low: { label: "Low", color: "var(--cc-low)", soft: "var(--cc-low-soft)" },
};

export const STATUS_META: Record<AttentionStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "var(--cc-open)" },
  acknowledged: { label: "Acknowledged", color: "var(--cc-progress)" },
  in_progress: { label: "In progress", color: "var(--cc-progress)" },
  escalated: { label: "Escalated", color: "var(--cc-escalated)" },
  resolved: { label: "Resolved", color: "var(--cc-resolved)" },
  dismissed: { label: "Dismissed", color: "var(--cc-dismissed)" },
};

const MINOR_DECIMALS: Record<string, number> = {
  NGN: 2,
  USD: 2,
  GBP: 2,
  EUR: 2,
  KES: 2,
  GHS: 2,
  ZAR: 2,
};

/** Render minor-unit money as a localized currency string. */
export function formatMoney(amountMinor: number, currency: string): string {
  const decimals = MINOR_DECIMALS[currency] ?? 2;
  const major = amountMinor / 10 ** decimals;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: major >= 10000 ? 0 : decimals,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString("en-NG")}`;
  }
}

/**
 * A deterministic, SSR-safe clock label derived from the item's source UTC
 * time — no relative ("3m ago") math that would mismatch on hydration.
 */
export function clockLabel(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}
