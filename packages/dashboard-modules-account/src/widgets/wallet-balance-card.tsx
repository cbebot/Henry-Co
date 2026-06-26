import { MetricCard } from "@henryco/dashboard-shell/components";
import { Wallet } from "lucide-react";
import { getDashboardShellCopy, type AppLocale } from "@henryco/i18n";
import { formatNaira } from "../format";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * WalletBalanceCard — surfaces the customer's wallet balance with
 * pending-funding context. Deep-links to `/wallet`.
 */
export function WalletBalanceCard({
  snapshot,
  locale,
}: {
  snapshot: CustomerOverviewSnapshot;
  locale: AppLocale;
}) {
  const { wallet } = snapshot.summary;
  const pending = snapshot.pendingFundingKobo;
  const copy = getDashboardShellCopy(locale);

  return (
    <MetricCard
      label={copy.walletBalance.label}
      value={formatNaira(wallet.balanceKobo)}
      href="/wallet"
      icon={<Wallet size={18} aria-hidden />}
      context={
        pending > 0
          ? {
              kind: "comparison",
              vs: copy.walletBalance.pendingVerification,
              delta: formatNaira(pending),
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: copy.walletBalance.liveSyncedNow,
            }
      }
    />
  );
}
