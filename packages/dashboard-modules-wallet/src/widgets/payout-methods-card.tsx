import { MetricCard } from "@henryco/dashboard-shell/components";
import { CreditCard } from "lucide-react";
import { getDashboardShellCopy, type AppLocale } from "@henryco/i18n";
import type { WalletSnapshot } from "../data";

/**
 * PayoutMethodsCard — surfaces the count of active payout methods, with
 * the default-method label as comparison context. Deep-links to
 * `/wallet/withdrawals` where method management lives. Empty state
 * (zero methods) surfaces a "Add a payout method" trend label.
 */
export function PayoutMethodsCard({
  snapshot,
  locale,
}: {
  snapshot: WalletSnapshot;
  locale: AppLocale;
}) {
  const copy = getDashboardShellCopy(locale);
  const count = snapshot.payoutMethodCount;
  const hasMethods = count > 0;

  const defaultMethod = snapshot.payoutMethods.find((m) => m.isDefault) ??
    snapshot.payoutMethods[0] ?? null;

  const defaultLabel = defaultMethod
    ? defaultMethod.bankName ??
      defaultMethod.label ??
      (defaultMethod.lastFour ? `····${defaultMethod.lastFour}` : null) ??
      defaultMethod.type ??
      copy.payoutMethods.savedMethod
    : null;

  return (
    <MetricCard
      label={copy.payoutMethods.label}
      value={hasMethods ? `${count}` : "—"}
      icon={<CreditCard size={18} aria-hidden />}
      href="/wallet/withdrawals"
      context={
        hasMethods && defaultLabel
          ? {
              kind: "comparison",
              vs: copy.payoutMethods.defaultLabel,
              delta: defaultLabel,
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: hasMethods
                ? copy.payoutMethods.manageSavedMethods
                : copy.payoutMethods.addPayoutMethod,
            }
      }
    />
  );
}
