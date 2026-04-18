import Link from "next/link";
import { ArrowRight, Building2, Wallet } from "lucide-react";
import { formatSurfaceTemplate, translateSurfaceLabel } from "@henryco/i18n/server";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getWalletFundingContext } from "@/lib/account-data";
import { formatDateTime, formatNaira } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import FundingRequestForm from "@/components/wallet/FundingRequestForm";
import CopyValueButton from "@/components/ui/CopyValueButton";

export const dynamic = "force-dynamic";

function localizedStatus(
  t: (text: string) => string,
  status: string,
) {
  const statusKey = status.replaceAll("_", " ");
  const translated = t(statusKey);
  return translated === statusKey
    ? statusKey.charAt(0).toUpperCase() + statusKey.slice(1)
    : translated;
}

export default async function WalletFundingPage() {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const user = await requireAccountUser();
  const data = await getWalletFundingContext(user.id);
  const copyLabel = t("Copy");
  const copiedLabel = t("Copied");

  return (
    <div className="space-y-6 acct-fade-in">
      <RouteLiveRefresh />
      <PageHeader
        title={t("Wallet Funding")}
        description={t("Move funds into your HenryCo wallet through a verification-safe bank transfer flow.")}
        icon={Wallet}
        actions={
          <Link href="/wallet" className="acct-button-secondary rounded-2xl">
            {t("Back to wallet")}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
        <div className="acct-card overflow-hidden">
          <div className="bg-[linear-gradient(140deg,#0F172A_0%,#21435B_58%,#C9A227_100%)] px-6 py-7 text-white">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/70">
              {t("Wallet balance")}
            </p>
            <p className="mt-3 text-4xl font-semibold">{formatNaira(data.wallet.balance_kobo)}</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/72">
              {t("Verified balance is ready to spend. Pending funding sits separately until finance clears the transfer.")}
            </p>
          </div>
          <div className="grid gap-3 border-t border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-5 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
              <p className="acct-kicker">{t("Verified")}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {formatNaira(data.wallet.balance_kobo)}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--acct-surface)] p-4">
              <p className="acct-kicker">{t("Pending verification")}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">
                {formatNaira(data.pending_kobo)}
              </p>
            </div>
          </div>
        </div>

        <div className="acct-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
              <Building2 size={18} />
            </div>
            <div>
              <p className="acct-kicker">{t("Transfer details")}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("HenryCo finance account")}</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Bank")}</p>
                {data.rail.bankName ? (
                  <CopyValueButton value={data.rail.bankName} label={copyLabel} copiedLabel={copiedLabel} />
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{t(data.rail.bankName || "Pending")}</p>
            </div>
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Account name")}</p>
                {data.rail.accountName ? (
                  <CopyValueButton value={data.rail.accountName} label={copyLabel} copiedLabel={copiedLabel} />
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{t(data.rail.accountName || "Pending")}</p>
            </div>
            <div className="rounded-2xl bg-[var(--acct-surface)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">{t("Account number")}</p>
                {data.rail.accountNumber ? (
                  <CopyValueButton value={data.rail.accountNumber} label={copyLabel} copiedLabel={copiedLabel} />
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold tracking-[0.12em] text-[var(--acct-ink)]">
                {data.rail.accountNumber || t("Pending")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <FundingRequestForm />

      <section className="acct-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="acct-kicker">{t("Recent funding requests")}</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{t("Recent requests")}</h2>
          </div>
        </div>

        {data.requests.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--acct-line)] bg-[var(--acct-bg)] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("No funding requests yet")}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--acct-muted)]">
              {t("The requests you create here will show proof status, reference, and finance verification state.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.requests.map((request) => (
              <Link
                key={request.id}
                href={`/wallet/funding/${request.id}`}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-5 py-4 transition hover:border-[var(--acct-gold)]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="acct-chip acct-chip-blue text-[0.6rem]">
                      {localizedStatus(t, request.status)}
                    </span>
                    {request.proof_url ? (
                      <span className="acct-chip acct-chip-green text-[0.6rem]">{t("Proof uploaded")}</span>
                    ) : (
                      <span className="acct-chip acct-chip-orange text-[0.6rem]">{t("Awaiting proof")}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--acct-ink)]">
                    {formatNaira(request.amount_kobo)} · {request.reference || request.id}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--acct-muted)]">
                    {formatSurfaceTemplate(t("Created {date}"), {
                      date: formatDateTime(request.created_at, locale),
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--acct-gold)]">
                  {t("Open request")} <ArrowRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
