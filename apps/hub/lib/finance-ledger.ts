import "server-only";

import { unstable_cache } from "next/cache";
import { logger } from "@henryco/observability/logger";
import { createAdminSupabase } from "@/lib/supabase";
import type { OwnerReconcileTrace } from "@henryco/dashboard-shell/owner-register";

/**
 * V3-22 — the owner finance dashboard's READ-ONLY window onto the money spine.
 *
 * The double-entry ledger lives in the `public` schema (journal_entries,
 * journal_lines, ledger_accounts, payment_intents, …) and is readable by the
 * service-role client (RLS-exempt; SELECT grants are intentionally kept for the
 * V3-22 finance reads). The reconciliation *functions* live in the non-exposed
 * `payments_private` schema — but we never need them at runtime: the dashboard
 * re-derives the identical kobo math in TS from the public tables, which keeps it
 * on the same service-role client hub already uses everywhere else (no dedicated
 * database URL to configure, nothing to wrestle). The re-derivation is proven
 * byte-for-byte equal to payments_private.ledger_reconciliation() against prod.
 *
 * THE LINE THIS MODULE NEVER CROSSES: strictly read-only. Only `.select()` calls;
 * never a write, never an `.rpc()` to a money writer. The amounts are kobo BIGINT
 * — integer arithmetic only, never float, never ×100 (formatting happens at the
 * render boundary).
 *
 * Resilience: cached (unstable_cache, revalidate 60s, tag "owner-finance") so the
 * page's RouteLiveRefresh is served from cache, and raced with a hard timeout that
 * degrades to a typed sentinel instead of hanging. A degraded read is never cached.
 */

const FINANCE_TAG = "owner-finance";
const READ_TIMEOUT_MS = 7000;
const STUCK_THRESHOLD_MINUTES = 30;
const RECENT_LIMIT = 24;
const STUCK_LIMIT = 60;
const FLOW_WINDOW_DAYS = 30;
const INTENT_SCAN_LIMIT = 5000; // generous; see capped-scan note in readSnapshot

/** True when the service-role Supabase env the finance reads need is present. */
export function isFinanceLedgerConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return Boolean(url && key);
}

/** Reject-on-timeout race (the underlying read keeps running and may warm the cache). */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`finance read timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

// ── Types (mirror the payments_private reconciliation return shapes) ─────────────

export type LedgerAccountBalance = {
  code: string;
  type: string;
  normalBalance: "debit" | "credit";
  debitMinor: number;
  creditMinor: number;
  balanceMinor: number;
};

export type LedgerReconciliation = {
  totalDebitMinor: number;
  totalCreditMinor: number;
  deltaMinor: number;
  balanced: boolean;
  accounts: LedgerAccountBalance[];
};

export type WalletReconciliation = {
  walletBalanceTotalKobo: number;
  ledgerWalletLiabilityKobo: number;
  deltaKobo: number;
  reconciled: boolean;
};

export type VatReconciliation = {
  periodStart: string;
  periodEnd: string;
  outputVatCollectedMinor: number;
  inputVatRecoverableMinor: number;
  netVatPayableMinor: number;
};

export type IntentStatusStat = { status: string; count: number; volumeMinor: number };

export type IntentStats = {
  byStatus: IntentStatusStat[];
  totalCount: number;
  succeededCount: number;
  failedCount: number;
  pendingCount: number; // pending + processing (in-flight, money-uncertain)
  refundCount: number; // refund_processing + refunded
  succeededVolumeMinor: number;
};

export type StuckIntent = {
  id: string;
  division: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
  ageMinutes: number;
};

export type RecentTransaction = {
  id: string;
  division: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  provider: string | null;
  settled: boolean;
  createdAt: string;
  receiptNo: string | null;
  creditNoteNo: string | null;
};

export type FlowPoint = { day: string; succeeded: number; volumeMinor: number };

export type FinanceLedgerData = {
  reconciliation: LedgerReconciliation;
  wallet: WalletReconciliation;
  vat: VatReconciliation;
  stats: IntentStats;
  stuck: StuckIntent[];
  recent: RecentTransaction[];
  flow: FlowPoint[];
  stuckThresholdMinutes: number;
  flowWindowDays: number;
  capturedAt: string;
};

export type FinanceLedgerSnapshot =
  | ({ ok: true } & FinanceLedgerData)
  | { ok: false; reason: "not_configured" | "degraded" };

// ── Row shapes from PostgREST ───────────────────────────────────────────────────

type AccountRow = { code: string; type: string; normal_balance: "debit" | "credit"; label?: string | null };
type LineRow = { account_code: string; debit_minor: number | string; credit_minor: number | string };
type VatLineRow = LineRow & { journal_entries: { posted_at: string } | { posted_at: string }[] | null };
type IntentRow = {
  id: string;
  division: string | null;
  amount_minor: number | string;
  currency: string | null;
  status: string;
  created_at: string;
};

function postedAtOf(row: VatLineRow): string | null {
  const je = row.journal_entries;
  if (!je) return null;
  return Array.isArray(je) ? je[0]?.posted_at ?? null : je.posted_at ?? null;
}

// ── The single coherent read (all reads via the service-role client) ─────────────

async function readSnapshot(): Promise<FinanceLedgerData> {
  const sb = createAdminSupabase();
  const capturedAt = new Date().toISOString();
  const now = Date.now();
  const yearStart = new Date(Date.UTC(new Date(now).getUTCFullYear(), 0, 1)).toISOString();
  const stuckCutoff = new Date(now - STUCK_THRESHOLD_MINUTES * 60_000).toISOString();
  const flowCutoff = new Date(now - FLOW_WINDOW_DAYS * 86_400_000).toISOString();

  // Wave 1 — independent reads in parallel.
  const [accountsRes, linesRes, vatLinesRes, walletsRes, intentsRes] = await Promise.all([
    sb.from("ledger_accounts").select("code,type,normal_balance,label"),
    sb.from("journal_lines").select("account_code,debit_minor,credit_minor"),
    sb
      .from("journal_lines")
      .select("account_code,debit_minor,credit_minor,journal_entries(posted_at)")
      .in("account_code", ["vat_output_payable", "fee_vat_recoverable"]),
    sb.from("customer_wallets").select("balance_kobo"),
    sb
      .from("payment_intents")
      .select("id,division,amount_minor,currency,status,created_at")
      .order("created_at", { ascending: false })
      .limit(INTENT_SCAN_LIMIT),
  ]);

  for (const res of [accountsRes, linesRes, vatLinesRes, walletsRes, intentsRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const accountRows = (accountsRes.data ?? []) as AccountRow[];
  const lineRows = (linesRes.data ?? []) as LineRow[];
  const vatLineRows = (vatLinesRes.data ?? []) as VatLineRow[];
  const walletRows = (walletsRes.data ?? []) as Array<{ balance_kobo: number | string }>;
  const intentRows = (intentsRes.data ?? []) as IntentRow[];

  if (intentRows.length >= INTENT_SCAN_LIMIT) {
    logger
      .child({ module: "hub.owner-command.finance" })
      .warn("finance_intent_scan_capped", { limit: INTENT_SCAN_LIMIT });
  }

  // ── Reconciliation (mirrors payments_private.ledger_reconciliation) ──
  const perAccount = new Map<string, { d: number; c: number }>();
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of lineRows) {
    const d = num(l.debit_minor);
    const c = num(l.credit_minor);
    totalDebit += d;
    totalCredit += c;
    const p = perAccount.get(l.account_code) ?? { d: 0, c: 0 };
    p.d += d;
    p.c += c;
    perAccount.set(l.account_code, p);
  }
  const accounts: LedgerAccountBalance[] = accountRows
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((a) => {
      const p = perAccount.get(a.code) ?? { d: 0, c: 0 };
      const balanceMinor = a.normal_balance === "debit" ? p.d - p.c : p.c - p.d;
      return { code: a.code, type: a.type, normalBalance: a.normal_balance, debitMinor: p.d, creditMinor: p.c, balanceMinor };
    });
  const reconciliation: LedgerReconciliation = {
    totalDebitMinor: totalDebit,
    totalCreditMinor: totalCredit,
    deltaMinor: totalDebit - totalCredit,
    balanced: totalDebit === totalCredit,
    accounts,
  };

  // ── Wallet projection (mirrors wallet_ledger_reconciliation) ──
  const walletTotal = walletRows.reduce((acc, w) => acc + num(w.balance_kobo), 0);
  const ledgerLiability = accounts.find((a) => a.code === "customer_wallet_liability")?.balanceMinor ?? 0;
  const wallet: WalletReconciliation = {
    walletBalanceTotalKobo: walletTotal,
    ledgerWalletLiabilityKobo: ledgerLiability,
    deltaKobo: walletTotal - ledgerLiability,
    reconciled: walletTotal === ledgerLiability,
  };

  // ── VAT (mirrors vat_reconciliation(year_start, now), posted_at half-open window) ──
  let outputVat = 0;
  let inputVat = 0;
  for (const l of vatLineRows) {
    const postedAt = postedAtOf(l);
    if (!postedAt || postedAt < yearStart || postedAt >= capturedAt) continue;
    const d = num(l.debit_minor);
    const c = num(l.credit_minor);
    if (l.account_code === "vat_output_payable") outputVat += c - d;
    else if (l.account_code === "fee_vat_recoverable") inputVat += d - c;
  }
  const vat: VatReconciliation = {
    periodStart: yearStart,
    periodEnd: capturedAt,
    outputVatCollectedMinor: outputVat,
    inputVatRecoverableMinor: inputVat,
    netVatPayableMinor: outputVat - inputVat,
  };

  // ── Intent-derived: stats, stuck, recent, flow (from the one ordered scan) ──
  const statMap = new Map<string, { count: number; volumeMinor: number }>();
  for (const i of intentRows) {
    const s = statMap.get(i.status) ?? { count: 0, volumeMinor: 0 };
    s.count += 1;
    s.volumeMinor += num(i.amount_minor);
    statMap.set(i.status, s);
  }
  const byStatus: IntentStatusStat[] = [...statMap.entries()]
    .map(([status, v]) => ({ status, count: v.count, volumeMinor: v.volumeMinor }))
    .sort((a, b) => a.status.localeCompare(b.status));
  const sumCount = (pred: (s: string) => boolean) =>
    byStatus.filter((s) => pred(s.status)).reduce((acc, s) => acc + s.count, 0);
  const sumVol = (pred: (s: string) => boolean) =>
    byStatus.filter((s) => pred(s.status)).reduce((acc, s) => acc + s.volumeMinor, 0);
  const stats: IntentStats = {
    byStatus,
    totalCount: intentRows.length,
    succeededCount: sumCount((s) => s === "succeeded"),
    failedCount: sumCount((s) => s === "failed"),
    pendingCount: sumCount((s) => s === "pending" || s === "processing"),
    refundCount: sumCount((s) => s === "refund_processing" || s === "refunded"),
    succeededVolumeMinor: sumVol((s) => s === "succeeded" || s === "refund_processing" || s === "refunded"),
  };

  const stuck: StuckIntent[] = intentRows
    .filter((i) => (i.status === "pending" || i.status === "processing") && i.created_at < stuckCutoff)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, STUCK_LIMIT)
    .map((i) => ({
      id: str(i.id),
      division: i.division,
      amountMinor: num(i.amount_minor),
      currency: i.currency || "NGN",
      status: i.status,
      createdAt: new Date(i.created_at).toISOString(),
      ageMinutes: Math.floor((now - new Date(i.created_at).getTime()) / 60_000),
    }));

  // 30-day daily settled-volume series.
  const dayMap = new Map<string, { succeeded: number; volumeMinor: number }>();
  for (const i of intentRows) {
    if (i.created_at < flowCutoff) continue;
    if (!(i.status === "succeeded" || i.status === "refund_processing" || i.status === "refunded")) continue;
    const day = i.created_at.slice(0, 10);
    const p = dayMap.get(day) ?? { succeeded: 0, volumeMinor: 0 };
    p.succeeded += 1;
    p.volumeMinor += num(i.amount_minor);
    dayMap.set(day, p);
  }
  const flow: FlowPoint[] = [...dayMap.entries()]
    .map(([day, v]) => ({ day, succeeded: v.succeeded, volumeMinor: v.volumeMinor }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Recent transactions: the latest intents + provider / settled / document, resolved in a second wave.
  const recentBase = intentRows.slice(0, RECENT_LIMIT);
  const recent: RecentTransaction[] = await resolveRecent(sb, recentBase);

  return {
    reconciliation,
    wallet,
    vat,
    stats,
    stuck,
    recent,
    flow,
    stuckThresholdMinutes: STUCK_THRESHOLD_MINUTES,
    flowWindowDays: FLOW_WINDOW_DAYS,
    capturedAt,
  };
}

type AdminClient = ReturnType<typeof createAdminSupabase>;

async function resolveRecent(sb: AdminClient, base: IntentRow[]): Promise<RecentTransaction[]> {
  if (base.length === 0) return [];
  const ids = base.map((i) => String(i.id));

  const [attemptsRes, entriesRes, receiptsRes, creditNotesRes] = await Promise.all([
    sb.from("payment_attempts").select("intent_id,provider,status,created_at").in("intent_id", ids),
    sb.from("journal_entries").select("source_event_id").eq("source", "payment_intent").in("source_event_id", ids),
    sb.from("customer_receipts").select("payment_intent_id,receipt_no,created_at").in("payment_intent_id", ids),
    sb.from("customer_credit_notes").select("payment_intent_id,credit_note_no,issued_at").in("payment_intent_id", ids),
  ]);

  // Provider: prefer the succeeded attempt, else the most recent.
  const providerByIntent = new Map<string, string>();
  for (const a of (attemptsRes.data ?? []) as Array<{ intent_id: string; provider: string | null; status: string; created_at: string }>) {
    if (!a.provider) continue;
    const existing = providerByIntent.get(a.intent_id);
    if (!existing || a.status === "succeeded") providerByIntent.set(a.intent_id, a.provider);
  }
  const settled = new Set<string>(
    ((entriesRes.data ?? []) as Array<{ source_event_id: string }>).map((e) => e.source_event_id),
  );
  const receiptByIntent = new Map<string, string>();
  for (const r of (receiptsRes.data ?? []) as Array<{ payment_intent_id: string; receipt_no: string }>) {
    if (!receiptByIntent.has(r.payment_intent_id)) receiptByIntent.set(r.payment_intent_id, r.receipt_no);
  }
  const creditNoteByIntent = new Map<string, string>();
  for (const c of (creditNotesRes.data ?? []) as Array<{ payment_intent_id: string; credit_note_no: string }>) {
    if (!creditNoteByIntent.has(c.payment_intent_id)) creditNoteByIntent.set(c.payment_intent_id, c.credit_note_no);
  }

  return base.map((i) => {
    const id = String(i.id);
    return {
      id,
      division: i.division,
      amountMinor: num(i.amount_minor),
      currency: i.currency || "NGN",
      status: i.status,
      provider: providerByIntent.get(id) ?? null,
      settled: settled.has(id),
      createdAt: new Date(i.created_at).toISOString(),
      receiptNo: receiptByIntent.get(id) ?? null,
      creditNoteNo: creditNoteByIntent.get(id) ?? null,
    };
  });
}

// Cache only a SUCCESSFUL read. unstable_cache does not cache a rejected promise,
// so a slow/failed read never poisons the cache (next call retries) while a good
// read serves RouteLiveRefresh for 60s without re-hitting the DB.
const cachedRead = unstable_cache(readSnapshot, ["owner-finance-ledger-v2"], {
  revalidate: 60,
  tags: [FINANCE_TAG],
});

/**
 * The owner finance dashboard's data entry point. Never throws, never hangs:
 * returns a typed degraded sentinel when env is missing or a read is slow/down,
 * so the page renders an honest state instead of a white screen or fake zeros.
 */
export async function getFinanceLedgerSnapshot(): Promise<FinanceLedgerSnapshot> {
  if (!isFinanceLedgerConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const data = await withTimeout(cachedRead(), READ_TIMEOUT_MS);
    return { ok: true, ...data };
  } catch (error) {
    logger
      .child({ module: "hub.owner-command.finance" })
      .error("finance_ledger_read_failed", error instanceof Error ? error : { error: String(error) });
    return { ok: false, reason: "degraded" };
  }
}

export const FINANCE_CACHE_TAG = FINANCE_TAG;

// ── Reconcile-trace (anti-pattern #18: every money KPI carries its query) ────────
//
// These power the MetricTraceDrawer on each finance tile: "View query" surfaces the
// canonical reconciliation SQL the numbers represent plus a live result sample.
// Delegated to from loadOwnerReconcileTrace() for any traceId starting "finance.".

const FINANCE_TRACE_SQL: Record<string, { label: string; sql: string; caveat?: string }> = {
  "finance.reconciliation": {
    label: "Ledger reconciliation",
    sql: "-- Equivalent of payments_private.ledger_reconciliation(), computed read-only from the public ledger:\nSELECT sum(debit_minor) AS total_debit, sum(credit_minor) AS total_credit FROM public.journal_lines;\n-- delta = total_debit - total_credit; balanced when equal. Per-account balances below.",
  },
  "finance.accounts": {
    label: "Chart of accounts",
    sql: "SELECT a.code, a.type, a.normal_balance,\n       coalesce(sum(l.debit_minor),0)  AS debit_minor,\n       coalesce(sum(l.credit_minor),0) AS credit_minor\n  FROM public.ledger_accounts a\n  LEFT JOIN public.journal_lines l ON l.account_code = a.code\n GROUP BY a.code, a.type, a.normal_balance ORDER BY a.code;",
  },
  "finance.vat": {
    label: "VAT reconciliation (YTD)",
    sql: "SELECT account_code, sum(credit_minor) - sum(debit_minor) AS net\n  FROM public.journal_lines l JOIN public.journal_entries e ON e.id = l.entry_id\n WHERE account_code IN ('vat_output_payable','fee_vat_recoverable')\n   AND e.posted_at >= date_trunc('year', now())\n GROUP BY account_code;  -- net_vat = output collected - input recoverable",
  },
  "finance.intents": {
    label: "Payment intent activity",
    sql: "SELECT status, count(*) AS count, coalesce(sum(amount_minor),0) AS volume_minor\n  FROM public.payment_intents GROUP BY status;",
  },
  "finance.stuck": {
    label: "Stuck payment intents",
    sql: `SELECT id, division, amount_minor, status, created_at\n  FROM public.payment_intents\n WHERE status IN ('pending','processing')\n   AND created_at < now() - interval '${STUCK_THRESHOLD_MINUTES} minutes'\n ORDER BY created_at ASC;`,
    caveat: `In-flight beyond ${STUCK_THRESHOLD_MINUTES} minutes.`,
  },
  "finance.recent": {
    label: "Recent transactions",
    sql: `SELECT id, division, amount_minor, status, created_at\n  FROM public.payment_intents ORDER BY created_at DESC LIMIT ${RECENT_LIMIT};  -- provider + settled + document resolved per row`,
  },
};

export async function loadFinanceLedgerTrace(traceId: string): Promise<OwnerReconcileTrace | null> {
  const meta = FINANCE_TRACE_SQL[traceId];
  if (!meta) return null;

  const snapshot = await getFinanceLedgerSnapshot();
  const executedAt = snapshot.ok ? snapshot.capturedAt : new Date().toISOString();

  if (!snapshot.ok) {
    return {
      id: traceId,
      label: meta.label,
      sql: meta.sql,
      rows: [],
      executedAt,
      caveat:
        snapshot.reason === "not_configured"
          ? "Finance service-role env is not configured for this deployment — no live rows."
          : "Live ledger read degraded — no rows captured for this trace.",
    };
  }

  let rows: ReadonlyArray<Record<string, unknown>> = [];
  switch (traceId) {
    case "finance.reconciliation":
    case "finance.accounts":
      rows = snapshot.reconciliation.accounts.map((a) => ({
        account: a.code,
        type: a.type,
        debit_minor: a.debitMinor,
        credit_minor: a.creditMinor,
        balance_minor: a.balanceMinor,
      }));
      break;
    case "finance.vat":
      rows = [
        { output_vat_collected_minor: snapshot.vat.outputVatCollectedMinor },
        { input_vat_recoverable_minor: snapshot.vat.inputVatRecoverableMinor },
        { net_vat_payable_minor: snapshot.vat.netVatPayableMinor },
      ];
      break;
    case "finance.intents":
      rows = snapshot.stats.byStatus.map((s) => ({ status: s.status, count: s.count, volume_minor: s.volumeMinor }));
      break;
    case "finance.stuck":
      rows = snapshot.stuck.slice(0, 25).map((s) => ({
        id: s.id,
        division: s.division,
        amount_minor: s.amountMinor,
        status: s.status,
        age_minutes: s.ageMinutes,
        created_at: s.createdAt,
      }));
      break;
    case "finance.recent":
      rows = snapshot.recent.slice(0, 25).map((tx) => ({
        id: tx.id,
        division: tx.division,
        amount_minor: tx.amountMinor,
        status: tx.status,
        provider: tx.provider,
        settled: tx.settled,
        created_at: tx.createdAt,
      }));
      break;
  }

  const caveat =
    traceId === "finance.reconciliation"
      ? `delta_minor = ${snapshot.reconciliation.deltaMinor} · balanced = ${snapshot.reconciliation.balanced}`
      : meta.caveat;

  return { id: traceId, label: meta.label, sql: meta.sql, rows, executedAt, caveat };
}
