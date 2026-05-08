import { MetricCard } from "@henryco/dashboard-shell/components";
import { ShieldCheck } from "lucide-react";
import { formatNaira } from "../format";
import type { WalletSnapshot } from "../data";

/**
 * PendingFundingCard — surfaces the kobo total of funding requests
 * that haven't yet been verified. Mirrors the wallet page's "Pending
 * funding" section as a compact metric. Deep-links to `/wallet/funding`.
 */
export function PendingFundingCard({ snapshot }: { snapshot: WalletSnapshot }) {
  const count = snapshot.pendingFundingCount;
  const hasPending = count > 0;

  return (
    <MetricCard
      label="Pending funding"
      value={hasPending ? formatNaira(snapshot.pendingFundingKobo) : "All clear"}
      icon={<ShieldCheck size={18} aria-hidden />}
      href="/wallet/funding"
      context={
        hasPending
          ? {
              kind: "comparison",
              vs: `${count} request${count === 1 ? "" : "s"}`,
              delta: "awaiting verification",
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "No requests in review",
            }
      }
    />
  );
}
