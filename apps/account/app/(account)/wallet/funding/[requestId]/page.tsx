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
import { AccountDetailsCard } from "@/components/wallet/AccountDetailsCard";
import { BackNav } from "@/components/wallet/BackNav";
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
            blurb={`₦${formatKoboMajor(request.amount_kobo)} · ${t("created")} ${formatCreated(request.created_at)} · ${label}`}
          />
        }
        sections={[
          {
            id: "wal-fund-flow",
            title: t("Payment status"),
            meta: confirmed ? t("Confirmed") : t("Live rail review"),
            content: (
              <div className="acct-card p-5">
                <div className="acct-wal__chip-row">
                  <span className="acct-wal__chip" data-tone={tone}>
                    {label}
                  </span>
                  <span className="acct-wal__chip" data-tone={confirmed ? "success" : "active"}>
                    {confirmed ? t("Balance confirmed") : t("Reference in review")}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
                    <p className="acct-kicker">{t("Amount")}</p>
                    <p className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
                      ₦{formatKoboMajor(request.amount_kobo)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
                    <p className="acct-kicker">{t("Reference")}</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[var(--acct-ink)]">
                      {refDisplay}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
                    <p className="acct-kicker">{t("Provider")}</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-[var(--acct-ink)]">
                      {request.provider.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--acct-muted)]">
                  {confirmed
                    ? t("This funding request has cleared and is reflected in your wallet balance.")
                    : t("Keep the generated reference intact. The live payment rail or finance review will update this request when the money is confirmed.")}
                </p>
              </div>
            ),
          },
          {
            id: "wal-fund-rail-detail",
            title: t("Transfer rail"),
            meta: request.note
              ? request.note
              : t("Tap any value to copy. Keep the reference intact for reconciliation."),
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
                <div className="acct-card p-5">
                  <p className="acct-kicker">{t("Funding reference")}</p>
                  <p className="mt-3 break-all text-lg font-semibold text-[var(--acct-ink)]">
                    {refDisplay}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">
                    {request.instructions ||
                      t("Use this exact reference when paying so the rail can match the transfer to your account automatically.")}
                  </p>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
