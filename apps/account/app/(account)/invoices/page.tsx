import { Receipt } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getInvoices, getProfile } from "@/lib/account-data";
import {
  buildCurrencyTruthMessage,
  formatPricingAmount,
  resolveAccountCurrencyTruth,
} from "@/lib/currency-truth";
import { formatDate, divisionLabel, divisionColor } from "@/lib/format";
import { resolveAccountRegionalContext } from "@/lib/regional-context";
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
  const region = resolveAccountRegionalContext({
    country: profile?.country as string | null | undefined,
    currency: profile?.currency as string | null | undefined,
    timezone: profile?.timezone as string | null | undefined,
    language: profile?.language as string | null | undefined,
  });

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Invoices & Receipts"
        description="Your payment history and downloadable receipts."
        icon={Receipt}
      />

      <section className="acct-card p-5">
        <p className="acct-kicker">Currency context</p>
        <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
          Invoices show the original pricing currency published by each division. Shared account display preference is {region.currencyCode}, but settlement remains NGN-first wherever a division has not published another live rail.
        </p>
      </section>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your invoices and receipts will appear here after making payments across HenryCo services."
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {invoices.map((inv: Record<string, string | number>) => {
            const truth = resolveAccountCurrencyTruth(region, {
              pricingCurrency: String(inv.pricing_currency || inv.currency || "NGN"),
              settlementCurrency: String(inv.settlement_currency || "NGN"),
              baseCurrency: String(inv.base_currency || "NGN"),
              exchangeRateSource:
                typeof inv.exchange_rate_source === "string" ? inv.exchange_rate_source : null,
              exchangeRateTimestamp:
                typeof inv.exchange_rate_timestamp === "string"
                  ? inv.exchange_rate_timestamp
                  : null,
            });

            return (
            <div key={inv.id as string} className="flex items-center gap-4 px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: divisionColor(inv.division as string) }}
              >
                {divisionLabel(inv.division as string).charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {inv.description || `Invoice ${inv.invoice_no}`}
                </p>
                <p className="text-xs text-[var(--acct-muted)]">
                  {inv.invoice_no} &middot; {divisionLabel(inv.division as string)} &middot;{" "}
                  {formatDate(inv.created_at as string)}
                </p>
                <p className="mt-1 text-[0.7rem] leading-5 text-[var(--acct-muted)]">
                  {buildCurrencyTruthMessage(truth, { subject: "Invoice" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`acct-chip ${statusChip[inv.status as string] || "acct-chip-gold"}`}>
                  {inv.status}
                </span>
                <p className="text-sm font-semibold text-[var(--acct-ink)]">
                  {formatPricingAmount(Number(inv.total_kobo || 0), truth)}
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
