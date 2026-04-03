import { RefreshCcw } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getSubscriptions } from "@/lib/account-data";
import { formatNaira, formatDate, divisionLabel, divisionColor } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

const statusChip: Record<string, string> = {
  active: "acct-chip-green",
  paused: "acct-chip-orange",
  cancelled: "acct-chip-red",
  expired: "acct-chip-red",
  past_due: "acct-chip-red",
};

export default async function SubscriptionsPage() {
  const user = await requireAccountUser();
  const subscriptions = await getSubscriptions(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Subscriptions"
        description="Manage your active plans and billing cycles."
        icon={RefreshCcw}
      />

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={RefreshCcw}
          title="No subscriptions"
          description="You don't have any active subscriptions yet. Explore HenryCo services to find plans that suit you."
        />
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub: Record<string, string | number>) => (
            <div key={sub.id as string} className="acct-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: divisionColor(sub.division as string) }}
                  >
                    {divisionLabel(sub.division as string).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--acct-ink)]">{sub.plan_name}</p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {divisionLabel(sub.division as string)}
                      {sub.plan_tier ? ` · ${sub.plan_tier}` : ""}
                    </p>
                  </div>
                </div>
                <span className={`acct-chip ${statusChip[sub.status as string] || "acct-chip-gold"}`}>
                  {sub.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-[var(--acct-surface)] p-3">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Amount</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatNaira(sub.amount_kobo as number)}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Cycle</p>
                  <p className="mt-0.5 text-sm font-semibold capitalize">{sub.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">Renews</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {sub.current_period_end ? formatDate(sub.current_period_end as string) : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
