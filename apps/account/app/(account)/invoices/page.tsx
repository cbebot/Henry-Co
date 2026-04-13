import { Receipt } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getInvoices, getProfile } from "@/lib/account-data";
import { formatDate, divisionLabel, divisionColor } from "@/lib/format";
import {
  formatLedgerMinorAmount,
  resolveAccountLedgerCurrencyTruth,
} from "@/lib/currency-truth";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const statusChip: Record<string, string> = {
  paid: "acct-chip-green",
  pending: "acct-chip-orange",
  overdue: "acct-chip-red",
  draft: "acct-chip-blue",
  cancelled: "acct-chip-red",
  refunded: "acct-chip-purple",
};

export default async function InvoicesPage() {
  const user = await requireAccountUser();
  const [invoices, profile] = await Promise.all([
    getInvoices(user.id, 50),
    getProfile(user.id),
  ]);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Invoices & Receipts"
        description="Your payment history and downloadable receipts."
        icon={Receipt}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your invoices and receipts will appear here after making payments across HenryCo services."
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {invoices.map((invoice) => {
            const record = invoice as Record<string, unknown>;
            const truth = resolveAccountLedgerCurrencyTruth(record, {
              country: profile?.country as string | null | undefined,
              preferredCurrency: profile?.currency as string | null | undefined,
            });

            return (
              <div key={String(record.id || "")} className="flex items-center gap-4 px-5 py-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: divisionColor(String(record.division || "")) }}
                >
                  {divisionLabel(String(record.division || "")).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {String(record.description || `Invoice ${record.invoice_no || ""}`)}
                  </p>
                  <p className="text-xs text-[var(--acct-muted)]">
                    {String(record.invoice_no || "No number")} &middot;{" "}
                    {divisionLabel(String(record.division || ""))} &middot;{" "}
                    {formatDate(String(record.created_at || ""))}
                    {!truth.supportsNativeSettlement &&
                    truth.pricingCurrency !== truth.settlementCurrency
                      ? ` · settles in ${truth.settlementCurrency}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`acct-chip ${statusChip[String(record.status || "")] || "acct-chip-gold"}`}>
                    {String(record.status || "pending")}
                  </span>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {formatLedgerMinorAmount(Number(record.total_kobo || 0), truth)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
