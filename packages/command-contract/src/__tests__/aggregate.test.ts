import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attentionItemId,
  type AttentionItem,
  type AttentionPriority,
  type AttentionStatus,
  type Division,
} from "../types";
import {
  prioritySort,
  countByPriority,
  groupByDivision,
  moneyAtStake,
  summarizeForOwner,
} from "../aggregate";

function mk(o: {
  id: string;
  division: Division;
  priority: AttentionPriority;
  createdAt: string;
  status?: AttentionStatus;
  amountMinor?: number;
  currency?: string;
}): AttentionItem {
  return {
    id: attentionItemId(o.id),
    division: o.division,
    type: "support-escalation",
    priority: o.priority,
    surface: "both",
    status: o.status ?? "open",
    title: `t-${o.id}`,
    summary: "s",
    actionLabel: "Act",
    deepLink: `/x/${o.id}`,
    createdAt: o.createdAt,
    amountMinor: o.amountMinor ?? null,
    currency: o.currency ?? null,
    staffScope: [],
  };
}

const FEED: AttentionItem[] = [
  mk({ id: "a", division: "marketplace", priority: "critical", createdAt: "2026-06-04T03:00:00Z", amountMinor: 500000, currency: "NGN" }),
  mk({ id: "b", division: "marketplace", priority: "high", createdAt: "2026-06-04T02:00:00Z" }),
  mk({ id: "c", division: "learn", priority: "medium", createdAt: "2026-06-04T01:00:00Z", status: "resolved" }),
  mk({ id: "d", division: "learn", priority: "critical", createdAt: "2026-06-04T04:00:00Z", amountMinor: 200000, currency: "NGN" }),
  mk({ id: "e", division: "care", priority: "low", createdAt: "2026-06-04T00:00:00Z", status: "dismissed" }),
  mk({ id: "f", division: "marketplace", priority: "critical", createdAt: "2026-06-04T05:00:00Z", amountMinor: 1000, currency: "USD" }),
];

describe("attention aggregation", () => {
  it("prioritySort orders by priority desc, then newest first within a tier", () => {
    assert.deepEqual(
      prioritySort(FEED).map((i) => i.id),
      ["f", "d", "a", "b", "c", "e"],
    );
  });

  it("prioritySort does not mutate the input array", () => {
    const before = FEED.map((i) => i.id);
    prioritySort(FEED);
    assert.deepEqual(FEED.map((i) => i.id), before);
  });

  it("countByPriority tallies each tier", () => {
    assert.deepEqual(countByPriority(FEED), { critical: 3, high: 1, medium: 1, low: 1 });
  });

  it("groupByDivision groups items in encounter order", () => {
    const g = groupByDivision(FEED);
    assert.deepEqual(g.get("marketplace")!.map((i) => i.id), ["a", "b", "f"]);
    assert.deepEqual(g.get("learn")!.map((i) => i.id), ["c", "d"]);
    assert.deepEqual(g.get("care")!.map((i) => i.id), ["e"]);
  });

  it("moneyAtStake sums minor units per currency, ignoring money-less items, biggest first", () => {
    assert.deepEqual(moneyAtStake(FEED), [
      { currency: "NGN", amountMinor: 700000 },
      { currency: "USD", amountMinor: 1000 },
    ]);
  });

  it("summarizeForOwner reports totals, open count, priority mix, money, and per-division rollup", () => {
    const s = summarizeForOwner(FEED);
    assert.equal(s.total, 6);
    assert.equal(s.open, 4); // resolved + dismissed excluded
    assert.deepEqual(s.byPriority, { critical: 3, high: 1, medium: 1, low: 1 });
    assert.deepEqual(s.moneyAtStake, [
      { currency: "NGN", amountMinor: 700000 },
      { currency: "USD", amountMinor: 1000 },
    ]);
    // divisions sorted by critical count desc, then total desc
    assert.deepEqual(
      s.divisions.map((d) => d.division),
      ["marketplace", "learn", "care"],
    );
    const mkt = s.divisions.find((d) => d.division === "marketplace")!;
    assert.equal(mkt.total, 3);
    assert.equal(mkt.open, 3);
    assert.equal(mkt.critical, 2);
    const learn = s.divisions.find((d) => d.division === "learn")!;
    assert.equal(learn.open, 1); // c is resolved
    assert.equal(learn.critical, 1);
  });
});
