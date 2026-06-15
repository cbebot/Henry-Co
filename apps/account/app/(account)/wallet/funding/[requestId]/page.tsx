import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";

import { getAccountCopy, translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingRequestById } from "@/lib/account-data";

import "@/components/wallet/styles.css";
import FundingProofUpload from "@/components/wallet/FundingProofUpload";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { WalletPageHeader } from "@/components/wallet/WalletPageHeader";
import { FundingStepLadder } from "@/components/wallet/FundingStepLadder";
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
 * exactly where the request stands, then the transfer rail + proof upload.
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
  const proofState = request.proof_url ? t("Proof uploaded") : t("Awaiting proof");

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />

      <WalletPageHeader
        backHref="/wallet/funding"
        backLabel={t("Back to funding")}
        eyebrow={t("Wallet · Funding request")}
        title={refDisplay}
        blurb={`${t("Created")} ${formatCreated(request.created_at)} · ${proofState}`}
        figure={{ label: t("Amount"), value: `₦${formatKoboMajor(request.amount_kobo)}` }}
        chip={{ label: statusLabel, tone }}
      />

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Where we are")}</h2>
          <span className="acct-wal__section-meta">{t("3 quick steps")}</span>
        </div>
        <FundingStepLadder
          proofUploaded={Boolean(request.proof_url)}
          proofUploadedAtIso={request.proof_uploaded_at || null}
          confirmed={confirmed}
        />
        {request.proof_url ? (
          <Link
            href={request.proof_url}
            target="_blank"
            rel="noreferrer"
            className="acct-wal__ghost-btn"
            style={{ marginTop: 16 }}
          >
            {t("View proof")}
          </Link>
        ) : null}
      </section>

      <section className="acct-wal__section">
        <div className="acct-wal__section-head">
          <h2 className="acct-wal__section-title acct-display">{t("Transfer rail")}</h2>
          <span className="acct-wal__section-meta">
            {request.note ? request.note : t("Tap any value to copy. Then upload your transfer proof.")}
          </span>
        </div>
        <div className="acct-wal__columns">
          <AccountDetailsCard
            rail={{
              bankName: request.bank_name,
              accountName: request.account_name,
              accountNumber: request.account_number,
            }}
            copyLabel={t("Copy")}
            copiedLabel={t("Copied")}
          />
          <FundingProofUpload requestId={request.id} currentProofUrl={request.proof_url} />
        </div>
      </section>
    </div>
  );
}
