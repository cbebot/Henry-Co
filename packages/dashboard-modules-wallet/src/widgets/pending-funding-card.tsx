import { MetricCard } from "@henryco/dashboard-shell/components";
import { ShieldCheck } from "lucide-react";
import { getDashboardShellCopy, type AppLocale } from "@henryco/i18n";
import { formatNaira } from "../format";
import type { WalletSnapshot } from "../data";

/**
 * PendingFundingCard — surfaces the kobo total of funding requests
 * that haven't yet been verified. Mirrors the wallet page's "Pending
 * funding" section as a compact metric. Deep-links to `/wallet/funding`.
 */
export function PendingFundingCard({
  snapshot,
  locale,
}: {
  snapshot: WalletSnapshot;
  locale: AppLocale;
}) {
  const copy = getDashboardShellCopy(locale);
  const count = snapshot.pendingFundingCount;
  const hasPending = count > 0;

  return (
    <MetricCard
      label={copy.pendingFunding.label}
      value={hasPending ? formatNaira(snapshot.pendingFundingKobo) : copy.pendingFunding.allClear}
      icon={<ShieldCheck size={18} aria-hidden />}
      href="/wallet/funding"
      context={
        hasPending
          ? {
              kind: "comparison",
              vs: copy.pendingFunding.requestCount(count),
              delta: copy.pendingFunding.awaitingVerification,
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: copy.pendingFunding.noRequestsInReview,
            }
      }
    />
  );
}
