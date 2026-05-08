import { MetricCard } from "@henryco/dashboard-shell/components";
import { Wallet } from "lucide-react";
import { formatNaira } from "../format";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * WalletBalanceCard — surfaces the customer's wallet balance with
 * pending-funding context. Deep-links to `/wallet`.
 */
export function WalletBalanceCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const { wallet } = snapshot.summary;
  const pending = snapshot.pendingFundingKobo;

  return (
    <MetricCard
      label="Wallet balance"
      value={formatNaira(wallet.balanceKobo)}
      href="/wallet"
      icon={<Wallet size={18} aria-hidden />}
      context={
        pending > 0
          ? {
              kind: "comparison",
              vs: "pending verification",
              delta: formatNaira(pending),
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "Live · synced now",
            }
      }
    />
  );
}
