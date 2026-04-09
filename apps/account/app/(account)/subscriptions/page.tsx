import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSubscriptions } from "@/lib/account-data";
import { formatNaira, formatDate, divisionLabel, divisionColor } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
const statusChip: Record<string, string> = { active: "acct-chip-green", paused: "acct-chip-orange", cancelled: "acct-chip-red", expired: "acct-chip-red", past_due: "acct-chip-red" };

export default async function SubscriptionsPage() {
  const user = await requireAccountUser();
  const subscriptions = await getSubscriptions(user.id);
  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Subscriptions" description="Read-only plan summary from divisions that currently sync subscription records into the shared account hub." icon={RefreshCcw} />
      {subscriptions.length === 0 ? (
        <EmptyState icon={RefreshCcw} title="No synced subscriptions yet" description="This can mean you have no active plan, or that the division has not published subscription records into the shared account ledger yet." />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription: Record<string, string | number>) => (
            <Link key={subscription.id as string} href={`/subscriptions/${subscription.id}`} className="acct-card block p-5 transition-colors hover:bg-[var(--acct-surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: divisionColor(subscription.division as string) }}>
                    {divisionLabel(subscription.division as string).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{subscription.plan_name}</p>
                    <p className="text-xs text-[var(--acct-muted)]">{divisionLabel(subscription.division as string)}{subscription.plan_tier ? ` · ${subscription.plan_tier}` : ""}</p>
                  </div>
                </div>
                <span className={`acct-chip ${statusChip[subscription.status as string] || "acct-chip-gold"}`}>{subscription.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-[var(--acct-surface)] p-3">
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Amount</p><p className="mt-0.5 text-sm font-semibold">{formatNaira(subscription.amount_kobo as number)}</p></div>
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Cycle</p><p className="mt-0.5 text-sm font-semibold capitalize">{subscription.billing_cycle}</p></div>
                <div><p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Renews</p><p className="mt-0.5 text-sm font-semibold">{subscription.current_period_end ? formatDate(subscription.current_period_end as string) : "—"}</p></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
