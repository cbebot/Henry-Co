import { getVerificationGateCopy } from "@henryco/trust";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import {
  getPendingWithdrawalHoldKobo,
  getPayoutMethods,
  getWithdrawalPinConfigured,
  getWithdrawalRequests,
  getWalletSummary,
} from "@/lib/account-data";
import { getVerificationState } from "@/lib/verification";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/wallet/styles.css";
import WalletWithdrawalsClient from "@/components/wallet/WalletWithdrawalsClient";
import { BackNav } from "@/components/wallet/BackNav";
import { HeroBalance } from "@/components/wallet/HeroBalance";
import { formatKoboMajor } from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

export default async function WalletWithdrawalsPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const user = await requireAccountUser();
  const [wallet, methods, requests, pinConfigured, verification] = await Promise.all([
    getWalletSummary(user.id),
    getPayoutMethods(user.id),
    getWithdrawalRequests(user.id),
    getWithdrawalPinConfigured(user.id),
    getVerificationState(user.id),
  ]);

  const balanceKobo = Number((wallet as { balance_kobo?: number }).balance_kobo ?? 0);
  const pendingHoldKobo = getPendingWithdrawalHoldKobo(requests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - pendingHoldKobo);
  const verificationGate = getVerificationGateCopy(verification.status, "verified");

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet" label={t("Back to wallet")} />
      <HeroBalance
        balanceKobo={balanceKobo}
        pendingFundingKobo={0}
        pendingWithdrawalKobo={pendingHoldKobo}
        availableKobo={availableBalanceKobo}
        currency={(wallet as { currency?: string }).currency || "NGN"}
        settlementNote={t(
          "Available balance funds the next withdrawal. Pending withdrawals stay held until finance approves the payout.",
        )}
      />
      <section className="acct-wal__section" aria-labelledby="wal-withdrawals-head">
        <div className="acct-wal__section-head">
          <h2 id="wal-withdrawals-head" className="acct-wal__section-title hc-h3 acct-display">
            {t("Withdraw to bank")}
          </h2>
          <span className="acct-wal__section-meta">
            {(methods as Array<unknown>).length > 0
              ? t("Select a payout method and confirm with your PIN.")
              : t("Add a verified bank account to receive withdrawals.")}
          </span>
        </div>
        <WalletWithdrawalsClient
          initialMethods={methods as never}
          initialRequests={requests as never}
          pinConfigured={pinConfigured}
          availableBalanceKobo={availableBalanceKobo}
          pendingHoldKobo={pendingHoldKobo}
          verificationGate={{
            status: verification.status,
            headline: t(verificationGate.headline),
            detail: t(verificationGate.detail),
          }}
        />
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color: "var(--acct-muted)",
            textAlign: "right",
          }}
          aria-live="polite"
        >
          ₦{formatKoboMajor(availableBalanceKobo)} {t("available · withdrawals approved within 24h")}
        </p>
      </section>
    </div>
  );
}
