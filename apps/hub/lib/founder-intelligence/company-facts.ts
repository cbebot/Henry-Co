import "server-only";

import { getOwnerOverviewData, getFounderActionQueue } from "@/lib/owner-data";
import { getFinanceLedgerSnapshot } from "@/lib/finance-ledger";
import { getSignupsSnapshot } from "@/lib/owner-command/signups";

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
  const [overview, finance, signups, actionQueue] = await Promise.all([
    getOwnerOverviewData(),
    getFinanceLedgerSnapshot().catch(() => null),
    getSignupsSnapshot().catch(() => null),
    getFounderActionQueue().catch(() => null),
  ]);

  const lines: string[] = [];
  const m = overview.metrics;
  lines.push(
    `Company: ${fenceSafe(overview.companyName, 80)}. Divisions live: ${m.divisionsLive}. Active staff: ${m.activeStaff}.`,
    `Recognized revenue (console rollup — ALL divisions wired via the payment rail): ${naira(m.totalRevenueNaira)}. Expenses: ${naira(m.totalExpenseNaira)}.`,
    `Refunds: ${m.refundsCount} totalling ${naira(m.refundsTotalNaira)}.`,
    `Engagement: ${m.activeMembers7d} members active in the last 7 days, ${m.activeMembers30d} in 30 days (sign-in + device activity — accounts with neither are cold).`,
    `Security posture: ${String(m.threatPosture).toUpperCase()} — ${m.threatCritical} critical + ${m.threatWarning} warning attacker signal(s) in the last 30 days (${m.sharedDeviceAccounts} device(s) shared across accounts). ${m.threatCritical + m.threatWarning > 0 ? "The specific threats are in the signals list below; full detail + actions on the audit console." : "No attacker fingerprints right now."}`,
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

  // Signups — exact HEAD counts over customer_profiles (the same series the
  // overview renders). The founder asks for this constantly; give the trend,
  // not just the topline.
  if (signups?.ok) {
    const recent = signups.weekly.slice(-4);
    const trend = recent.map((w) => `${w.weekStart}: ${w.count}`).join(", ");
    lines.push(
      `Signups: ${signups.last7d} in the last 7 days; ${signups.totalProfiles} accounts all-time. Weekly (start date: count) — ${trend}.`,
    );
  } else {
    lines.push("Signup counts unavailable this turn (the overview page still has them).");
  }

  lines.push("", "Per division (revenue = app-native records for care/marketplace/learn, the settled payment rail for the rest):");
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

  // PENDING ITEMS TO ACT ON — the real records behind the counts, WITH their
  // exact IDs. This is what turns "give me the ID" into a concrete confirm card:
  // the AI reads the id straight from here and prepares the matching F3 action.
  // Fenced as DATA; the owner already sees every one of these on his console.
  if (actionQueue) {
    const q = actionQueue;
    const hasAny =
      q.supportThreads.length + q.vendorApplications.length + q.kycSubmissions.length + q.productReviews.length > 0;
    if (hasAny) {
      lines.push(
        "",
        "PENDING ITEMS YOU CAN ACT ON NOW — use the EXACT id shown to prepare the matching confirm card. NEVER invent or guess an id; if the item you need is not listed here, say so and ask the owner to open the relevant console list.",
      );
      for (const thread of q.supportThreads) {
        const msg = thread.lastMessage ? ` — customer said: "${fenceSafe(thread.lastMessage, 160)}"` : " — (no customer message on record yet)";
        lines.push(
          `- SUPPORT THREAD id=${fenceSafe(thread.id, 40)} · ${fenceSafe(thread.division, 20)} · subject "${fenceSafe(thread.subject, 80)}"${msg} → owner.support.reply (threadId, body)`,
        );
      }
      for (const app of q.vendorApplications) {
        const who = app.email ? ` (${fenceSafe(app.email, 50)})` : "";
        lines.push(
          `- VENDOR APPLICATION id=${fenceSafe(app.id, 40)} · store "${fenceSafe(app.store, 60)}"${who} awaiting decision → owner.marketplace.seller.decision (applicationId, decision)`,
        );
      }
      for (const sub of q.kycSubmissions) {
        lines.push(
          `- KYC SUBMISSION id=${fenceSafe(sub.id, 40)} · ${fenceSafe(sub.docType, 40)} · user ${fenceSafe(sub.user, 12)}… → owner.kyc.review (submissionId, decision)`,
        );
      }
      for (const product of q.productReviews) {
        lines.push(
          `- PRODUCT REVIEW id=${fenceSafe(product.id, 40)} · "${fenceSafe(product.title, 60)}" → owner.marketplace.product.review (productId, decision)`,
        );
      }
    }
  }

  // Recent activity — the real audit trail (owner/staff writes, sign-ins) so the
  // assistant can answer "what changed recently / who did what" from record, not
  // guesswork. Actor + action only, fenced; the owner already sees this feed.
  if (overview.recentAudit.length > 0) {
    lines.push("", "Recent activity (newest first, from the audit trail):");
    for (const entry of overview.recentAudit.slice(0, 6)) {
      const when = entry.createdAt ? ` (${fenceSafe(entry.createdAt, 32)})` : "";
      lines.push(`- ${fenceSafe(entry.action, 60)} by ${fenceSafe(entry.actor, 60)}${when}`);
    }
  }

  lines.push(
    "",
    "Known coverage gaps (answer honestly about these): site traffic, visit sources, and signup conversion are not instrumented yet — engagement above is from sign-in records, not page analytics. Failed sign-in attempts are not captured yet, so failed-password brute-force is a security blind spot — but impossible-travel, credential-spray, shared-device, revoked-device-reuse, and reset-pressure detection ARE live and feed the security posture above.",
  );

  // 6000 = the prompt builder's own company-facts ceiling (prompts.ts). The
  // action queue is placed ABOVE recent-activity + coverage-gaps, so if anything
  // is trimmed here it's the lower-value tail, never the actionable records.
  return lines.join("\n").slice(0, 6000);
}
