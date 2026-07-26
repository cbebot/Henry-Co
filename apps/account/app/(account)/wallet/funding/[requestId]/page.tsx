import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";

import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingRequestById } from "@/lib/account-data";

import "@/components/wallet/styles.css";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { WalletPageHeader } from "@/components/wallet/WalletPageHeader";
import {
  formatKoboMajor,
  fundingStatusTone,
  statusReadable,
} from "@/components/wallet/helpers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ requestId: string }>;
};

function formatCreated(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Wallet · Funding request detail (Onyx Ledger).
 *
 * The amount is the header figure; a status chip + the step ladder show
 * exactly where the request stands, then the payment rail reference.
 */
export default async function WalletFundingRequestPage({ params }: Props) {
  const { requestId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const copy = getAccountCopy(locale).wallet;
  const request = await getWalletFundingRequestById(user.id, requestId);

  if (!request) {
    return (
      <div className="acct-wal acct-fade-in">
        <WalletPageHeader
          backHref="/wallet/funding"
          backLabel={t("Back to funding")}
          eyebrow={t("Wallet · Funding request")}
          title={t("Request not found")}
        />
        <div className="acct-wal__empty">
          <h3 className="acct-wal__empty-title acct-display">{t("Funding request not found.")}</h3>
          <p className="acct-wal__empty-body">
            {t("Open one of your existing requests from the funding lane.")}
          </p>
          <Link className="acct-wal__ghost-btn" href="/wallet/funding">
            {t("Back to funding")}
          </Link>
        </div>
      </div>
    );
  }

  const tone = fundingStatusTone(request.status);
  const statusLabel =
    (copy.statusLabels as Record<string, string>)[request.status] ??
    statusReadable(request.status);
  const confirmed = request.status === "completed" || request.status === "verified";
  const refDisplay = request.reference || request.id.slice(0, 8).toUpperCase();
  const railState = confirmed ? t("Confirmed") : t("Processing");

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />

      <WalletPageHeader
        backHref="/wallet/funding"
        backLabel={t("Back to funding")}
        eyebrow={t("Wallet · Funding request")}
        title={refDisplay}
        blurb={`${t("Created")} ${formatCreated(request.created_at)} · ${railState}`}
        figure={{ label: t("Amount"), value: `₦${formatKoboMajor(request.amount_kobo)}` }}
        chip={{ label: statusLabel, tone }}
      />

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Where we are")}</h2>
          <span className="acct-wal__section-meta">{statusLabel}</span>
        </div>
        <div className="acct-wal__ladder">
          <div className="acct-wal__step">
            <div className="acct-wal__step-rail">
              <span className="acct-wal__step-bubble" data-state="done">1</span>
            </div>
            <span className="acct-wal__step-title">{t("Request created")}</span>
            <span className="acct-wal__step-desc">
              {t("Your funding reference is saved.")}
            </span>
          </div>
          <div className="acct-wal__step">
            <div className="acct-wal__step-rail">
              <span className="acct-wal__step-bubble" data-state={confirmed ? "done" : "active"}>2</span>
            </div>
            <span className="acct-wal__step-title">{t("Confirming payment")}</span>
            <span className="acct-wal__step-desc">
              {t("We match your payment to your reference automatically once it clears.")}
            </span>
          </div>
          <div className="acct-wal__step">
            <div className="acct-wal__step-rail">
              <span className="acct-wal__step-bubble" data-state={confirmed ? "done" : "todo"}>3</span>
            </div>
            <span className="acct-wal__step-title">{t("Wallet credit")}</span>
            <span className="acct-wal__step-desc">
              {t("Your balance updates as soon as your payment is confirmed.")}
            </span>
          </div>
        </div>
      </section>

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Transfer details")}</h2>
          <span className="acct-wal__section-meta">
            {request.note ? request.note : t("Keep this reference so we can match your payment automatically.")}
          </span>
        </div>
        <div className="acct-wal__columns acct-wal__columns--single">
          <AccountDetailsCard
            rail={{
              bankName: request.bank_name,
              accountName: request.account_name,
              accountNumber: request.account_number,
            }}
            copyLabel={t("Copy")}
            copiedLabel={t("Copied")}
          />
        </div>
      </section>
    </div>
  );
}
