import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingContext } from "@/lib/account-data";
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";
import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/wallet/styles.css";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
import WalletTopUpClient from "@/components/wallet/WalletTopUpClient";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { BackNav } from "@/components/wallet/BackNav";
import { FundingRequestRow } from "@/components/wallet/FundingRequestRow";
import {
  HeroCard,
  EmptyStateCard,
  DivisionLanding,
} from "@henryco/dashboard-shell/surfaces";

export const dynamic = "force-dynamic";

/**
 * Wallet · Add money — top-up surface.
 *
 * V3-15-JOB-B: card/bank/USSD (the proven hosted-redirect rail) is the DEFAULT
 * primary method; bank-transfer-with-proof remains as a fallback. The reconciler
 * runs on load so a buyer returning from hosted checkout sees the confirmed
 * top-up credited and the request marked verified (idempotent — never double).
 */
export default async function WalletFundingPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.wallet;
  const user = await requireAccountUser();

  // Project any confirmed top-up onto the wallet before reading state.
  try {
    await reconcileWalletTopupsForUser(user.id);
  } catch {
    /* reconcile is self-healing; a transient failure retries on the next load */
  }

  const data = await getWalletFundingContext(user.id);

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet" label={t("Back to wallet")} />
      <DivisionLanding
        hero={
          <HeroCard
            variant="compact"
            tone="active"
            eyebrow={t("Wallet · add money")}
            headline={t("Add money to your Henry Onyx wallet")}
            blurb={t(
              "Top up instantly with card, bank transfer or USSD — your balance updates the moment payment is confirmed. Prefer a manual transfer? Use bank transfer with proof below.",
            )}
          />
        }
        sections={[
          {
            id: "wal-fund-instant",
            title: t("Pay instantly"),
            meta: t("Card, bank transfer or USSD — confirmed automatically."),
            content: <WalletTopUpClient />,
          },
          {
            id: "wal-fund-rail",
            title: t("Bank transfer with proof"),
            meta: t("Prefer to transfer manually? Send to these details, then upload proof."),
            content: (
              <div className="acct-wal__columns">
                <AccountDetailsCard
                  rail={data.rail}
                  copyLabel={t("Copy")}
                  copiedLabel={t("Copied")}
                />
                <FundingRequestForm />
              </div>
            ),
          },
          {
            id: "wal-fund-list",
            title: t("Funding requests"),
            meta: t("{count} total").replace("{count}", String(data.requests.length)),
            content:
              data.requests.length === 0 ? (
                <EmptyStateCard
                  kicker={t("Funding · empty")}
                  title={t("No funding requests yet")}
                  body={t(
                    "Start a top-up above. Card, bank transfer and USSD confirm automatically; a manual transfer moves into available funds once finance confirms the reference.",
                  )}
                />
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
              ),
          },
        ]}
      />
    </div>
  );
}
