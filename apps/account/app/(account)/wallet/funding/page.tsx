import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingContext } from "@/lib/account-data";
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";
import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/wallet/styles.css";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
import WalletTopUpClient from "@/components/wallet/WalletTopUpClient";
import WalletCreditedToast from "@/components/wallet/WalletCreditedToast";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { WalletPageHeader } from "@/components/wallet/WalletPageHeader";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";

export const dynamic = "force-dynamic";

/**
 * Wallet · Add money — top-up surface (Onyx Ledger).
 *
 * Card/bank/USSD (the proven hosted-redirect rail) is the DEFAULT primary
 * method; bank transfer with proof remains as a fallback. The reconciler runs
 * on load so a buyer returning from hosted checkout sees the confirmed top-up
 * credited and the request marked verified (idempotent — never double-credits).
 */
export default async function WalletFundingPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const copy = getAccountCopy(locale).wallet;
  const user = await requireAccountUser();

  let creditedKobo = 0;
  try {
    const credited = await reconcileWalletTopupsForUser(user.id);
    creditedKobo = credited.creditedCount > 0 ? credited.creditedKobo : 0;
  } catch {
    /* reconcile is self-healing; a transient failure retries on the next load */
  }

  const data = await getWalletFundingContext(user.id);

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
        title={t("Add money")}
        blurb={t(
          "Top up with card, bank transfer or USSD — your balance updates as soon as the payment is confirmed. Prefer a manual transfer? Use bank transfer with proof below.",
        )}
      />

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Pay by card, transfer or USSD")}</h2>
          <span className="acct-wal__section-meta">{t("Confirmed automatically.")}</span>
        </div>
        <WalletTopUpClient />
      </section>

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Bank transfer with proof")}</h2>
          <span className="acct-wal__section-meta">
            {t("Send to these details, then upload your proof.")}
          </span>
        </div>
        <div className="acct-wal__columns">
          <AccountDetailsCard rail={data.rail} copyLabel={t("Copy")} copiedLabel={t("Copied")} />
          <FundingRequestForm />
        </div>
      </section>

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Funding requests")}</h2>
          <span className="acct-wal__section-meta">
            {t("{count} total").replace("{count}", String(data.requests.length))}
          </span>
        </div>
        {data.requests.length === 0 ? (
          <div className="acct-wal__empty">
            <span className="acct-wal__empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <h3 className="acct-wal__empty-title acct-display">{t("No funding requests yet")}</h3>
            <p className="acct-wal__empty-body">
              {t(
                "Start a top-up above. Card, bank transfer and USSD confirm automatically; a manual transfer moves into available funds once finance confirms the reference.",
              )}
            </p>
          </div>
        ) : (
          <div className="acct-wal__funding-list">
            {data.requests.map((request) => (
              <FundingRequestRow
                key={request.id}
                request={request}
                copy={copy.funding}
                statusLabels={copy.statusLabels}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
