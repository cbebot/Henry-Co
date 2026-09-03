import Link from "next/link";
import { Wallet, Scale, TrendingUp, CircleAlert } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { getFinanceLedgerSnapshot } from "@/lib/finance-ledger";
import { getDivisionRevenueSnapshot } from "@/lib/owner-command/division-revenue";
import { formatCurrencyAmount } from "@/lib/format";
import Sparkline from "@/components/owner/finance/Sparkline";
import { OwnerNotice } from "@/components/owner/OwnerPrimitives";

/**
 * OwnerMoneyStrip — the ledger-true money band at the top of the command home
 * (OCC-3b, spec §2). The old overview surfaced one "Recognized revenue" number
 * summed as naira floats over an 80-row sample; this reads the double-entry
 * ledger and the payment spine instead — kobo-exact, with the reconciliation
 * state shown rather than assumed. Both underlying reads are cache+timeout+typed
 * sentinel, so this degrades to an honest notice instead of inventing zeros.
 */
export default async function OwnerMoneyStrip({ locale }: { locale: AppLocale }) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [ledger, revenue] = await Promise.all([
    getFinanceLedgerSnapshot(),
    getDivisionRevenueSnapshot(),
  ]);

  if (!ledger.ok) {
    return (
      <OwnerNotice
        tone="warning"
        title={t("Money view is unavailable right now")}
        body={t(
          "The ledger read did not complete on this load. The money itself is unaffected — open the finance console for the source of truth.",
        )}
      />
    );
  }

  const kobo = (minor: number) => formatCurrencyAmount(minor, "NGN", { unit: "kobo" });
  const settled30d = revenue.ok ? revenue.spine.totalLast30dMinor : ledger.stats.succeededVolumeMinor;
  const pendingCount = ledger.stats.pendingCount;
  const stuckCount = ledger.stuck.length;
  const balanced = ledger.reconciliation.balanced;
  const walletReconciled = ledger.wallet.reconciled;

  return (
    <section
      className="acct-card p-5 sm:p-6"
      aria-label={t("Money — ledger true")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="acct-kicker text-[var(--owner-accent)]">{t("Money · ledger-true")}</p>
          <h2 className="acct-display mt-1 text-lg font-semibold text-[var(--acct-ink)]">
            {t("Settled through the payment engine")}
          </h2>
        </div>
        <Link href="/owner/finance" className="acct-button-ghost">
          {t("Open the ledger console")}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
          <div className="flex items-center gap-2 text-[var(--acct-muted)]">
            <TrendingUp className="h-4 w-4" aria-hidden />
            <span className="acct-kicker">{t("Settled, last 30 days")}</span>
          </div>
          <p className="acct-display mt-2 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">
            {kobo(settled30d)}
          </p>
          {revenue.ok ? (
            <div className="mt-2">
              <Sparkline
                points={ledger.flow}
                width={200}
                height={32}
                accent="var(--acct-gold)"
                ariaLabel={t("30-day settled volume trend")}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
          <div className="flex items-center gap-2 text-[var(--acct-muted)]">
            <Wallet className="h-4 w-4" aria-hidden />
            <span className="acct-kicker">{t("Customer wallet liability")}</span>
          </div>
          <p className="acct-display mt-2 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">
            {kobo(ledger.wallet.ledgerWalletLiabilityKobo)}
          </p>
          <p className={`mt-2 text-xs font-semibold ${walletReconciled ? "text-[var(--acct-green-text)]" : "text-[var(--acct-orange-text)]"}`}>
            {walletReconciled
              ? t("Reconciled with wallet balances")
              : `${t("Off by")} ${kobo(Math.abs(ledger.wallet.deltaKobo))}`}
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
          <div className="flex items-center gap-2 text-[var(--acct-muted)]">
            <Scale className="h-4 w-4" aria-hidden />
            <span className="acct-kicker">{t("Double-entry ledger")}</span>
          </div>
          <p className={`acct-display mt-2 text-2xl font-semibold ${balanced ? "text-[var(--acct-green-text)]" : "text-[var(--acct-red-text)]"}`}>
            {balanced ? t("Balanced") : t("Out of balance")}
          </p>
          <p className="mt-2 text-xs text-[var(--acct-muted)]">
            {balanced
              ? t("Debits equal credits across all accounts")
              : `${t("Delta")} ${kobo(Math.abs(ledger.reconciliation.deltaMinor))}`}
          </p>
        </div>

        <Link
          href="/owner/finance"
          className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4 transition-all hover:border-[var(--owner-accent)]/30 hover:shadow-[var(--acct-shadow)]"
        >
          <div className="flex items-center gap-2 text-[var(--acct-muted)]">
            <CircleAlert className="h-4 w-4" aria-hidden />
            <span className="acct-kicker">{t("Money in motion")}</span>
          </div>
          <p className="acct-display mt-2 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">
            {pendingCount}
          </p>
          <p className={`mt-2 text-xs font-semibold ${stuckCount > 0 ? "text-[var(--acct-orange-text)]" : "text-[var(--acct-muted)]"}`}>
            {stuckCount > 0
              ? `${stuckCount} ${t("stuck past the threshold — review")}`
              : t("Pending and processing intents")}
          </p>
        </Link>
      </div>
    </section>
  );
}
