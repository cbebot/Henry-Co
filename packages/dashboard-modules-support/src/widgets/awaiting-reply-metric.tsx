import { MetricCard } from "@henryco/dashboard-shell/components";
import { Reply } from "lucide-react";
import type { SupportSnapshot } from "../data";

/**
 * AwaitingReplyMetric — surfaces the count of threads where the staff
 * is waiting on a reply from the customer (status = awaiting_reply).
 * Quiet-states when zero. Deep-links to `/support`.
 */
export function AwaitingReplyMetric({ snapshot }: { snapshot: SupportSnapshot }) {
  const { awaitingReplyCount } = snapshot;
  const hasAwaiting = awaitingReplyCount > 0;

  return (
    <MetricCard
      label="Awaiting your reply"
      value={hasAwaiting ? String(awaitingReplyCount) : "0"}
      icon={<Reply size={18} aria-hidden />}
      href="/support"
      context={
        hasAwaiting
          ? {
              kind: "comparison",
              vs: `${awaitingReplyCount} thread${awaitingReplyCount === 1 ? "" : "s"}`,
              delta: "need your response",
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "Nothing waiting on you",
            }
      }
    />
  );
}
