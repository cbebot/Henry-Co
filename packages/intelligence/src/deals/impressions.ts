/**
 * V3-35 — the impression write-amplification budget (pure; DB-less).
 *
 * Impressions are recorded SERVICE-ROLE and BATCHED: the server collects the
 * deals actually rendered in one surface render and issues ONE insert
 * statement for the whole batch. The client never drives an impression write.
 * This helper is that budget, made testable: dedupe within the render and a
 * hard row cap, so a hostile or buggy caller can never amplify one render
 * into unbounded rows.
 */

import type { DealSurfaceKind } from "./types";

export type DealImpressionEntry = {
  dealId: string;
  /** Null on anonymous surfaces. */
  userId: string | null;
  surface: DealSurfaceKind;
};

/** Hard per-render row cap — a surface never renders more deals than this. */
export const MAX_IMPRESSION_ROWS_PER_BATCH = 24;

/**
 * Dedupe (dealId+userId+surface) and cap the batch. Deterministic: first
 * occurrence wins, input order preserved.
 */
export function buildImpressionBatch(
  entries: ReadonlyArray<DealImpressionEntry>,
  maxRows: number = MAX_IMPRESSION_ROWS_PER_BATCH,
): DealImpressionEntry[] {
  const cap = Math.max(0, Math.min(maxRows, MAX_IMPRESSION_ROWS_PER_BATCH));
  const seen = new Set<string>();
  const out: DealImpressionEntry[] = [];
  for (const entry of entries) {
    if (out.length >= cap) break;
    if (!entry.dealId) continue;
    const key = `${entry.dealId}|${entry.userId ?? ""}|${entry.surface}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ dealId: entry.dealId, userId: entry.userId ?? null, surface: entry.surface });
  }
  return out;
}
