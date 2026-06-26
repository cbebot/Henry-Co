import { MetricCard } from "@henryco/dashboard-shell/components";
import { TrendingUp } from "lucide-react";
import { getDashboardShellCopy, type AppLocale } from "@henryco/i18n";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * ActiveSubscriptionsCard — count of `customer_subscriptions` rows
 * with `status='active'`. Deep-links to `/subscriptions`.
 */
export function ActiveSubscriptionsCard({
  snapshot,
  locale,
}: {
  snapshot: CustomerOverviewSnapshot;
  locale: AppLocale;
}) {
  const copy = getDashboardShellCopy(locale);
  const subs = snapshot.summary.activeSubscriptions;
  const tiers = subs
    .map((s) => s.planTier)
    .filter((tier): tier is string => Boolean(tier));
  const tierLabel = tiers.length > 0 ? tiers.join(", ") : null;

  return (
    <MetricCard
      label={copy.activeSubscriptions.label}
      value={subs.length.toString()}
      href="/subscriptions"
      icon={<TrendingUp size={18} aria-hidden />}
      context={
        subs.length > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: tierLabel ?? copy.activeSubscriptions.allSynced,
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: copy.activeSubscriptions.noActivePlans,
            }
      }
    />
  );
}
