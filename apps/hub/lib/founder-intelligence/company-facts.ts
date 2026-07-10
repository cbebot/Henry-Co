import "server-only";

import { getOwnerOverviewData } from "@/lib/owner-data";
import { getFinanceLedgerSnapshot } from "@/lib/finance-ledger";

/**
 * Founder Intelligence F2 — the COMPANY facts pack.
 *
 * The founder's assistant is grounded in the SAME live dataset the command
 * center renders (owner-data over 27+ tables, per-request cached) plus the
 * finance ledger snapshot — so every number it states is a number the founder
 * can see on a console surface one click away. Compact plain text, fenced by
 * the prompt as DATA (never instructions), capped well under the prompt
 * builder's 6000-char ceiling.
 *
 * Best-effort by contract: the route calls this inside catch(() => undefined);
 * a facts failure degrades the turn to conversation-only, never to an error.
 */

const NAIRA = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/**
 * Fence defense (review finding, 2026-07-10): several interpolated strings are
 * owner/staff-writable (company name, division registry names/status) — collapse
 * control chars + whitespace runs and strip the fence marker token so no stored
 * string can put COMPANY_FACTS>>> on its own line inside the system prompt.
 * Same defense prompts.ts applies to client-supplied support-assist context.
 */
function fenceSafe(value: unknown, max = 120): string {
  return String(value ?? "")
    .replace(/\p{Cc}+/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/COMPANY_FACTS/gi, "COMPANY-FACTS")
    .slice(0, max)
    .trim();
}

function naira(amount: number): string {
  return `₦${NAIRA.format(Math.round(amount))}`;
}

function kobo(amountKobo: number): string {
  return naira(amountKobo / 100);
}

export async function buildCompanyFactsForFounderAI(): Promise<string> {
  const [overview, finance] = await Promise.all([
    getOwnerOverviewData(),
    getFinanceLedgerSnapshot().catch(() => null),
  ]);

  const lines: string[] = [];
  const m = overview.metrics;
  lines.push(
    `Company: ${fenceSafe(overview.companyName, 80)}. Divisions live: ${m.divisionsLive}. Active staff: ${m.activeStaff}.`,
    `Recognized revenue (console rollup): ${naira(m.totalRevenueNaira)}. Expenses: ${naira(m.totalExpenseNaira)}.`,
    `Open support threads: ${m.openSupport}. Queued notifications: ${m.queuedNotifications}. Critical signals: ${m.criticalSignals}.`,
  );

  if (finance?.ok) {
    lines.push(
      `Ledger (double-entry, live): DR ${kobo(finance.reconciliation.totalDebitMinor)} vs CR ${kobo(finance.reconciliation.totalCreditMinor)} — ${finance.reconciliation.balanced ? "balanced" : `IMBALANCED by ${kobo(Math.abs(finance.reconciliation.deltaMinor))}`}.`,
      `Wallets: customer balance total ${kobo(finance.wallet.walletBalanceTotalKobo)} vs ledger liability ${kobo(finance.wallet.ledgerWalletLiabilityKobo)} — ${finance.wallet.reconciled ? "reconciled" : "NOT reconciled"}.`,
      `VAT this period: net payable ${kobo(finance.vat.netVatPayableMinor)}.`,
    );
    if (finance.stuck.length > 0) {
      lines.push(`Stuck payment intents needing review: ${finance.stuck.length}.`);
    }
  } else {
    lines.push("Ledger snapshot unavailable this turn (finance console still has it).");
  }

  lines.push("", "Per division (revenue is the console rollup; unwired divisions show 0 by design):");
  for (const division of overview.divisions) {
    lines.push(
      `- ${fenceSafe(division.displayName, 60)}: status ${fenceSafe(division.status, 24)}, stability index ${division.healthScore} (${division.healthLabel}), revenue ${naira(division.revenueNaira)}, open work ${division.workOpen}, open support ${division.supportOpen}, alerts ${division.alertCount}, staff ${division.staffingCount}.`,
    );
  }

  if (overview.signals.length > 0) {
    lines.push("", "Current signals (evidence-backed, freshest first):");
    for (const signal of overview.signals.slice(0, 6)) {
      lines.push(`- [${signal.severity}] ${fenceSafe(signal.title, 120)} — ${fenceSafe(signal.body, 160)}`);
    }
  }

  lines.push(
    "",
    "Known coverage gaps (answer honestly about these): studio, jobs, property, and logistics revenue are not yet wired into the rollup; there is no signups time-series yet; refund amounts are not aggregated.",
  );

  return lines.join("\n").slice(0, 5800);
}
