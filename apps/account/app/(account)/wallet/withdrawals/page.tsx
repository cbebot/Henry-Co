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
import {
  HeroCard,
  DivisionLanding,
} from "@henryco/dashboard-shell/surfaces";

import "@/components/wallet/styles.css";
import WalletWithdrawalsClient from "@/components/wallet/WalletWithdrawalsClient";
import { BackNav } from "@/components/wallet/BackNav";
import { formatKoboMajor } from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

/**
 * Wallet · Withdrawals — detail flow.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2F). Compact HeroCard with back link
 * + the available balance as the headline value.
 */
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
  const hasMethod = (methods as Array<unknown>).length > 0;

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet" label={t("Back to wallet")} />
      <DivisionLanding
        hero={
          <HeroCard
            variant="compact"
            tone={pendingHoldKobo > 0 ? "active" : "calm"}
            eyebrow={t("Wallet · withdrawals")}
            headline={`₦${formatKoboMajor(availableBalanceKobo)}`}
            blurb={t(
              "Available balance funds the next withdrawal. Pending withdrawals stay held until finance approves the payout.",
            )}
          />
        }
        sections={[
          {
            id: "wal-withdrawals",
            title: t("Withdraw to bank"),
            meta: hasMethod
              ? t("Select a payout method and confirm with your PIN.")
              : t("Add a verified bank account to receive withdrawals."),
            content: (
              <>
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
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
