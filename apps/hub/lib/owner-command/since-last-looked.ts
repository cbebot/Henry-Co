import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * owner-command/since-last-looked — the "while you were away" delta (OCC-3, W1).
 *
 * The command home greets the owner with what MOVED since the last visit, not
 * just the standing totals. Exact reads (head counts + a bounded succeeded-intent
 * sum) against a caller-supplied timestamp — never sampled. Best-effort: a failed
 * read returns a null delta so the home never breaks on this ornament.
 */

const TIMEOUT_MS = 5000;
/** Bound the succeeded-intent scan so a huge gap can't run away; capped is reported. */
const INTENT_SCAN_LIMIT = 5000;

export type SinceLastLooked = {
  sinceIso: string;
  newSignups: number;
  settledMinor: number;
  /** True if the settled sum hit the scan bound and may undercount. */
  capped: boolean;
};

const num = (v: number | string | null | undefined): number => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? Number(n) : 0;
};

const isSucceededVolume = (status: string | null): boolean =>
  status === "succeeded" || status === "refund_processing" || status === "refunded";

async function read(sinceIso: string): Promise<SinceLastLooked> {
  const sb = createAdminSupabase();

  const [signupsRes, intentsRes] = await Promise.all([
    sb
      .from("customer_profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso),
    sb
      .from("payment_intents")
      .select("amount_minor,status")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(INTENT_SCAN_LIMIT),
  ]);

  if (signupsRes.error) throw signupsRes.error;
  if (intentsRes.error) throw intentsRes.error;

  const rows = (intentsRes.data ?? []) as Array<{ amount_minor: number | string | null; status: string | null }>;
  const settledMinor = rows.reduce(
    (sum, r) => sum + (isSucceededVolume(r.status) ? num(r.amount_minor) : 0),
    0,
  );

  return {
    sinceIso,
    newSignups: signupsRes.count ?? 0,
    settledMinor,
    capped: rows.length >= INTENT_SCAN_LIMIT,
  };
}

export async function getSinceLastLooked(sinceIso: string | null): Promise<SinceLastLooked | null> {
  if (!sinceIso) return null;
  const parsed = Date.parse(sinceIso);
  if (!Number.isFinite(parsed)) return null;
  // Ignore future / absurd timestamps (a tampered cookie).
  if (parsed > Date.now()) return null;

  try {
    const result = await Promise.race<SinceLastLooked | null | "timeout">([
      read(new Date(parsed).toISOString()),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
    ]);
    return result === "timeout" ? null : result;
  } catch {
    return null;
  }
}
