import "server-only";

import { Pool, type PoolClient } from "pg";
import { unstable_cache } from "next/cache";
import { logger } from "@henryco/observability/logger";
import type { OwnerReconcileTrace } from "@henryco/dashboard-shell/owner-register";

/**
 * V3-22 — the owner finance dashboard's READ-ONLY window onto the money spine.
 *
 * The double-entry ledger, payment intents and the reconciliation functions live
 * in the NON-exposed `payments_private` schema (and `public` tables that only
 * service_role may read). PostgREST cannot reach `payments_private` by
 * construction, so — exactly like the account app's money writers
 * (apps/account/lib/payments/db.ts) — we read over a pooled direct-pg connection
 * (`PAYMENTS_DATABASE_URL`).
 *
 * THE LINE THIS MODULE NEVER CROSSES: it is strictly read-only. Every query runs
 * inside `BEGIN TRANSACTION READ ONLY` with a `SET LOCAL statement_timeout`, so
 * the database itself rejects any write — even from a SECURITY DEFINER function —
 * with `cannot execute ... in a read-only transaction`. We call ONLY the three
 * read-only reconciliation functions plus SELECTs; we never touch
 * apply_payment_webhook / advance_payment_intent / apply_refund_webhook / any
 * post_/credit_/initiate_/fail_/set_/record_ writer.
 *
 * Resilience (a saturated money DB must never hang this surface):
 *   - the snapshot is cached (unstable_cache, revalidate 60s, tag "owner-finance")
 *     so the page's RouteLiveRefresh is served from cache, not a DB storm (STAB-01);
 *   - the read is raced with a hard timeout and degrades to a typed sentinel
 *     rather than throwing a white screen — and a degraded result is NEVER cached.
 */

const FINANCE_TAG = "owner-finance";
const READ_TIMEOUT_MS = 6500;
const STATEMENT_TIMEOUT_MS = 6000;
const STUCK_THRESHOLD_MINUTES = 30;
const RECENT_LIMIT = 24;
const STUCK_LIMIT = 60;
const FLOW_WINDOW_DAYS = 30;

// ── Connection pool (server-only, tiny client cap; the Supabase pooler owns real pooling) ──
let pool: Pool | null = null;

function sslConfig(): { ca?: string; rejectUnauthorized: boolean } {
  const ca = process.env.PAYMENTS_DB_SSL_CA;
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.PAYMENTS_DB_SSL_INSECURE === "true") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.PAYMENTS_DATABASE_URL;
  if (!connectionString) throw new Error("PAYMENTS_DATABASE_URL is not configured");
  pool = new Pool({
    connectionString,
    ssl: sslConfig(),
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  return pool;
}

/** True when the direct-pg finance backend is wired for this deployment. */
export function isFinanceLedgerConfigured(): boolean {
  return Boolean(process.env.PAYMENTS_DATABASE_URL);
}

/**
 * Run `fn` inside a single READ ONLY transaction with a statement timeout. All of
 * a snapshot's reads share ONE transaction, so every number is from the same
 * instant — a coherent reconciliation moment, never values that drift between
 * queries.
 */
async function readOnly<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin transaction read only");
    await client.query(`set local statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      /* connection already broken — release below */
    }
    throw error;
  } finally {
    client.release();
  }
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

// pg returns BIGINT as a string to avoid precision loss; coerce for display math.
function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

// ── Types (mirror payments_private return shapes) ───────────────────────────────

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

// ── The single coherent read ────────────────────────────────────────────────────

async function readSnapshot(): Promise<FinanceLedgerData> {
  return readOnly(async (c) => {
    const recon = await c.query<{ result: RawReconciliation }>(
      "select payments_private.ledger_reconciliation() as result",
    );
    const walletRecon = await c.query<{ result: RawWalletReconciliation }>(
      "select payments_private.wallet_ledger_reconciliation() as result",
    );
    const vatRecon = await c.query<{ result: RawVatReconciliation }>(
      "select payments_private.vat_reconciliation(date_trunc('year', now()), now()) as result",
    );

    const statsRows = await c.query<{ status: string; n: string; vol: string }>(
      `select status, count(*)::bigint as n, coalesce(sum(amount_minor), 0)::bigint as vol
         from public.payment_intents
        group by status`,
    );

    const stuckRows = await c.query<RawStuck>(
      `select id, division, amount_minor, currency, status, created_at,
              floor(extract(epoch from (now() - created_at)) / 60)::bigint as age_minutes
         from public.payment_intents
        where status in ('pending', 'processing')
          and created_at < now() - ($1 || ' minutes')::interval
        order by created_at asc
        limit ${STUCK_LIMIT}`,
      [String(STUCK_THRESHOLD_MINUTES)],
    );

    const recentRows = await c.query<RawRecent>(
      `select i.id, i.division, i.amount_minor, i.currency, i.status, i.created_at,
              (select a.provider
                 from public.payment_attempts a
                where a.intent_id = i.id
                order by (a.status = 'succeeded') desc, a.created_at desc
                limit 1) as provider,
              exists (select 1 from public.journal_entries e
                       where e.source = 'payment_intent' and e.source_event_id = i.id::text) as settled,
              (select r.receipt_no from public.customer_receipts r
                where r.payment_intent_id = i.id order by r.created_at desc limit 1) as receipt_no,
              (select cn.credit_note_no from public.customer_credit_notes cn
                where cn.payment_intent_id = i.id order by cn.issued_at desc limit 1) as credit_note_no
         from public.payment_intents i
        order by i.created_at desc
        limit ${RECENT_LIMIT}`,
    );

    const flowRows = await c.query<{ day: string; succeeded: string; volume: string }>(
      `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
              count(*) filter (where status in ('succeeded', 'refund_processing', 'refunded'))::bigint as succeeded,
              coalesce(sum(amount_minor) filter (where status in ('succeeded', 'refund_processing', 'refunded')), 0)::bigint as volume
         from public.payment_intents
        where created_at > now() - ($1 || ' days')::interval
        group by 1
        order by 1 asc`,
      [String(FLOW_WINDOW_DAYS)],
    );

    return shape(
      recon.rows[0]?.result,
      walletRecon.rows[0]?.result,
      vatRecon.rows[0]?.result,
      statsRows.rows,
      stuckRows.rows,
      recentRows.rows,
      flowRows.rows,
    );
  });
}

type RawReconciliation = {
  total_debit_minor: number;
  total_credit_minor: number;
  delta_minor: number;
  balanced: boolean;
  accounts: Array<{
    code: string;
    type: string;
    normal_balance: "debit" | "credit";
    debit_minor: number;
    credit_minor: number;
    balance_minor: number;
  }>;
};
type RawWalletReconciliation = {
  wallet_balance_total_kobo: number;
  ledger_wallet_liability_kobo: number;
  delta_kobo: number;
  reconciled: boolean;
};
type RawVatReconciliation = {
  period_start: string;
  period_end: string;
  output_vat_collected_minor: number;
  input_vat_recoverable_minor: number;
  net_vat_payable_minor: number;
};
type RawStuck = {
  id: string;
  division: string | null;
  amount_minor: string;
  currency: string;
  status: string;
  created_at: string | Date;
  age_minutes: string;
};
type RawRecent = {
  id: string;
  division: string | null;
  amount_minor: string;
  currency: string;
  status: string;
  created_at: string | Date;
  provider: string | null;
  settled: boolean;
  receipt_no: string | null;
  credit_note_no: string | null;
};

function shape(
  recon: RawReconciliation | undefined,
  wallet: RawWalletReconciliation | undefined,
  vat: RawVatReconciliation | undefined,
  statsRows: Array<{ status: string; n: string; vol: string }>,
  stuckRows: RawStuck[],
  recentRows: RawRecent[],
  flowRows: Array<{ day: string; succeeded: string; volume: string }>,
): FinanceLedgerData {
  const accounts: LedgerAccountBalance[] = (recon?.accounts ?? []).map((a) => ({
    code: a.code,
    type: a.type,
    normalBalance: a.normal_balance,
    debitMinor: num(a.debit_minor),
    creditMinor: num(a.credit_minor),
    balanceMinor: num(a.balance_minor),
  }));

  const byStatus: IntentStatusStat[] = statsRows.map((r) => ({
    status: r.status,
    count: num(r.n),
    volumeMinor: num(r.vol),
  }));
  const sumWhere = (pred: (s: string) => boolean, field: "count" | "volumeMinor") =>
    byStatus.filter((s) => pred(s.status)).reduce((acc, s) => acc + s[field], 0);

  const stats: IntentStats = {
    byStatus,
    totalCount: byStatus.reduce((acc, s) => acc + s.count, 0),
    succeededCount: sumWhere((s) => s === "succeeded", "count"),
    failedCount: sumWhere((s) => s === "failed", "count"),
    pendingCount: sumWhere((s) => s === "pending" || s === "processing", "count"),
    refundCount: sumWhere((s) => s === "refund_processing" || s === "refunded", "count"),
    succeededVolumeMinor: sumWhere(
      (s) => s === "succeeded" || s === "refund_processing" || s === "refunded",
      "volumeMinor",
    ),
  };

  return {
    reconciliation: {
      totalDebitMinor: num(recon?.total_debit_minor),
      totalCreditMinor: num(recon?.total_credit_minor),
      deltaMinor: num(recon?.delta_minor),
      balanced: Boolean(recon?.balanced),
      accounts,
    },
    wallet: {
      walletBalanceTotalKobo: num(wallet?.wallet_balance_total_kobo),
      ledgerWalletLiabilityKobo: num(wallet?.ledger_wallet_liability_kobo),
      deltaKobo: num(wallet?.delta_kobo),
      reconciled: Boolean(wallet?.reconciled),
    },
    vat: {
      periodStart: str(vat?.period_start),
      periodEnd: str(vat?.period_end),
      outputVatCollectedMinor: num(vat?.output_vat_collected_minor),
      inputVatRecoverableMinor: num(vat?.input_vat_recoverable_minor),
      netVatPayableMinor: num(vat?.net_vat_payable_minor),
    },
    stats,
    stuck: stuckRows.map((r) => ({
      id: str(r.id),
      division: r.division,
      amountMinor: num(r.amount_minor),
      currency: r.currency || "NGN",
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      ageMinutes: num(r.age_minutes),
    })),
    recent: recentRows.map((r) => ({
      id: str(r.id),
      division: r.division,
      amountMinor: num(r.amount_minor),
      currency: r.currency || "NGN",
      status: r.status,
      provider: r.provider,
      settled: Boolean(r.settled),
      createdAt: new Date(r.created_at).toISOString(),
      receiptNo: r.receipt_no,
      creditNoteNo: r.credit_note_no,
    })),
    flow: flowRows.map((r) => ({ day: r.day, succeeded: num(r.succeeded), volumeMinor: num(r.volume) })),
    stuckThresholdMinutes: STUCK_THRESHOLD_MINUTES,
    flowWindowDays: FLOW_WINDOW_DAYS,
    capturedAt: new Date().toISOString(),
  };
}

// Cache the SUCCESSFUL read only. unstable_cache does not cache a rejected
// promise, so a slow/failed read never poisons the cache (next call retries),
// while a good read serves RouteLiveRefresh for 60s without re-hitting the DB.
const cachedRead = unstable_cache(readSnapshot, ["owner-finance-ledger-v1"], {
  revalidate: 60,
  tags: [FINANCE_TAG],
});

/**
 * The owner finance dashboard's data entry point. Never throws, never hangs:
 * returns a typed degraded sentinel when the backend is unconfigured or slow/down,
 * so the page can render an honest state instead of a white screen or fake zeros.
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
// These power the MetricTraceDrawer on each finance tile: clicking "View query"
// surfaces the EXACT reconciliation function / SQL behind the number plus a live
// result sample — "the planner's exact query as a tile". Delegated to from
// loadOwnerReconcileTrace() for any traceId starting with "finance.".

const FINANCE_TRACE_SQL: Record<string, { label: string; sql: string; caveat?: string }> = {
  "finance.reconciliation": {
    label: "Ledger reconciliation",
    sql: "SELECT payments_private.ledger_reconciliation();\n-- delta_minor = total debits − total credits; balanced = (debits = credits). Per-account rows below.",
  },
  "finance.accounts": {
    label: "Chart of accounts",
    sql: "SELECT a.code, a.type, a.normal_balance,\n       coalesce(sum(l.debit_minor),0)  AS debit_minor,\n       coalesce(sum(l.credit_minor),0) AS credit_minor\n  FROM public.ledger_accounts a\n  LEFT JOIN public.journal_lines l ON l.account_code = a.code\n GROUP BY a.code, a.type, a.normal_balance\n ORDER BY a.code;  -- (via payments_private.ledger_reconciliation())",
  },
  "finance.vat": {
    label: "VAT reconciliation (YTD)",
    sql: "SELECT payments_private.vat_reconciliation(date_trunc('year', now()), now());\n-- net_vat_payable = output VAT collected − input/fee VAT recoverable.",
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
    sql: `SELECT id, division, amount_minor, status, created_at\n  FROM public.payment_intents\n ORDER BY created_at DESC\n LIMIT ${RECENT_LIMIT};  -- provider + settled + document resolved per row`,
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
          ? "Finance database connection is not configured for this deployment — no live rows."
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
