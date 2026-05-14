import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingContext } from "@/lib/account-data";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/wallet/styles.css";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { BackNav } from "@/components/wallet/BackNav";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";
import { HeroBalance } from "@/components/wallet/HeroBalance";

export const dynamic = "force-dynamic";

export default async function WalletFundingPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const user = await requireAccountUser();
  const data = await getWalletFundingContext(user.id);
  const balanceKobo = Number(data.wallet.balance_kobo) || 0;

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet" label={t("Back to wallet")} />
      <HeroBalance
        balanceKobo={balanceKobo}
        pendingFundingKobo={data.pending_kobo}
        pendingWithdrawalKobo={0}
        availableKobo={balanceKobo}
        currency={data.wallet.currency || "NGN"}
        settlementNote={t(
          "Verified balance is ready to spend across HenryCo. Pending funding sits separately until finance clears the transfer.",
        )}
      />
      <section className="acct-wal__section" aria-labelledby="wal-fund-rail-head">
        <div className="acct-wal__section-head">
          <h2 id="wal-fund-rail-head" className="acct-wal__section-title hc-h3 acct-display">
            Transfer to HenryCo
          </h2>
          <span className="acct-wal__section-meta">Send your bank transfer to these details, then upload proof.</span>
        </div>
        <div className="acct-wal__columns">
          <AccountDetailsCard
            rail={data.rail}
            copyLabel={t("Copy")}
            copiedLabel={t("Copied")}
          />
          <FundingRequestForm />
        </div>
      </section>
      <section className="acct-wal__section" aria-labelledby="wal-fund-list-head">
        <div className="acct-wal__section-head">
          <h2 id="wal-fund-list-head" className="acct-wal__section-title hc-h3 acct-display">
            Funding requests
          </h2>
          <span className="acct-wal__section-meta">{data.requests.length} total</span>
        </div>
        {data.requests.length === 0 ? (
          <div className="acct-wal__empty">
            <span className="acct-wal__empty-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </span>
            <h3 className="acct-wal__empty-title">No funding requests yet</h3>
            <p className="acct-wal__empty-body">
              Start a funding request above. Once finance confirms the bank
              reference, your balance moves into available funds.
            </p>
          </div>
        ) : (
          <div className="acct-wal__funding-list">
            {data.requests.map((request) => (
              <FundingRequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
