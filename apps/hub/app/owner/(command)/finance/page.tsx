import Link from "next/link";
import { RouteLiveRefresh } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { logger } from "@henryco/observability/logger";
import { COMPANY } from "@henryco/config";
import { requireOwner } from "@/lib/owner-auth";
import StatusBadge from "@/components/owner/StatusBadge";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import FinanceLedgerConsole from "@/components/owner/finance/FinanceLedgerConsole";
import { getFinanceLedgerSnapshot } from "@/lib/finance-ledger";
import { getFinanceCenterData } from "@/lib/owner-data";
import { formatCurrencyAmount, formatDateTime } from "@/lib/format";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function FinanceCenterPage() {
  // Defense in depth on a money surface: the (command) layout already gates all
  // children, but the finance reads bypass RLS (service-role / direct-pg), so the
  // page re-asserts owner-only access. requireOwner redirects a non-owner — this
  // surface can never become customer-reachable.
  const owner = await requireOwner();
  const [snapshot, ops, locale] = await Promise.all([
    getFinanceLedgerSnapshot(),
    getFinanceCenterData(),
    getHubPublicLocale(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // Audit on read (a money surface): record that the owner observed it.
  try {
    logger
      .child({ module: "hub.owner-command.finance" })
      .info("henry.finance.dashboard.viewed", {
        ownerId: owner.id,
        ledgerStatus: snapshot.ok ? "live" : snapshot.reason,
      });
  } catch {
    /* never let telemetry break the surface */
  }

  return (
    <div className="space-y-6 acct-fade-in">
      {/* 30s cadence (not 12s): the ledger snapshot is cached ~60s, so a tighter
          refresh would only re-hit the operational reads — STAB-01 awareness. */}
      <RouteLiveRefresh intervalMs={30000} />

      <OwnerPageHeader
        eyebrow={`${COMPANY.group.name} · ${t("Finance")}`}
        title={t("Watch the money reconcile, live")}
        description={t(
          "A first-party, read-only window onto the double-entry ledger: reconciliation health, every account balance, payment flow, stuck intents, and recent transactions — observed from webhook truth, never set by this surface.",
        )}
        actions={
          <>
            <Link href="/owner/finance/revenue" className="acct-button-secondary">
              {t("Revenue view")}
            </Link>
            <Link href="/owner/finance/invoices" className="acct-button-secondary">
              {t("Invoices")}
            </Link>
            <Link href="/owner/finance/expenses" className="acct-button-secondary">
              {t("Expenses")}
            </Link>
          </>
        }
      />

      {/* ── The ledger money console (V3-22) ── */}
      <FinanceLedgerConsole snapshot={snapshot} t={t} />

      {/* ── Operational review (pre-ledger queues kept from the prior center) ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel
          title={t("Wallet funding review lane")}
          description={t("Bank-transfer funding requests that still need proof verification before customer balances are released.")}
        >
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Reference")}</th>
                  <th>{t("Status")}</th>
                  <th className="text-right">{t("Amount")}</th>
                  <th>{t("Created")}</th>
                </tr>
              </thead>
              <tbody>
                {ops.pendingWalletFundingRequests.length ? (
                  ops.pendingWalletFundingRequests.map((request) => (
                    <tr key={String(request.id)}>
                      <td>{String(request.payment_reference || request.id || t("Funding request"))}</td>
                      <td>
                        <StatusBadge status={String(request.status || "pending_verification")} />
                      </td>
                      <td className="text-right tabular-nums">
                        {formatCurrencyAmount(Number(request.amount_kobo || 0), "NGN", { unit: "kobo" })}
                      </td>
                      <td>{formatDateTime(String(request.created_at || new Date().toISOString()))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-sm text-[var(--acct-muted)]">
                      {t("No wallet funding requests are waiting for review.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </OwnerPanel>

        <OwnerPanel
          title={t("Wallet withdrawal lane")}
          description={t("Withdrawal requests that finance still needs to approve, reject, or complete with payout evidence.")}
        >
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Request")}</th>
                  <th>{t("Status")}</th>
                  <th className="text-right">{t("Amount")}</th>
                  <th>{t("Created")}</th>
                </tr>
              </thead>
              <tbody>
                {ops.pendingWalletWithdrawals.length ? (
                  ops.pendingWalletWithdrawals.map((request) => (
                    <tr key={String(request.id)}>
                      <td>{String(request.payout_reference || request.id || t("Withdrawal request"))}</td>
                      <td>
                        <StatusBadge status={String(request.status || "pending_review")} />
                      </td>
                      <td className="text-right tabular-nums">
                        {formatCurrencyAmount(Number(request.amount_kobo || 0), "NGN", { unit: "kobo" })}
                      </td>
                      <td>{formatDateTime(String(request.created_at || new Date().toISOString()))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-sm text-[var(--acct-muted)]">
                      {t("No wallet withdrawals are waiting for payout review.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </OwnerPanel>
      </div>

      {ops.alerts.length ? (
        <OwnerPanel
          title={t("Finance alerts")}
          description={t("Backlog, payout, and delivery issues affecting money movement.")}
        >
          <div className="space-y-3">
            {ops.alerts.map((signal) => (
              <div
                key={signal.id}
                className="rounded-[var(--acct-radius)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3"
              >
                <div className="text-sm font-semibold text-[var(--acct-ink)]">{signal.title}</div>
                <p className="mt-2 text-sm text-[var(--acct-muted)]">{signal.body}</p>
              </div>
            ))}
          </div>
        </OwnerPanel>
      ) : null}
    </div>
  );
}
