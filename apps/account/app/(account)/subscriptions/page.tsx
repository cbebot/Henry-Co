import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getSubscriptions } from "@/lib/account-data";
import {
  formatBillingInterval,
  formatCurrencyAmount,
  formatDate,
  formatSubscriptionStatus,
  divisionLabel,
  divisionColor,
} from "@/lib/format";
import { resolveAccountLedgerCurrencyTruth } from "@/lib/currency-truth";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { active: "acct-chip-green", paused: "acct-chip-orange", cancelled: "acct-chip-red", expired: "acct-chip-red", past_due: "acct-chip-red" };

export default async function SubscriptionsPage() {
  const user = await requireAccountUser();
  const [subscriptions, profile] = await Promise.all([
    getSubscriptions(user.id),
    getProfile(user.id),
  ]);
  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Subscriptions" description="Read-only plan summary from divisions that currently sync subscription records into the shared account hub." icon={RefreshCcw} />
      {subscriptions.length === 0 ? (
        <EmptyState icon={RefreshCcw} title="No synced subscriptions yet" description="This can mean you have no active plan, or that the division has not published subscription records into the shared account ledger yet." />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const record = subscription as Record<string, unknown>;
            const truth = resolveAccountLedgerCurrencyTruth(record, {
              country: profile?.country as string | null | undefined,
              preferredCurrency: profile?.currency as string | null | undefined,
            });

            return (
              <Link key={String(record.id || "")} href={`/subscriptions/${record.id}`} className="acct-card block p-5 transition-colors hover:bg-[var(--acct-surface)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: divisionColor(String(record.division || "")) }}>
                      {divisionLabel(String(record.division || "")).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">{String(record.plan_name || "Subscription")}</p>
                      <p className="text-xs text-[var(--acct-muted)]">
                        {divisionLabel(String(record.division || ""))}
                        {record.plan_tier ? ` · ${record.plan_tier}` : ""}
                        {!truth.supportsNativeSettlement && truth.pricingCurrency !== truth.settlementCurrency
                          ? ` · settles in ${truth.settlementCurrency}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`acct-chip ${statusChip[String(record.status || "")] || "acct-chip-gold"}`}>{formatSubscriptionStatus(String(record.status || ""))}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-[var(--acct-surface)] p-3">
                  <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Amount</p><p className="mt-0.5 text-sm font-semibold">{formatCurrencyAmount(Number(record.amount_kobo || 0), truth.pricingCurrency, { unit: "kobo", locale: truth.locale })}</p></div>
                  <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Cycle</p><p className="mt-0.5 text-sm font-semibold">{formatBillingInterval(String(record.billing_cycle || ""))}</p></div>
                  <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Renews</p><p className="mt-0.5 text-sm font-semibold">{record.current_period_end ? formatDate(String(record.current_period_end)) : "—"}</p></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
