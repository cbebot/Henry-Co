import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownUp,
  Banknote,
  CalendarRange,
  CheckCircle2,
  Coins,
  Landmark,
  Receipt,
  Scale,
  TrendingUp,
  Undo2,
  Wallet,
} from "lucide-react";
import MetricCard from "@/components/owner/MetricCard";
import MetricTraceDrawer from "@/components/owner/MetricTraceDrawer";
import StatusBadge from "@/components/owner/StatusBadge";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPanel, OwnerNotice } from "@/components/owner/OwnerPrimitives";
import Sparkline from "./Sparkline";
import { formatCurrencyAmount, formatCompactNumber, formatDateTime, timeAgo } from "@/lib/format";
import type { FinanceLedgerSnapshot, LedgerAccountBalance } from "@/lib/finance-ledger";

type Translate = (text: string) => string;

const money = (minor: number) => formatCurrencyAmount(minor, "NGN", { unit: "kobo" });

function balance(accounts: LedgerAccountBalance[], code: string): number {
  return accounts.find((a) => a.code === code)?.balanceMinor ?? 0;
}

const ACCOUNT_META: Record<string, { label: string; icon: LucideIcon }> = {
  cash_settlement: { label: "Cash settled", icon: Banknote },
  payments_clearing: { label: "Payments clearing", icon: ArrowDownUp },
  customer_wallet_liability: { label: "Wallet liability", icon: Wallet },
  platform_revenue: { label: "Platform revenue", icon: TrendingUp },
  processor_fees: { label: "Processor fees", icon: Receipt },
  refunds: { label: "Refunds issued", icon: Undo2 },
  vat_output_payable: { label: "Output VAT payable", icon: Landmark },
  fee_vat_recoverable: { label: "Input VAT recoverable", icon: Coins },
};

const ACCOUNT_TYPE_CHIP: Record<string, string> = {
  asset: "acct-chip-blue",
  liability: "acct-chip-purple",
  revenue: "acct-chip-green",
  expense: "acct-chip-orange",
  equity: "acct-chip-gold",
};

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function ageLabel(minutes: number, t: Translate): string {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}${t("d")}`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}${t("h")}`;
  return `${minutes}${t("m")}`;
}

/** "2026-06" → "Jun 2026" (UTC month key, no day to avoid TZ drift). */
function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export default function FinanceLedgerConsole({
  snapshot,
  t,
}: {
  snapshot: FinanceLedgerSnapshot;
  t: Translate;
}) {
  if (!snapshot.ok) {
    return snapshot.reason === "not_configured" ? (
      <OwnerNotice
        tone="warning"
        title={t("Live ledger not connected to this surface yet")}
        body={t(
          "The double-entry money spine is read over a dedicated database connection that is not configured for this deployment. No figures are shown rather than invented zeros. Once the finance database URL is set for the hub, reconciliation appears here automatically.",
        )}
      />
    ) : (
      <OwnerNotice
        tone="critical"
        title={t("Live ledger read is slow or unavailable right now")}
        body={t(
          "Showing nothing rather than a stale or guessed figure for the money surface. This refreshes on its own — if it persists, the finance database may be saturated or unreachable.",
        )}
      />
    );
  }

  const { reconciliation: r, wallet, vat, monthlyVat, stats, stuck, recent, flow } = snapshot;
  const balanced = r.balanced && r.deltaMinor === 0;
  const walletReconciled = wallet.reconciled && wallet.deltaKobo === 0;

  const flowVolume = flow.reduce((acc, p) => acc + p.volumeMinor, 0);
  const flowSucceeded = flow.reduce((acc, p) => acc + p.succeeded, 0);

  const tiles: Array<{ code?: string; label: string; value: number; icon: LucideIcon; tint: string; traceId: string }> = [
    { code: "cash_settlement", label: "Cash settled", value: balance(r.accounts, "cash_settlement"), icon: Banknote, tint: "var(--acct-green)", traceId: "finance.reconciliation" },
    { code: "platform_revenue", label: "Platform revenue", value: balance(r.accounts, "platform_revenue"), icon: TrendingUp, tint: "var(--acct-green)", traceId: "finance.reconciliation" },
    { code: "processor_fees", label: "Processor fees", value: balance(r.accounts, "processor_fees"), icon: Receipt, tint: "var(--acct-orange)", traceId: "finance.reconciliation" },
    { code: "fee_vat_recoverable", label: "Input VAT recoverable", value: balance(r.accounts, "fee_vat_recoverable"), icon: Coins, tint: "var(--acct-blue)", traceId: "finance.reconciliation" },
    { label: "Net VAT payable (YTD)", value: vat.netVatPayableMinor, icon: Scale, tint: "var(--acct-purple)", traceId: "finance.vat" },
    { code: "vat_output_payable", label: "Output VAT payable", value: balance(r.accounts, "vat_output_payable"), icon: Landmark, tint: "var(--acct-purple)", traceId: "finance.reconciliation" },
    { code: "customer_wallet_liability", label: "Wallet liability", value: balance(r.accounts, "customer_wallet_liability"), icon: Wallet, tint: "var(--acct-blue)", traceId: "finance.reconciliation" },
    { code: "payments_clearing", label: "Clearing (unallocated)", value: balance(r.accounts, "payments_clearing"), icon: ArrowDownUp, tint: "var(--owner-accent)", traceId: "finance.reconciliation" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Reconciliation health — the headline ── */}
      <section className="acct-card relative overflow-hidden p-6 sm:p-7">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: balanced ? "var(--acct-green)" : "var(--acct-red)" }}
        />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className={`acct-chip ${balanced ? "acct-chip-green" : "acct-chip-red"} gap-1.5`}>
                {balanced ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {balanced ? t("Ledger balanced") : t("Out of balance")}
              </span>
              <MetricTraceDrawer traceId="finance.reconciliation" label={t("Reconciliation")} triggerLabel={t("View query")} />
            </div>
            <p
              className="acct-display mt-4 text-4xl font-semibold tracking-[-0.03em]"
              style={{ color: balanced ? "var(--acct-ink)" : "var(--acct-red)" }}
            >
              {t("Δ")} {money(r.deltaMinor)}
            </p>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">
              {balanced
                ? t("Every debit is matched by a credit — the books reconcile to the kobo.")
                : t("Debits and credits disagree — investigate before trusting downstream figures.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span className="text-[var(--acct-muted)]">
                {t("Total debits")} <span className="font-semibold text-[var(--acct-ink)]">{money(r.totalDebitMinor)}</span>
              </span>
              <span className="text-[var(--acct-muted)]">
                {t("Total credits")} <span className="font-semibold text-[var(--acct-ink)]">{money(r.totalCreditMinor)}</span>
              </span>
            </div>
          </div>

          <div className="rounded-[var(--acct-radius-lg)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
            <div className="flex items-center justify-between">
              <p className="acct-kicker">{t("Wallet projection")}</p>
              <span className={`acct-chip ${walletReconciled ? "acct-chip-green" : "acct-chip-red"} gap-1.5`}>
                {walletReconciled ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {walletReconciled ? t("Reconciled") : t("Drift")}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--acct-muted)]">
              {t("Wallet balances")}{" "}
              <span className="font-semibold text-[var(--acct-ink)]">{money(wallet.walletBalanceTotalKobo)}</span>
            </p>
            <p className="mt-1 text-sm text-[var(--acct-muted)]">
              {t("Ledger liability")}{" "}
              <span className="font-semibold text-[var(--acct-ink)]">{money(wallet.ledgerWalletLiabilityKobo)}</span>
            </p>
            {!walletReconciled ? (
              <p className="mt-2 text-sm font-semibold text-[var(--acct-red)]">
                {t("Δ")} {money(wallet.deltaKobo)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Money flow — ledger account balances as tiles ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <MetricCard
            key={tile.label}
            label={t(tile.label)}
            value={money(tile.value)}
            icon={tile.icon}
            color={tile.tint}
            traceId={tile.traceId}
            traceLabel={t(tile.label)}
          />
        ))}
      </div>

      {/* ── Payment activity — counts + 30-day volume ── */}
      <OwnerPanel
        title={t("Payment activity")}
        description={t("Intent outcomes across the whole money rail, with settled volume over the last 30 days.")}
        action={<MetricTraceDrawer traceId="finance.intents" label={t("Payment activity")} triggerLabel={t("View query")} />}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <ActivityStat label={t("Succeeded")} value={stats.succeededCount} tone="good" />
          <ActivityStat label={t("In-flight")} value={stats.pendingCount} tone={stats.pendingCount > 0 ? "warning" : "muted"} />
          <ActivityStat label={t("Failed")} value={stats.failedCount} tone={stats.failedCount > 0 ? "critical" : "muted"} />
          <ActivityStat label={t("Refunds")} value={stats.refundCount} tone="muted" />
        </div>
        <div className="mt-5 rounded-[var(--acct-radius-lg)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="acct-kicker">{t("Settled volume · 30 days")}</p>
              <p className="acct-display mt-1 text-2xl font-semibold text-[var(--acct-ink)]">{money(flowVolume)}</p>
            </div>
            <p className="text-sm text-[var(--acct-muted)]">
              {formatCompactNumber(flowSucceeded)} {t("settled")}
            </p>
          </div>
          <div className="mt-3">
            <Sparkline points={flow} ariaLabel={t("Settled payment volume over the last 30 days")} />
          </div>
        </div>
      </OwnerPanel>

      {/* ── The ledger — 8 chart-of-accounts balances ── */}
      <OwnerPanel
        title={t("The ledger")}
        description={t("Every account in the double-entry chart, balanced by construction.")}
        action={<MetricTraceDrawer traceId="finance.accounts" label={t("Chart of accounts")} triggerLabel={t("View query")} />}
      >
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Account")}</th>
                <th>{t("Type")}</th>
                <th className="text-right">{t("Debits")}</th>
                <th className="text-right">{t("Credits")}</th>
                <th className="text-right">{t("Balance")}</th>
              </tr>
            </thead>
            <tbody>
              {r.accounts.length ? (
                r.accounts.map((a) => {
                  const meta = ACCOUNT_META[a.code];
                  const Icon = meta?.icon;
                  return (
                    <tr key={a.code}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {Icon ? <Icon size={16} className="text-[var(--acct-muted)]" /> : null}
                          <span className="font-semibold text-[var(--acct-ink)]">{t(meta?.label ?? a.code)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`acct-chip ${ACCOUNT_TYPE_CHIP[a.type] ?? "acct-chip-purple"}`}>{t(a.type)}</span>
                      </td>
                      <td className="text-right tabular-nums text-[var(--acct-muted)]">{money(a.debitMinor)}</td>
                      <td className="text-right tabular-nums text-[var(--acct-muted)]">{money(a.creditMinor)}</td>
                      <td className="text-right font-semibold tabular-nums text-[var(--acct-ink)]">{money(a.balanceMinor)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--acct-muted)]">
                    {t("No ledger entries have been posted yet.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OwnerPanel>

      {/* ── Monthly net-VAT — the filing view (output − input = net payable) ── */}
      <OwnerPanel
        title={t("Monthly net-VAT")}
        description={t(
          "Output VAT collected on sales less input/fee VAT recoverable, per calendar month — net VAT payable for that month's filing. Read-only from the ledger; this surface never sets a figure.",
        )}
        action={<MetricTraceDrawer traceId="finance.vat_monthly" label={t("Monthly net-VAT")} triggerLabel={t("View query")} />}
      >
        {monthlyVat.length ? (
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Month")}</th>
                  <th className="text-right">{t("Output VAT")}</th>
                  <th className="text-right">{t("Input / fee VAT")}</th>
                  <th className="text-right">{t("Net VAT payable")}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyVat.map((m) => {
                  const reclaim = m.netVatPayableMinor < 0; // input exceeds output → reclaim, not payable
                  return (
                    <tr key={m.month}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <CalendarRange size={16} className="text-[var(--acct-muted)]" />
                          <span className="font-semibold text-[var(--acct-ink)]">{monthLabel(m.month)}</span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums text-[var(--acct-muted)]">
                        {money(m.outputVatCollectedMinor)}
                      </td>
                      <td className="text-right tabular-nums text-[var(--acct-muted)]">
                        {money(m.inputVatRecoverableMinor)}
                      </td>
                      <td
                        className="text-right font-semibold tabular-nums"
                        style={{ color: reclaim ? "var(--acct-green)" : "var(--acct-ink)" }}
                        title={reclaim ? t("Input VAT exceeds output — net reclaimable this month") : undefined}
                      >
                        {money(m.netVatPayableMinor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <OwnerNotice
            tone="info"
            title={t("No VAT postings yet")}
            body={t("Once sales settle and fee VAT is recognised on the ledger, each month's net VAT payable appears here for filing.")}
          />
        )}
      </OwnerPanel>

      {/* ── Stuck intents — the owner must see these without asking anyone ── */}
      <OwnerPanel
        title={t("Stuck payment intents")}
        description={`${t("In-flight beyond")} ${snapshot.stuckThresholdMinutes} ${t("minutes — pending or processing with no resolution.")}`}
        action={<MetricTraceDrawer traceId="finance.stuck" label={t("Stuck intents")} triggerLabel={t("View query")} />}
      >
        {stuck.length ? (
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Intent")}</th>
                  <th>{t("Division")}</th>
                  <th>{t("Status")}</th>
                  <th className="text-right">{t("Amount")}</th>
                  <th className="text-right">{t("Age")}</th>
                  <th>{t("Created")}</th>
                </tr>
              </thead>
              <tbody>
                {stuck.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-[var(--acct-muted)]">{shortId(s.id)}</td>
                    <td>{s.division ? <DivisionBadge division={s.division} /> : <span className="text-[var(--acct-muted)]">—</span>}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-right tabular-nums">{money(s.amountMinor)}</td>
                    <td className="text-right font-semibold text-[var(--acct-orange)]">{ageLabel(s.ageMinutes, t)}</td>
                    <td className="text-[var(--acct-muted)]">{formatDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <OwnerNotice
            tone="good"
            title={t("Nothing stuck")}
            body={`${t("Every payment intent has resolved past the")} ${snapshot.stuckThresholdMinutes}${t("-minute mark. No pending or processing intents are stranded.")}`}
          />
        )}
      </OwnerPanel>

      {/* ── Recent transactions — read-only, links to receipt / credit note ── */}
      <OwnerPanel
        title={t("Recent transactions")}
        description={t("The latest payment intents, settlement state, and their issued documents.")}
        action={<MetricTraceDrawer traceId="finance.recent" label={t("Recent transactions")} triggerLabel={t("View query")} />}
      >
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("When")}</th>
                <th>{t("Division")}</th>
                <th>{t("Status")}</th>
                <th>{t("Provider")}</th>
                <th className="text-right">{t("Amount")}</th>
                <th>{t("Settled")}</th>
                <th>{t("Document")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length ? (
                recent.map((tx) => (
                  <tr key={tx.id}>
                    <td className="whitespace-nowrap text-[var(--acct-muted)]" title={formatDateTime(tx.createdAt)}>
                      {timeAgo(tx.createdAt)}
                    </td>
                    <td>{tx.division ? <DivisionBadge division={tx.division} /> : <span className="text-[var(--acct-muted)]">—</span>}</td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="capitalize text-[var(--acct-ink)]">{tx.provider ?? <span className="text-[var(--acct-muted)]">—</span>}</td>
                    <td className="text-right font-semibold tabular-nums">{money(tx.amountMinor)}</td>
                    <td>
                      {tx.settled ? (
                        <span className="acct-chip acct-chip-green gap-1">
                          <CheckCircle2 size={12} /> {t("Settled")}
                        </span>
                      ) : (
                        <span className="text-[var(--acct-muted)]">{t("Unsettled")}</span>
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {tx.creditNoteNo ? (
                        <span className="text-[var(--acct-purple)]">{tx.creditNoteNo}</span>
                      ) : tx.receiptNo ? (
                        <span className="text-[var(--acct-muted)]">{tx.receiptNo}</span>
                      ) : (
                        <span className="text-[var(--acct-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-sm text-[var(--acct-muted)]">
                    {t("No payment intents have been recorded yet.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OwnerPanel>
    </div>
  );
}

function ActivityStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warning" | "critical" | "muted";
}) {
  const color =
    tone === "good"
      ? "var(--acct-green)"
      : tone === "warning"
        ? "var(--acct-orange)"
        : tone === "critical"
          ? "var(--acct-red)"
          : "var(--acct-ink)";
  return (
    <div className="rounded-[var(--acct-radius-lg)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4">
      <p className="acct-kicker">{label}</p>
      <p className="acct-display mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>
        {formatCompactNumber(value)}
      </p>
    </div>
  );
}
