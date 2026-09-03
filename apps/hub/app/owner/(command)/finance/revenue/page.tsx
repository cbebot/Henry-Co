import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import DivisionBadge from "@/components/owner/DivisionBadge";
import Sparkline from "@/components/owner/finance/Sparkline";
import { getDivisionRevenueSnapshot } from "@/lib/owner-command/division-revenue";
import { divisionLabel, formatCurrencyAmount } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/**
 * OCC-3 rebuild. The old page rendered one two-column table that silently
 * mixed three legacy tables with the ledger absent entirely, and showed every
 * unwired division as ₦0-as-if-measured. This page shows the two ledgers the
 * company actually has, each labeled, and says "not yet measured" where that
 * is the truth.
 */
export default async function FinanceRevenuePage() {
  const locale = await getHubPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const snapshot = await getDivisionRevenueSnapshot();

  const kobo = (minor: number) => formatCurrencyAmount(minor, "NGN", { unit: "kobo" });

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Finance")}
        title={t("Revenue by division")}
        description={t(
          "Two ledgers, clearly separated: provider-confirmed money through the payment spine, and what each division's own book records from before the spine existed.",
        )}
        actions={
          <Link href="/owner/finance" className="acct-button-secondary">
            {t("Open the ledger console")}
          </Link>
        }
      />

      {!snapshot.ok ? (
        <OwnerNotice
          tone="warning"
          title={t("Revenue is unavailable right now")}
          body={t(
            "The revenue read did not complete. Nothing is wrong with the money itself — the ledger console holds the source of truth. Refresh to retry.",
          )}
        />
      ) : (
        <>
          {/* ── Ledger 1: the payment spine (provider-confirmed) ── */}
          <OwnerPanel
            title={t("Payment spine — provider-confirmed")}
            description={t(
              "Money that settled through the payment engine, in kobo-exact integers. Same succeeded-volume semantics as the ledger console.",
            )}
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <p className="acct-kicker">{t("Settled, all time")}</p>
                <p className="acct-display mt-1 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">
                  {kobo(snapshot.spine.totalSucceededMinor)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
                <p className="acct-kicker">{t("Settled, last 30 days")}</p>
                <p className="acct-display mt-1 text-2xl font-semibold tabular-nums text-[var(--acct-ink)]">
                  {kobo(snapshot.spine.totalLast30dMinor)}
                </p>
              </div>
            </div>

            {snapshot.spine.divisions.length === 0 ? (
              <div className="acct-empty">
                <p>{t("No settled payments on the spine yet. The first card or wallet charge will appear here.")}</p>
              </div>
            ) : (
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>{t("Division")}</th>
                    <th>{t("All time")}</th>
                    <th>{t("Last 30 days")}</th>
                    <th>{t("Last 7 days")}</th>
                    <th className="hidden lg:table-cell">{t("30-day trend")}</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.spine.divisions.map((row) => (
                    <tr key={row.division}>
                      <td>
                        <div className="flex items-center gap-3">
                          <DivisionBadge division={row.division} />
                          <span>{divisionLabel(row.division)}</span>
                        </div>
                      </td>
                      <td className="tabular-nums">{kobo(row.succeededMinor)}</td>
                      <td className="tabular-nums">{kobo(row.last30dMinor)}</td>
                      <td className="tabular-nums">{kobo(row.last7dMinor)}</td>
                      <td className="hidden lg:table-cell">
                        <Sparkline
                          points={row.series.map((p) => ({ day: p.date, succeeded: 0, volumeMinor: p.volumeMinor }))}
                          width={220}
                          height={36}
                          accent="var(--acct-gold)"
                          ariaLabel={`${divisionLabel(row.division)} — ${t("30-day trend")}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {snapshot.spine.scanCapped ? (
              <p className="mt-3 text-xs text-[var(--acct-muted)]">
                {t("Totals cover the most recent 5,000 payment intents; the ledger console reconciles the full history.")}
              </p>
            ) : null}
          </OwnerPanel>

          {/* ── Ledger 2: the division books (recorded) ── */}
          <OwnerPanel
            title={t("Division books — recorded")}
            description={t(
              "What each division's own records show as collected, including the years before the payment spine. Kept separate so the two truths never blend.",
            )}
          >
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Division")}</th>
                  <th>{t("Recorded")}</th>
                  <th>{t("Entries")}</th>
                  <th className="hidden sm:table-cell">{t("Source")}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recorded.map((row) => (
                  <tr key={row.division}>
                    <td>
                      <div className="flex items-center gap-3">
                        <DivisionBadge division={row.division} />
                        <span>{divisionLabel(row.division)}</span>
                      </div>
                    </td>
                    <td className="tabular-nums">{kobo(row.recordedMinor)}</td>
                    <td className="tabular-nums">{row.rowCount.toLocaleString()}</td>
                    <td className="hidden font-mono text-xs text-[var(--acct-muted)] sm:table-cell">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {snapshot.recorded.some((row) => row.capped) ? (
              <p className="mt-3 text-xs text-[var(--acct-muted)]">
                {t("A division book passed 5,000 entries; its total covers the first 5,000 and undercounts the rest.")}
              </p>
            ) : null}
          </OwnerPanel>

          {/* ── Honesty block: what is NOT measured ── */}
          {snapshot.unmeasured.length > 0 ? (
            <OwnerPanel
              title={t("Not yet measured")}
              description={t(
                "These divisions have no money model wired to either ledger. They are listed here instead of showing a zero that looks measured.",
              )}
            >
              <div className="flex flex-wrap gap-2">
                {snapshot.unmeasured.map((slug) => (
                  <span key={slug} className="inline-flex items-center gap-2 rounded-full border border-[var(--acct-line)] px-3 py-1.5 text-sm text-[var(--acct-muted)]">
                    <DivisionBadge division={slug} />
                    {t("no money model yet")}
                  </span>
                ))}
              </div>
            </OwnerPanel>
          ) : null}
        </>
      )}
    </div>
  );
}
