import Link from "next/link";
import { Activity } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getRecentActivity } from "@/lib/account-data";
import { activityMessageHref } from "@/lib/notification-center";
import { timeAgo, divisionLabel, divisionColor, formatCurrencyAmount } from "@/lib/format";
import { resolveAccountLedgerCurrencyTruth } from "@/lib/currency-truth";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requireAccountUser();
  const [activity, profile] = await Promise.all([
    getRecentActivity(user.id, 50),
    getProfile(user.id),
  ]);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Activity"
        description="Everything you've done across all HenryCo divisions."
        icon={Activity}
      />

      {activity.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Your cross-division activity will appear here as you use HenryCo services."
        />
      ) : (
        <div className="acct-card divide-y divide-[var(--acct-line)]">
          {activity.map((item: Record<string, string | number | null>) => (
            (() => {
              const truth = resolveAccountLedgerCurrencyTruth(item as Record<string, unknown>, {
                country: profile?.country as string | null | undefined,
                preferredCurrency: profile?.currency as string | null | undefined,
                locale: profile?.language as string | null | undefined,
              });

              return (
            <Link
              key={item.id as string}
              href={activityMessageHref(String(item.id || ""))}
              className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--acct-bg-elevated)]"
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: divisionColor(item.division as string) }}
              >
                {divisionLabel(item.division as string).charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--acct-ink)]">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-sm text-[var(--acct-muted)]">{item.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="acct-chip acct-chip-gold text-[0.65rem]">
                    {divisionLabel(item.division as string)}
                  </span>
                  {item.status && (
                    <span className="acct-chip acct-chip-blue text-[0.65rem]">{item.status}</span>
                  )}
                  <span className="text-[0.65rem] text-[var(--acct-muted)]">
                    {timeAgo(item.created_at as string)}
                  </span>
                </div>
              </div>
              {item.amount_kobo && (
                <p className="shrink-0 text-sm font-semibold text-[var(--acct-ink)]">
                  {formatCurrencyAmount(Number(item.amount_kobo || 0), truth.pricingCurrency, {
                    unit: "kobo",
                    locale: truth.locale,
                  })}
                </p>
              )}
            </Link>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
}
