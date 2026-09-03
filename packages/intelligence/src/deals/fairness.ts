/**
 * V3-35 — the impression-fairness audit (pure; DB-less).
 *
 * Consumes windowed `deal_impressions` aggregates (creatorKey + scope per
 * row) and flags any creator whose share of a scope's impressions exceeds the
 * governed cap. The cron handler feeds it service-role reads and emits
 * `henry.deal.fairness.alerted` per finding; the owner tile renders the same
 * shares. Aggregates only — no user identity ever enters or leaves this
 * function (PRIVACY-NDPR §3c: counts, not per-user rows).
 */

export type FairnessImpression = {
  /** The creator grouping key (partner id, or the stable platform key). */
  creatorKey: string;
  /** Audit scope — a division slug, or "all" for the cross-division pool. */
  scope: string;
};

export type FairnessConfig = {
  /** Max share (0..1) of a scope's impressions one creator may hold. */
  maxCreatorImpressionShare: number;
  /** Alerts fire only once a scope has at least this many impressions. */
  minImpressionsForAlert: number;
};

export type FairnessAlert = {
  scope: string;
  creatorKey: string;
  impressions: number;
  totalImpressions: number;
  /** The creator's share of the scope (0..1, 4-dp rounded aggregate). */
  share: number;
};

export type CreatorShare = {
  scope: string;
  creatorKey: string;
  impressions: number;
  share: number;
};

/** Aggregate windowed impressions into per-scope creator shares (deterministic order). */
export function computeCreatorShares(
  rows: ReadonlyArray<FairnessImpression>,
): CreatorShare[] {
  // Nested maps (scope -> creator -> count): no string-key packing, so scope
  // and creator values may contain any characters.
  const byScope = new Map<string, Map<string, number>>();
  for (const row of rows) {
    let creators = byScope.get(row.scope);
    if (!creators) {
      creators = new Map<string, number>();
      byScope.set(row.scope, creators);
    }
    creators.set(row.creatorKey, (creators.get(row.creatorKey) ?? 0) + 1);
  }
  const shares: CreatorShare[] = [];
  for (const [scope, creators] of byScope) {
    let total = 0;
    for (const count of creators.values()) total += count;
    for (const [creatorKey, impressions] of creators) {
      shares.push({
        scope,
        creatorKey,
        impressions,
        share: total > 0 ? Math.round((impressions / total) * 10000) / 10000 : 0,
      });
    }
  }
  shares.sort((a, b) =>
    a.scope !== b.scope
      ? a.scope < b.scope
        ? -1
        : 1
      : b.impressions !== a.impressions
        ? b.impressions - a.impressions
        : a.creatorKey < b.creatorKey
          ? -1
          : 1,
  );
  return shares;
}

/**
 * The audit: flag every creator whose share exceeds the cap in a scope that
 * has cleared the minimum-volume bar. Deterministic (scope asc, impressions
 * desc, creator asc). An empty input yields no alerts.
 */
export function auditImpressionFairness(
  rows: ReadonlyArray<FairnessImpression>,
  config: FairnessConfig,
): FairnessAlert[] {
  const scopeTotals = new Map<string, number>();
  for (const row of rows) {
    scopeTotals.set(row.scope, (scopeTotals.get(row.scope) ?? 0) + 1);
  }
  const alerts: FairnessAlert[] = [];
  for (const share of computeCreatorShares(rows)) {
    const total = scopeTotals.get(share.scope) ?? 0;
    if (total < config.minImpressionsForAlert) continue;
    if (share.share <= config.maxCreatorImpressionShare) continue;
    alerts.push({
      scope: share.scope,
      creatorKey: share.creatorKey,
      impressions: share.impressions,
      totalImpressions: total,
      share: share.share,
    });
  }
  return alerts;
}
