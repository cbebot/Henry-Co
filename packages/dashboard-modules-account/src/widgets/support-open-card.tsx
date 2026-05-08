import { MetricCard } from "@henryco/dashboard-shell/components";
import { LifeBuoy } from "lucide-react";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * SupportOpenCard — open-thread count with unread-reply context.
 * Deep-links to `/support`; `/support/new` is where
 * `@henryco/chat-composer`'s composer mounts (already wired in
 * apps/account — V2-COMPOSER-01).
 */
export function SupportOpenCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const open = snapshot.summary.openSupportCount;
  const unread = snapshot.summary.unreadSupportCount;
  return (
    <MetricCard
      label="Support"
      value={open.toString()}
      href="/support"
      icon={<LifeBuoy size={18} aria-hidden />}
      context={
        unread > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: `${unread} new repl${unread === 1 ? "y" : "ies"}`,
            }
          : open > 0
            ? {
                kind: "trend",
                direction: "flat",
                magnitude: `${open} open request${open === 1 ? "" : "s"}`,
              }
            : {
                kind: "trend",
                direction: "flat",
                magnitude: "No open requests",
              }
      }
    />
  );
}
