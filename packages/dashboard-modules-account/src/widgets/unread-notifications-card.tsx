import { MetricCard } from "@henryco/dashboard-shell/components";
import { Bell } from "lucide-react";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * UnreadNotificationsCard — surfaces the live unread count and
 * deep-links to `/notifications`. Empty state ("All caught up.") is
 * inlined into the trend magnitude so the metric always renders a
 * complete card.
 */
export function UnreadNotificationsCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const count = snapshot.summary.unreadNotificationCount;
  return (
    <MetricCard
      label="Notifications"
      value={count.toString()}
      href="/notifications"
      icon={<Bell size={18} aria-hidden />}
      context={
        count > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: `${count} unread message${count === 1 ? "" : "s"}`,
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "All caught up",
            }
      }
    />
  );
}
