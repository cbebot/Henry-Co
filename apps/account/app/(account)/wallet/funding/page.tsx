import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  getWalletFundingContext,
  getWithdrawalRequests,
  getPendingWithdrawalHoldKobo,
} from "@/lib/account-data";
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";

import "@/components/wallet/styles.css";
import WalletTopUpClient from "@/components/wallet/WalletTopUpClient";
import WalletCreditedToast from "@/components/wallet/WalletCreditedToast";
import { WalletPageHeader } from "@/components/wallet/WalletPageHeader";
import { FundingBalanceHero } from "@/components/wallet/FundingBalanceHero";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";

export const dynamic = "force-dynamic";

/**
 * Wallet · Add money — the single instant top-up surface (Onyx Ledger).
 *
 * One confident flow: lead with the available balance, then add money through
 * the proven hosted-redirect rail (Card / Pay from bank app / USSD — the
 * provider is never named, Principle 9). The manual "bank transfer with proof"
 * section was retired from this surface; legacy in-flight requests are still
 * served by /wallet/funding/[requestId].
 *
 * MONEY INVARIANT: the reconciler runs once on load so a buyer returning from
 * hosted checkout sees their top-up credited (idempotent — never double-credits);
 * every figure is read from server-confirmed kobo and nothing is mutated here.
 */
export default async function WalletFundingPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const copy = getAccountCopy(locale).wallet;

  // Project any confirmed card/bank/USSD top-up onto the wallet before reading
  // balance — idempotent, self-healing; a replay reports zero (→ no toast).
  let creditedKobo = 0;
  try {
    const credited = await reconcileWalletTopupsForUser(user.id);
    creditedKobo = credited.creditedCount > 0 ? credited.creditedKobo : 0;
  } catch {
    /* reconcile is self-healing; a transient failure retries on the next load */
  }

  // Resilience: barrier each read so one Supabase drop degrades a section, not the page.
  const [fundingR, withdrawalR] = await Promise.allSettled([
    getWalletFundingContext(user.id),
    getWithdrawalRequests(user.id),
  ]);

  const funding = fundingR.status === "fulfilled" ? fundingR.value : null;
  const withdrawalRequests = withdrawalR.status === "fulfilled" ? withdrawalR.value : [];

  const walletRow = (funding?.wallet ?? null) as { balance_kobo?: number } | null;
  const balanceKobo = Number(walletRow?.balance_kobo) || 0;
  const heldKobo = getPendingWithdrawalHoldKobo(withdrawalRequests as never);
  const availableKobo = Math.max(0, balanceKobo - heldKobo);
  const arrivingKobo = funding?.pending_kobo ?? 0;

  const requests = (funding?.requests ?? []) as Array<{
    id: string;
    amount_kobo: number;
    status: string;
    reference: string | null;
    proof_url?: string | null;
    created_at: string;
  }>;

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      {creditedKobo > 0 ? (
        <WalletCreditedToast creditedKobo={creditedKobo} nonce={crypto.randomUUID()} />
      ) : null}

      <WalletPageHeader
        backHref="/wallet"
        backLabel={t("Back to wallet")}
        eyebrow={t("Wallet · Add money")}
        title={t("Add money to wallet")}
        blurb={t(
          "Top up by card, your bank app, or USSD. Your balance updates the moment payment is confirmed.",
        )}
      />

      <FundingBalanceHero
        availableKobo={availableKobo}
        heldKobo={heldKobo}
        arrivingKobo={arrivingKobo}
        copy={{
          availableLabel: t("Available balance"),
          heldTemplate: t("{amount} on hold for withdrawals"),
          settlementNote: t("Balances settle in Naira (NGN)."),
          arrivingTemplate: t("{amount} arriving"),
        }}
      />

      <WalletTopUpClient />

      {requests.length > 0 ? (
        <section className="acct-wal__section">
          <div className="acct-wal__section-head">
            <h2 className="acct-wal__section-title acct-display">{t("Top-up activity")}</h2>
            <span className="acct-wal__section-meta">
              {t("{count} total").replace("{count}", String(requests.length))}
            </span>
          </div>
          <div className="acct-wal__funding-list">
            {requests.slice(0, 6).map((request) => (
              <FundingRequestRow
                key={request.id}
                request={request}
                copy={copy.funding}
                statusLabels={copy.statusLabels}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
