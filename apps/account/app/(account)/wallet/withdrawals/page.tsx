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
import { WalletPageHeader } from "@/components/wallet/WalletPageHeader";
import { formatKoboMajor } from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

/**
 * Wallet · Withdrawals — detail flow (Onyx Ledger).
 *
 * The available balance is the header figure; pending withdrawals stay held
 * off it. Withdrawals are provider-confirmed truth — finance reviews each
 * payout before it settles, so we promise review, not a fixed SLA.
 */
export default async function WalletWithdrawalsPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const user = await requireAccountUser();
  // Per-read resilience (matches the main wallet page): one slow or failed
  // read renders its honest empty state instead of taking the whole page.
  const [walletR, methodsR, requestsR, pinR, verificationR] = await Promise.allSettled([
    getWalletSummary(user.id),
    getPayoutMethods(user.id),
    getWithdrawalRequests(user.id),
    getWithdrawalPinConfigured(user.id),
    getVerificationState(user.id),
  ]);
  const wallet = walletR.status === "fulfilled" ? walletR.value : {};
  const methods = methodsR.status === "fulfilled" ? methodsR.value : [];
  const requests = requestsR.status === "fulfilled" ? requestsR.value : [];
  const pinConfigured = pinR.status === "fulfilled" ? pinR.value : false;
  const verification =
    verificationR.status === "fulfilled" ? verificationR.value : { status: "none" as const };

  const balanceKobo = Number((wallet as { balance_kobo?: number }).balance_kobo ?? 0);
  const pendingHoldKobo = getPendingWithdrawalHoldKobo(requests as never);
  const availableBalanceKobo = Math.max(0, balanceKobo - pendingHoldKobo);
  const verificationGate = getVerificationGateCopy(verification.status, "verified");
  const hasMethod = (methods as Array<unknown>).length > 0;

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />

      <WalletPageHeader
        backHref="/wallet"
        backLabel={t("Back to wallet")}
        eyebrow={t("Wallet · Withdrawals")}
        title={t("Withdraw funds")}
        blurb={t(
          "Your available balance funds the next withdrawal. Pending withdrawals stay held until they're approved.",
        )}
        figure={{
          label: t("Available balance"),
          value: `₦${formatKoboMajor(availableBalanceKobo)}`,
        }}
        chip={
          pendingHoldKobo > 0
            ? { label: `₦${formatKoboMajor(pendingHoldKobo)} ${t("held")}`, tone: "active" }
            : undefined
        }
      />

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Withdraw to bank")}</h2>
          <span className="acct-wal__section-meta">
            {hasMethod
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
        <p className="acct-wal__section-foot" aria-live="polite">
          {/* Single templated string — no fragment concatenation, so word
              order survives every locale (the amount slots wherever the
              translation puts {amount}). */}
          {t("{amount} available · each withdrawal is reviewed before it's sent").replaceAll(
            "{amount}",
            `₦${formatKoboMajor(availableBalanceKobo)}`,
          )}
        </p>
      </section>
    </div>
  );
}
