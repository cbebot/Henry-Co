import {
  PRIORITY_RANK,
  type AttentionItem,
  type AttentionPriority,
  type Division,
} from "./types";

const TERMINAL = new Set<string>(["resolved", "dismissed"]);

/** An item is "open" while it still needs work — i.e. not in a terminal state. */
export function isOpenItem(item: AttentionItem): boolean {
  return !TERMINAL.has(item.status);
}

/** A new array sorted by priority (most urgent first), then newest first. Pure. */
export function prioritySort(items: readonly AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => {
    const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (byPriority !== 0) return byPriority;
    if (a.createdAt > b.createdAt) return -1;
    if (a.createdAt < b.createdAt) return 1;
    return 0;
  });
}

export function countByPriority(
  items: readonly AttentionItem[],
): Record<AttentionPriority, number> {
  const out: Record<AttentionPriority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const item of items) out[item.priority] += 1;
  return out;
}

/** Group items by source division, preserving encounter order within a group. */
export function groupByDivision(
  items: readonly AttentionItem[],
): Map<Division, AttentionItem[]> {
  const map = new Map<Division, AttentionItem[]>();
  for (const item of items) {
    const bucket = map.get(item.division);
    if (bucket) bucket.push(item);
    else map.set(item.division, [item]);
  }
  return map;
}

/** Sum money-bearing items by currency (minor units), biggest total first. */
export function moneyAtStake(
  items: readonly AttentionItem[],
): { currency: string; amountMinor: number }[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.amountMinor != null && item.amountMinor > 0 && item.currency) {
      totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amountMinor);
    }
  }
  return [...totals.entries()]
    .map(([currency, amountMinor]) => ({ currency, amountMinor }))
    .sort((a, b) => b.amountMinor - a.amountMinor || a.currency.localeCompare(b.currency));
}

export type DivisionSummary = {
  division: Division;
  total: number;
  open: number;
  critical: number;
  highestPriority: AttentionPriority | null;
};

export type OwnerCommandSummary = {
  total: number;
  open: number;
  byPriority: Record<AttentionPriority, number>;
  divisions: DivisionSummary[];
  moneyAtStake: { currency: string; amountMinor: number }[];
};

/**
 * The owner firehose rollup: totals, open count, priority mix, money-at-stake,
 * and a per-division summary sorted by criticality (then volume). This is the
 * shape the Owner Command Center overview renders.
 */
export function summarizeForOwner(items: readonly AttentionItem[]): OwnerCommandSummary {
  const divisions: DivisionSummary[] = [];
  for (const [division, bucket] of groupByDivision(items)) {
    let open = 0;
    let critical = 0;
    let highestPriority: AttentionPriority | null = null;
    for (const item of bucket) {
      if (isOpenItem(item)) open += 1;
      if (item.priority === "critical") critical += 1;
      if (highestPriority === null || PRIORITY_RANK[item.priority] > PRIORITY_RANK[highestPriority]) {
        highestPriority = item.priority;
      }
    }
    divisions.push({ division, total: bucket.length, open, critical, highestPriority });
  }
  divisions.sort(
    (a, b) => b.critical - a.critical || b.total - a.total || a.division.localeCompare(b.division),
  );

  return {
    total: items.length,
    open: items.filter(isOpenItem).length,
    byPriority: countByPriority(items),
    divisions,
    moneyAtStake: moneyAtStake(items),
  };
}
