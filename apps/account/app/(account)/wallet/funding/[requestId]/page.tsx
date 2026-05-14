import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";

import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingRequestById } from "@/lib/account-data";

import "@/components/wallet/styles.css";
import FundingProofUpload from "@/components/wallet/FundingProofUpload";
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { BackNav } from "@/components/wallet/BackNav";
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

export default async function WalletFundingRequestPage({ params }: Props) {
  const { requestId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const request = await getWalletFundingRequestById(user.id, requestId);

  if (!request) {
    return (
      <div className="acct-wal acct-fade-in">
        <BackNav href="/wallet/funding" label={t("Back to funding")} />
        <div className="acct-wal__empty">
          <h3 className="acct-wal__empty-title">{t("Funding request not found.")}</h3>
          <p className="acct-wal__empty-body">{t("Open one of your existing requests from the funding lane.")}</p>
          <Link href="/wallet/funding" className="acct-wal__cta acct-wal__cta--primary">
            {t("Back to funding")}
          </Link>
        </div>
      </div>
    );
  }

  const tone = fundingStatusTone(request.status);
  const label = statusReadable(request.status);
  const confirmed = request.status === "completed" || request.status === "verified";

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet/funding" label={t("Back to funding")} />
      <section className="acct-wal__hero" aria-label={t("Funding request detail")}>
        <div className="acct-wal__hero-inner">
          <div className="acct-wal__hero-row">
            <div>
              <span className="acct-wal__hero-eyebrow">
                <span className="acct-wal__hero-eyebrow-dot" aria-hidden />
                {t("Funding request")}
              </span>
              <p className="acct-wal__hero-label">{t("Reference")}</p>
              <h1
                className="acct-wal__hero-balance"
                style={{ fontSize: "clamp(28px, 3.4vw, 36px)" }}
              >
                {request.reference || request.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="acct-wal__hero-settle" style={{ marginTop: 10 }}>
                ₦{formatKoboMajor(request.amount_kobo)} · {t("created")} {formatCreated(request.created_at)}
              </p>
              <div className="acct-wal__chip-row" style={{ marginTop: 12 }}>
                <span className="acct-wal__chip" data-tone={tone}>
                  {label}
                </span>
                {request.proof_url ? (
                  <span className="acct-wal__chip" data-tone="success">
                    {t("Proof uploaded")}
                  </span>
                ) : (
                  <span className="acct-wal__chip" data-tone="warn">
                    {t("Awaiting proof")}
                  </span>
                )}
              </div>
            </div>
            {request.proof_url ? (
              <a
                href={request.proof_url}
                target="_blank"
                rel="noreferrer"
                className="acct-wal__cta acct-wal__cta--ghost"
              >
                {t("View proof")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="acct-wal__section" aria-labelledby="wal-fund-flow-head">
        <div className="acct-wal__section-head">
          <h2 id="wal-fund-flow-head" className="acct-wal__section-title hc-h3 acct-display">
            {t("Where we are")}
          </h2>
          <span className="acct-wal__section-meta">{t("3 quick steps")}</span>
        </div>
        <FundingStepLadder
          proofUploaded={Boolean(request.proof_url)}
          proofUploadedAtIso={request.proof_uploaded_at || null}
          confirmed={confirmed}
        />
      </section>

      <section className="acct-wal__section" aria-labelledby="wal-fund-rail-head">
        <div className="acct-wal__section-head">
          <h2 id="wal-fund-rail-head" className="acct-wal__section-title hc-h3 acct-display">
            {t("Transfer rail")}
          </h2>
          <span className="acct-wal__section-meta">
            {request.note
              ? request.note
              : t("Tap any value to copy. Then upload your transfer proof.")}
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
