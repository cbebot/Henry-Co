import { MetricCard } from "@henryco/dashboard-shell/components";
import { TrendingUp } from "lucide-react";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * ActiveSubscriptionsCard — count of `customer_subscriptions` rows
 * with `status='active'`. Deep-links to `/subscriptions`.
 */
export function ActiveSubscriptionsCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const subs = snapshot.summary.activeSubscriptions;
  const tiers = subs
    .map((s) => s.planTier)
    .filter((tier): tier is string => Boolean(tier));
  const tierLabel = tiers.length > 0 ? tiers.join(", ") : null;

  return (
    <MetricCard
      label="Active subscriptions"
      value={subs.length.toString()}
      href="/subscriptions"
      icon={<TrendingUp size={18} aria-hidden />}
      context={
        subs.length > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: tierLabel ?? "All synced",
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "No active plans",
            }
      }
    />
  );
}
