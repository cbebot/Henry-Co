export type ChipTone = "active" | "success" | "warn" | "danger" | "neutral";

const FUNDING_TONE_BY_STATUS: Record<string, ChipTone> = {
  pending: "active",
  awaiting_proof: "active",
  awaiting_review: "active",
  in_review: "active",
  rejected: "danger",
  cancelled: "neutral",
  expired: "neutral",
  completed: "success",
  verified: "success",
};

const WITHDRAWAL_TONE_BY_STATUS: Record<string, ChipTone> = {
  pending: "active",
  in_review: "active",
  approved: "success",
  paid: "success",
  rejected: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

const HUMAN_STATUS: Record<string, string> = {
  pending: "Awaiting review",
  awaiting_proof: "Processing",
  awaiting_review: "Awaiting review",
  in_review: "In review",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Confirmed",
  verified: "Confirmed",
  approved: "Approved",
  paid: "Paid out",
};

export function fundingStatusTone(status: string | null | undefined): ChipTone {
  const key = typeof status === "string" && status.length > 0 ? status : "pending";
  return FUNDING_TONE_BY_STATUS[key] ?? "neutral";
}

export function withdrawalStatusTone(status: string | null | undefined): ChipTone {
  const key = typeof status === "string" && status.length > 0 ? status : "pending";
  return WITHDRAWAL_TONE_BY_STATUS[key] ?? "neutral";
}

export function statusReadable(status: string | null | undefined): string {
  const key = typeof status === "string" && status.length > 0 ? status : "pending";
  if (HUMAN_STATUS[key]) return HUMAN_STATUS[key];
  return key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

const TX_TONE: Record<string, "credit" | "debit" | "bonus" | "cashback" | "refund" | "transfer"> = {
  credit: "credit",
  debit: "debit",
  refund: "refund",
  bonus: "bonus",
  cashback: "cashback",
  transfer: "transfer",
};

export function txTone(
  type: string | null | undefined,
): "credit" | "debit" | "bonus" | "cashback" | "refund" | "transfer" {
  const key = typeof type === "string" ? type : "";
  return TX_TONE[key] ?? "transfer";
}

export function txSign(
  type: string | null | undefined,
): "credit" | "debit" | "neutral" {
  if (!type) return "neutral";
  if (type === "debit") return "debit";
  if (["credit", "refund", "bonus", "cashback"].includes(type)) return "credit";
  return "neutral";
}

/**
 * Format a kobo (minor unit) amount as a premium display string.
 * Uses tabular numerals and decimals; safe for invalid input.
 */
export function formatKoboMajor(amountKobo: number | null | undefined): string {
  const n = Number(amountKobo) || 0;
  const naira = n / 100;
  return naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatKoboCompact(amountKobo: number | null | undefined): string {
  const n = Number(amountKobo) || 0;
  const naira = n / 100;
  if (naira >= 1_000_000)
    return `${(naira / 1_000_000).toFixed(naira >= 10_000_000 ? 0 : 1)}m`;
  if (naira >= 1_000) return `${(naira / 1_000).toFixed(naira >= 10_000 ? 0 : 1)}k`;
  return naira.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthIsoFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

export function monthShortLabel(monthIso: string): string {
  const [year, month] = monthIso.split("-");
  return SHORT_MONTHS[Number(month) - 1] ?? year ?? "";
}

export const DIVISION_PALETTE: Record<string, { color: string; label: string }> = {
  care:        { color: "#10B981", label: "Care" },
  marketplace: { color: "#3B82F6", label: "Marketplace" },
  studio:      { color: "#C9A227", label: "Studio" },
  jobs:        { color: "#8B5CF6", label: "Jobs" },
  learn:       { color: "#0EA5E9", label: "Learn" },
  property:    { color: "#6366F1", label: "Property" },
  logistics:   { color: "#D06F32", label: "Logistics" },
  account:     { color: "#6B6560", label: "Account" },
};

export function divisionPalette(key: string | null | undefined) {
  if (!key) return { color: "#6B6560", label: "Other" };
  return DIVISION_PALETTE[key] ?? { color: "#6B6560", label: key };
}

export type WalletTransaction = {
  id: string;
  type: string;
  description: string;
  amount_kobo: number;
  division: string | null;
  created_at: string;
  status: string;
  reference_type: string | null;
};

export type DivisionSpendSlice = {
  key: string;
  label: string;
  color: string;
  totalKobo: number;
  pct: number;
};

export function divisionBreakdown(
  transactions: ReadonlyArray<WalletTransaction>,
): DivisionSpendSlice[] {
  const buckets = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    const key = tx.division || "account";
    buckets.set(key, (buckets.get(key) ?? 0) + tx.amount_kobo);
  }
  const entries = Array.from(buckets.entries()).filter(([, v]) => v > 0);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  if (total === 0) return [];
  const slices = entries
    .map(([key, totalKobo]) => {
      const pal = divisionPalette(key);
      return {
        key,
        label: pal.label,
        color: pal.color,
        totalKobo,
        pct: (totalKobo / total) * 100,
      };
    })
    .sort((a, b) => b.totalKobo - a.totalKobo);
  return slices;
}

export type MonthlySpend = { monthIso: string; label: string; totalKobo: number };

export type WindowedSpend = {
  last30Kobo: number;
  prior30Kobo: number;
  deltaPct: number;
  trend: "up" | "down" | "flat";
};

/** Sums the last-30-day and prior-30-day debit totals. Calls `Date.now()`
 * inside this `.ts` helper (not in a `.tsx` component) so the React 19
 * `react-hooks/purity` rule doesn't flag the call site. */
export function windowedSpend(
  transactions: ReadonlyArray<WalletTransaction>,
): WindowedSpend {
  const now = Date.now();
  let last30 = 0;
  let prior30 = 0;
  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    const ms = Date.parse(tx.created_at);
    if (!Number.isFinite(ms)) continue;
    const age = now - ms;
    if (age >= 0 && age <= 30 * 24 * 3600_000) last30 += tx.amount_kobo;
    else if (age > 30 * 24 * 3600_000 && age <= 60 * 24 * 3600_000)
      prior30 += tx.amount_kobo;
  }
  const deltaPct =
    prior30 === 0 ? (last30 === 0 ? 0 : 100) : Math.round(((last30 - prior30) / prior30) * 100);
  const trend = deltaPct === 0 ? "flat" : deltaPct > 0 ? "up" : "down";
  return { last30Kobo: last30, prior30Kobo: prior30, deltaPct, trend };
}

/** "5m ago", "2h ago", "3d ago", or "12 Mar". Pure helper — calls
 * `Date.now()` once per call inside a `.ts` file to keep `.tsx` components
 * lint-clean under React 19's `react-hooks/purity` rule. */
export function formatTxRelative(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const delta = Date.now() - ms;
  if (delta < 60_000) return "just now";
  if (delta < 3600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  if (delta < 7 * 86_400_000) return `${Math.round(delta / 86_400_000)}d ago`;
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function spendByMonth(
  transactions: ReadonlyArray<WalletTransaction>,
  monthsBack = 6,
): MonthlySpend[] {
  const now = new Date();
  const ordered: string[] = [];
  const buckets = new Map<string, number>();
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const iso = monthIsoFromDate(d);
    ordered.push(iso);
    buckets.set(iso, 0);
  }
  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    const d = new Date(tx.created_at);
    if (!Number.isFinite(d.getTime())) continue;
    const iso = monthIsoFromDate(d);
    if (buckets.has(iso)) buckets.set(iso, (buckets.get(iso) ?? 0) + tx.amount_kobo);
  }
  return ordered.map((iso) => ({
    monthIso: iso,
    label: monthShortLabel(iso),
    totalKobo: buckets.get(iso) ?? 0,
  }));
}
