import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n/server";
import { requireAccountUser } from "@/lib/auth";
import { getSubscriptions } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  formatBillingInterval,
  formatCurrencyAmount,
  formatDate,
  formatSubscriptionStatus,
  divisionLabel,
  divisionColor,
} from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { active: "acct-chip-green", paused: "acct-chip-orange", cancelled: "acct-chip-red", expired: "acct-chip-red", past_due: "acct-chip-red" };

export default async function SubscriptionsPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const subscriptions = await getSubscriptions(user.id);
  const copy = getAccountCopy(locale).subscriptions;

  const localizeStatus = (status: string) => {
    const key = String(status || "").trim().toLowerCase();
    const map: Record<string, string> = {
      active: copy.statusLabels.active,
      paused: copy.statusLabels.paused,
      cancelled: copy.statusLabels.cancelled,
      expired: copy.statusLabels.expired,
      past_due: copy.statusLabels.past_due,
      trialing: copy.statusLabels.trialing,
      grace: copy.statusLabels.grace,
      pending: copy.statusLabels.pending,
    };
    return map[key] || formatSubscriptionStatus(key) || copy.statusLabels.unknown;
  };

  const localizeCycle = (interval: string) => {
    const key = String(interval || "").trim().toLowerCase();
    const map: Record<string, string> = {
      monthly: copy.cycleLabels.monthly,
      yearly: copy.cycleLabels.yearly,
      annual: copy.cycleLabels.annual,
      quarterly: copy.cycleLabels.quarterly,
      weekly: copy.cycleLabels.weekly,
      biweekly: copy.cycleLabels.biweekly,
      daily: copy.cycleLabels.daily,
      one_time: copy.cycleLabels.one_time,
    };
    return map[key] || formatBillingInterval(key) || copy.cycleLabels.notSet;
  };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title={copy.hero.title} description={copy.hero.description} icon={RefreshCcw} />
      {subscriptions.length === 0 ? (
        <EmptyState icon={RefreshCcw} title={copy.empty.title} description={copy.empty.description} />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription: Record<string, string | number>) => (
            <Link key={subscription.id as string} href={`/subscriptions/${subscription.id}`} className="acct-card block p-5 transition-colors hover:bg-[var(--acct-surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: divisionColor(subscription.division as string) }}>
                    {divisionLabel(subscription.division as string).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{subscription.plan_name || copy.card.planFallback}</p>
                    <p className="text-xs text-[var(--acct-muted)]">{divisionLabel(subscription.division as string)}{subscription.plan_tier ? `${copy.card.tierSeparator}${subscription.plan_tier}` : ""}</p>
                  </div>
                </div>
                <span className={`acct-chip ${statusChip[subscription.status as string] || "acct-chip-gold"}`}>{localizeStatus(String(subscription.status || ""))}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-[var(--acct-surface)] p-3">
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">{copy.card.amountLabel}</p><p className="mt-0.5 text-sm font-semibold">{formatCurrencyAmount(Number(subscription.amount_kobo || 0), String(subscription.currency || "NGN"), { unit: "kobo", locale })}</p></div>
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">{copy.card.cycleLabel}</p><p className="mt-0.5 text-sm font-semibold">{localizeCycle(String(subscription.billing_cycle || ""))}</p></div>
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">{copy.card.renewsLabel}</p><p className="mt-0.5 text-sm font-semibold">{subscription.current_period_end ? formatDate(subscription.current_period_end as string, locale) : copy.card.renewsFallback}</p></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
