import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase";
import { OWNER_DIVISION_SLUGS } from "@/lib/owner-workforce-catalog";

/**
 * owner-command/division-revenue — ONE honest revenue read for the command
 * center (OCC-3).
 *
 * The old rollup (owner-data.ts buildDivisionSnapshots) mixed truths silently:
 * naira-float sums over 80–120-row recency samples, three divisions wired to
 * three different legacy tables, and every unwired division rendered ₦0 as if
 * measured. This module replaces it with two EXPLICIT ledgers, each labeled:
 *
 *   • SPINE — provider-confirmed money through the payment spine
 *     (payment_intents, kobo integers, division column on every intent). The
 *     same succeeded-volume semantics as the finance ledger console.
 *   • RECORDED — the legacy division books (care_payments,
 *     marketplace_payment_records, learn invoices, studio_payments) where the
 *     company's historical money lives from before the spine existed. Summed
 *     with pagination (not recency caps), converted to kobo integers once at
 *     the read boundary.
 *
 * Divisions with NO money model are returned as measured:false — the surface
 * says "not yet measured", never ₦0-as-fact (the v3-launch honesty pattern).
 *
 * Discipline (the finance-ledger pattern): kobo integer math only,
 * unstable_cache that never caches failures, a hard timeout, and a typed
 * degraded sentinel instead of invented zeros.
 */

const CACHE_SECONDS = 60;
const TIMEOUT_MS = 8000;
/** Same order-desc scan bound the finance console uses; capped is reported. */
const INTENT_SCAN_LIMIT = 5000;
/** Legacy books are paginated (1k/page) up to this many rows per table. */
const RECORDED_SCAN_LIMIT = 5000;
const SERIES_DAYS = 30;

export type SpineDivisionRevenue = {
  division: string;
  /** Provider-confirmed volume (succeeded + refund lifecycle), kobo. */
  succeededMinor: number;
  last7dMinor: number;
  last30dMinor: number;
  intentCount: number;
  /** Daily succeeded volume for the last 30 days (oldest → newest), kobo. */
  series: Array<{ date: string; volumeMinor: number }>;
};

export type RecordedDivisionRevenue = {
  division: "care" | "marketplace" | "learn" | "studio";
  /** What the division book records as collected, kobo. */
  recordedMinor: number;
  rowCount: number;
  source: string;
  capped: boolean;
};

export type DivisionRevenueSnapshot =
  | {
      ok: true;
      generatedAt: string;
      spine: {
        totalSucceededMinor: number;
        totalLast30dMinor: number;
        divisions: SpineDivisionRevenue[];
        scanCapped: boolean;
      };
      recorded: RecordedDivisionRevenue[];
      /** Official divisions with no measured money on either ledger. */
      unmeasured: string[];
    }
  | { ok: false; reason: "timeout" | "unavailable" };

type IntentRow = {
  division: string | null;
  amount_minor: number | string | null;
  status: string | null;
  created_at: string | null;
};

const num = (v: number | string | null | undefined): number => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? Number(n) : 0;
};

/** Naira floats from the legacy books → kobo integers, once, at the boundary. */
const nairaToKobo = (v: number | string | null | undefined): number => Math.round(num(v) * 100);

const normalizeDivision = (v: string | null | undefined): string => {
  const slug = String(v || "").trim().toLowerCase();
  return slug || "unallocated";
};

/** The finance console's succeeded-volume semantics: money that settled, even if later refunded. */
const isSucceededVolume = (status: string | null): boolean =>
  status === "succeeded" || status === "refund_processing" || status === "refunded";

async function pageAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  limit: number,
): Promise<{ rows: T[]; capped: boolean }> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; from < limit; from += pageSize) {
    const { data, error } = await fetchPage(from, Math.min(from + pageSize, limit) - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return { rows, capped: false };
  }
  return { rows, capped: true };
}

async function readSnapshot(): Promise<DivisionRevenueSnapshot> {
  const sb = createAdminSupabase();
  const now = Date.now();
  const dayMs = 86_400_000;
  const cut7d = new Date(now - 7 * dayMs).toISOString();
  const cut30d = new Date(now - SERIES_DAYS * dayMs).toISOString();

  const [intentsRes, care, marketplace, learn, studio] = await Promise.all([
    sb
      .from("payment_intents")
      .select("division,amount_minor,status,created_at")
      .order("created_at", { ascending: false })
      .limit(INTENT_SCAN_LIMIT),
    pageAll<{ amount: number | string | null }>(
      (from, to) => sb.from("care_payments").select("amount").range(from, to),
      RECORDED_SCAN_LIMIT,
    ),
    pageAll<{ amount: number | string | null }>(
      (from, to) =>
        sb.from("marketplace_payment_records").select("amount").eq("status", "verified").range(from, to),
      RECORDED_SCAN_LIMIT,
    ),
    pageAll<{ total_kobo: number | string | null }>(
      (from, to) =>
        sb
          .from("customer_invoices")
          .select("total_kobo")
          .eq("division", "learn")
          .eq("status", "paid")
          .range(from, to),
      RECORDED_SCAN_LIMIT,
    ),
    pageAll<{ amount_kobo: number | string | null }>(
      (from, to) => sb.from("studio_payments").select("amount_kobo").eq("status", "verified").range(from, to),
      RECORDED_SCAN_LIMIT,
    ),
  ]);

  if (intentsRes.error) throw intentsRes.error;
  const intents = (intentsRes.data ?? []) as IntentRow[];

  // ── Spine: per-division aggregation + 30-day daily series ──
  const byDivision = new Map<
    string,
    {
      succeededMinor: number;
      last7dMinor: number;
      last30dMinor: number;
      intentCount: number;
      days: Map<string, number>;
    }
  >();
  for (const intent of intents) {
    const division = normalizeDivision(intent.division);
    const entry =
      byDivision.get(division) ??
      { succeededMinor: 0, last7dMinor: 0, last30dMinor: 0, intentCount: 0, days: new Map<string, number>() };
    entry.intentCount += 1;
    if (isSucceededVolume(intent.status)) {
      const amount = num(intent.amount_minor);
      entry.succeededMinor += amount;
      const createdAt = intent.created_at || "";
      if (createdAt >= cut7d) entry.last7dMinor += amount;
      if (createdAt >= cut30d) {
        entry.last30dMinor += amount;
        const day = createdAt.slice(0, 10);
        entry.days.set(day, (entry.days.get(day) ?? 0) + amount);
      }
    }
    byDivision.set(division, entry);
  }

  const seriesDates: string[] = [];
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    seriesDates.push(new Date(now - i * dayMs).toISOString().slice(0, 10));
  }

  const spineDivisions: SpineDivisionRevenue[] = [...byDivision.entries()]
    .map(([division, v]) => ({
      division,
      succeededMinor: v.succeededMinor,
      last7dMinor: v.last7dMinor,
      last30dMinor: v.last30dMinor,
      intentCount: v.intentCount,
      series: seriesDates.map((date) => ({ date, volumeMinor: v.days.get(date) ?? 0 })),
    }))
    .sort((a, b) => b.succeededMinor - a.succeededMinor);

  const recorded: RecordedDivisionRevenue[] = [
    {
      division: "care" as const,
      recordedMinor: care.rows.reduce((sum, r) => sum + nairaToKobo(r.amount), 0),
      rowCount: care.rows.length,
      source: "care_payments",
      capped: care.capped,
    },
    {
      division: "marketplace" as const,
      recordedMinor: marketplace.rows.reduce((sum, r) => sum + nairaToKobo(r.amount), 0),
      rowCount: marketplace.rows.length,
      source: "marketplace_payment_records (verified)",
      capped: marketplace.capped,
    },
    {
      division: "learn" as const,
      recordedMinor: learn.rows.reduce((sum, r) => sum + num(r.total_kobo), 0),
      rowCount: learn.rows.length,
      source: "customer_invoices (learn, paid)",
      capped: learn.capped,
    },
    {
      division: "studio" as const,
      recordedMinor: studio.rows.reduce((sum, r) => sum + num(r.amount_kobo), 0),
      rowCount: studio.rows.length,
      source: "studio_payments (verified)",
      capped: studio.capped,
    },
  ];

  const measured = new Set<string>([
    ...spineDivisions.filter((d) => d.succeededMinor > 0).map((d) => d.division),
    ...recorded.filter((r) => r.recordedMinor > 0).map((r) => r.division),
  ]);
  const unmeasured = OWNER_DIVISION_SLUGS.filter((slug) => !measured.has(slug));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    spine: {
      totalSucceededMinor: spineDivisions.reduce((sum, d) => sum + d.succeededMinor, 0),
      totalLast30dMinor: spineDivisions.reduce((sum, d) => sum + d.last30dMinor, 0),
      divisions: spineDivisions,
      scanCapped: intents.length >= INTENT_SCAN_LIMIT,
    },
    recorded,
    unmeasured,
  };
}

const readSnapshotCached = unstable_cache(
  async (): Promise<DivisionRevenueSnapshot | null> => {
    try {
      return await readSnapshot();
    } catch {
      // Never cache a failure — the next request retries against the database.
      return null;
    }
  },
  ["owner-command-division-revenue"],
  { revalidate: CACHE_SECONDS, tags: ["owner-command-revenue"] },
);

export async function getDivisionRevenueSnapshot(): Promise<DivisionRevenueSnapshot> {
  try {
    const result = await Promise.race<DivisionRevenueSnapshot | null | "timeout">([
      readSnapshotCached(),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
    ]);
    if (result === "timeout") return { ok: false, reason: "timeout" };
    return result ?? { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
