export type InvoiceRow = {
  id: string;
  invoice_no: string | null;
  description: string | null;
  division: string | null;
  status: string;
  total_kobo: number;
  created_at: string;
};

export type InvoiceChipTone = "good" | "warn" | "risk" | "info" | "muted" | "neutral";

const TONE_BY_STATUS: Record<string, InvoiceChipTone> = {
  paid: "good",
  pending: "warn",
  overdue: "risk",
  draft: "info",
  cancelled: "neutral",
  refunded: "muted",
};

export function invoiceTone(status: string | null | undefined): InvoiceChipTone {
  const k = String(status ?? "").trim().toLowerCase();
  return TONE_BY_STATUS[k] ?? "neutral";
}

const DIVISION_PALETTE: Record<string, { color: string; label: string }> = {
  account:     { color: "#C9A227", label: "Account" },
  wallet:      { color: "#C9A227", label: "Wallet" },
  marketplace: { color: "#3B82F6", label: "Marketplace" },
  studio:      { color: "#C9A227", label: "Studio" },
  jobs:        { color: "#8B5CF6", label: "Jobs" },
  learn:       { color: "#0EA5E9", label: "Learn" },
  property:    { color: "#6366F1", label: "Property" },
  logistics:   { color: "#D06F32", label: "Logistics" },
  care:        { color: "#10B981", label: "Care" },
};

export function divisionForKey(key: string | null | undefined) {
  if (!key) return { color: "#6B6560", label: "Account" };
  return DIVISION_PALETTE[key] ?? { color: "#6B6560", label: key };
}

export function formatKoboMajor(amountKobo: number | null | undefined): string {
  const n = Number(amountKobo) || 0;
  const naira = n / 100;
  return naira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatKoboCompact(amountKobo: number | null | undefined): string {
  const n = Number(amountKobo) || 0;
  const naira = n / 100;
  if (naira >= 1_000_000)
    return `${(naira / 1_000_000).toFixed(naira >= 10_000_000 ? 0 : 1)}m`;
  if (naira >= 1_000) return `${(naira / 1_000).toFixed(naira >= 10_000 ? 0 : 1)}k`;
  return naira.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

/** Aggregate roll-ups used by the hero. Calls `Date.now()` inside this
 * `.ts` helper to keep `.tsx` components clean under React 19's
 * `react-hooks/purity` rule. */
export function invoiceStats(invoices: ReadonlyArray<InvoiceRow>) {
  const now = Date.now();
  const thisMonth = new Date(now);
  const monthKey = `${thisMonth.getUTCFullYear()}-${(thisMonth.getUTCMonth() + 1).toString().padStart(2, "0")}`;
  let totalPaid = 0;
  let thisMonthPaid = 0;
  let outstanding = 0;
  const statusCounts = new Map<string, number>();
  const divisionCounts = new Map<string, number>();
  for (const inv of invoices) {
    const status = String(inv.status || "").toLowerCase();
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    if (inv.division) {
      divisionCounts.set(inv.division, (divisionCounts.get(inv.division) ?? 0) + 1);
    }
    const total = Number(inv.total_kobo) || 0;
    if (status === "paid") {
      totalPaid += total;
      const ms = Date.parse(String(inv.created_at ?? ""));
      if (Number.isFinite(ms)) {
        const d = new Date(ms);
        const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}`;
        if (key === monthKey) thisMonthPaid += total;
      }
    } else if (status === "pending" || status === "overdue") {
      outstanding += total;
    }
  }
  const divisionRows = Array.from(divisionCounts.entries())
    .map(([key, count]) => {
      const palette = divisionForKey(key);
      return { key, label: palette.label, color: palette.color, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    totalPaidKobo: totalPaid,
    thisMonthPaidKobo: thisMonthPaid,
    outstandingKobo: outstanding,
    paidCount: statusCounts.get("paid") ?? 0,
    pendingCount: statusCounts.get("pending") ?? 0,
    overdueCount: statusCounts.get("overdue") ?? 0,
    refundedCount: statusCounts.get("refunded") ?? 0,
    totalCount: invoices.length,
    divisions: divisionRows,
  };
}
