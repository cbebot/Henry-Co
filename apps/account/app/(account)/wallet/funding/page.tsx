import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingContext } from "@/lib/account-data";
import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/wallet/styles.css";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
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
 * Wallet · Funding requests — detail flow.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2F). Compact hero per the detail-page
 * pattern; inherits wallet parent grammar via the same `acct-wal` styles.
 */
export default async function WalletFundingPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const accountCopy = getAccountCopy(locale);
  const copy = accountCopy.wallet;
  const user = await requireAccountUser();
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
            eyebrow={t("Wallet · funding")}
            headline={t("Add money to your HenryCo wallet")}
            blurb={t(
              "Send a bank transfer using the rail below, then upload proof. Finance confirms the amount and your balance moves into available funds.",
            )}
          />
        }
        sections={[
          {
            id: "wal-fund-rail",
            title: t("Transfer to HenryCo"),
            meta: t(
              "Send your bank transfer to these details, then upload proof.",
            ),
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
                    "Start a funding request above. Once finance confirms the bank reference, your balance moves into available funds.",
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
