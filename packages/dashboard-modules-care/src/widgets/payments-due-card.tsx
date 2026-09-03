import { MetricCard } from "@henryco/dashboard-shell/components";
import { Wallet } from "lucide-react";

import { CARE_HOME_HREF, type CareSnapshot } from "../data";
import { formatNaira } from "../format";

const PAYMENTS_DUE_LABEL = "Payments due";

/**
 * PaymentsDueCard — the outstanding-balance metric for care bookings.
 *
 * `stats.needsPayment` counts bookings awaiting payment (a balance due
 * or a receipt still in verification); `stats.outstandingBalanceKobo`
 * sums their balances. Care balances are stored in whole naira, so the
 * value is formatted with `formatNaira` (no kobo division). When nothing
 * is owed the card reads "All settled" rather than "₦0", so a clear
 * account never looks like a debt. Deep-links to `/care`.
 */
export function PaymentsDueCard({ snapshot }: { snapshot: CareSnapshot }) {
  const { needsPayment, outstandingBalanceKobo } = snapshot.stats;
  const hasDue = needsPayment > 0;

  return (
    <MetricCard
      label={PAYMENTS_DUE_LABEL}
      value={hasDue ? formatNaira(outstandingBalanceKobo) : "All settled"}
      icon={<Wallet size={18} aria-hidden />}
      href={CARE_HOME_HREF}
      context={
        hasDue
          ? {
              kind: "comparison",
              vs: `${needsPayment} booking${needsPayment === 1 ? "" : "s"}`,
              delta: "awaiting payment",
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "Nothing outstanding",
            }
      }
    />
  );
}
