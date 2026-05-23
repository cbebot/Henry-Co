import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";

import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getAccountAppLocale } from "@/lib/locale-server";
import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingRequestById } from "@/lib/account-data";
import {
  HeroCard,
  EmptyStateCard,
  DivisionLanding,
} from "@henryco/dashboard-shell/surfaces";

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

/**
 * Wallet · Funding request detail.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2F). Compact HeroCard with parent
 * breadcrumb + back link + the request's reference as the headline.
 */
export default async function WalletFundingRequestPage({ params }: Props) {
  const { requestId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const request = await getWalletFundingRequestById(user.id, requestId);

  if (!request) {
    return (
      <div className="acct-wal acct-fade-in">
        <BackNav href="/wallet/funding" label={t("Back to funding")} />
        <EmptyStateCard
          kicker={t("Funding · not found")}
          title={t("Funding request not found.")}
          body={t("Open one of your existing requests from the funding lane.")}
          cta={{ label: t("Back to funding"), href: "/wallet/funding" }}
        />
      </div>
    );
  }

  const tone = fundingStatusTone(request.status);
  const label = statusReadable(request.status);
  const confirmed = request.status === "completed" || request.status === "verified";
  const refDisplay = request.reference || request.id.slice(0, 8).toUpperCase();
  const heroTone: "calm" | "active" | "attention" =
    tone === "danger"
      ? "attention"
      : tone === "success"
        ? "calm"
        : "active";

  return (
    <div className="acct-wal acct-fade-in">
      <RouteLiveRefresh />
      <BackNav href="/wallet/funding" label={t("Back to funding")} />
      <DivisionLanding
        hero={
          <HeroCard
            variant="compact"
            tone={heroTone}
            eyebrow={`${t("Wallet")} · ${t("Funding request")}`}
            headline={refDisplay}
            blurb={`₦${formatKoboMajor(request.amount_kobo)} · ${t("created")} ${formatCreated(request.created_at)} · ${label}${request.proof_url ? ` · ${t("Proof uploaded")}` : ` · ${t("Awaiting proof")}`}`}
          />
        }
        sections={[
          {
            id: "wal-fund-flow",
            title: t("Where we are"),
            meta: t("3 quick steps"),
            content: (
              <>
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
                    className="acct-wal__cta acct-wal__cta--ghost"
                    style={{ marginTop: 16 }}
                  >
                    {t("View proof")}
                  </Link>
                ) : null}
              </>
            ),
          },
          {
            id: "wal-fund-rail-detail",
            title: t("Transfer rail"),
            meta: request.note
              ? request.note
              : t("Tap any value to copy. Then upload your transfer proof."),
            content: (
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
            ),
          },
        ]}
      />
    </div>
  );
}
