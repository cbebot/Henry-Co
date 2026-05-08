/**
 * Command-aggregator probes — DASH-5 elevation.
 *
 * Tests the pure helpers exported alongside `collectModuleCommands`:
 *   - rankCommands(): recency desc → group order → id asc
 *   - filterCommandsByQuery(): label/kicker/keyword scoring
 *
 * Runtime: node:test via tsx --test.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { rankCommands, filterCommandsByQuery } from "../command-aggregator";
import type { PaletteEntry } from "../command-palette";

function entry(partial: Partial<PaletteEntry> & {
  id: string;
  label: string;
}): PaletteEntry {
  return {
    source: "customer-overview",
    groupLabel: "Open",
    keywords: [partial.label.toLowerCase()],
    href: `/${partial.id}`,
    ...partial,
  } as PaletteEntry;
}

describe("rankCommands", () => {
  it("orders recent-bearing entries above non-recent", () => {
    const out = rankCommands([
      entry({ id: "a", label: "Alpha" }),
      entry({ id: "b", label: "Bravo", recencyAt: 1700000000000 }),
    ]);
    assert.equal(out[0]!.id, "b");
    assert.equal(out[1]!.id, "a");
  });

  it("orders by group when recency is equal", () => {
    const out = rankCommands([
      entry({ id: "settings-x", label: "Settings X", groupLabel: "Settings" }),
      entry({ id: "open-x", label: "Open X", groupLabel: "Open" }),
      entry({ id: "create-x", label: "Create X", groupLabel: "Create" }),
      entry({ id: "help-x", label: "Help X", groupLabel: "Help" }),
    ]);
    assert.deepEqual(
      out.map((e) => e.id),
      ["open-x", "create-x", "settings-x", "help-x"],
    );
  });

  it("breaks ties by id alphabetically (determinism)", () => {
    const out = rankCommands([
      entry({ id: "zeta", label: "Zeta", groupLabel: "Open" }),
      entry({ id: "alpha", label: "Alpha", groupLabel: "Open" }),
      entry({ id: "mu", label: "Mu", groupLabel: "Open" }),
    ]);
    assert.deepEqual(
      out.map((e) => e.id),
      ["alpha", "mu", "zeta"],
    );
  });

  it("does not mutate the input array", () => {
    const input: PaletteEntry[] = [
      entry({ id: "b", label: "Bravo", recencyAt: 1 }),
      entry({ id: "a", label: "Alpha" }),
    ];
    const snapshot = input.map((e) => e.id).join(",");
    rankCommands(input);
    assert.equal(input.map((e) => e.id).join(","), snapshot);
  });
});

describe("filterCommandsByQuery", () => {
  const corpus: PaletteEntry[] = [
    entry({
      id: "wallet-add",
      label: "Add money",
      kicker: "Wallet",
      keywords: ["add money", "fund wallet", "topup"],
    }),
    entry({
      id: "wallet-withdraw",
      label: "Withdraw",
      kicker: "Wallet",
      keywords: ["withdraw", "cash out"],
    }),
    entry({
      id: "support-new",
      label: "Get help",
      kicker: "Support",
      keywords: ["support", "help", "ticket"],
    }),
  ];

  it("returns the corpus unchanged on an empty query", () => {
    const out = filterCommandsByQuery(corpus, "");
    assert.equal(out.length, corpus.length);
  });

  it("scores label hits above kicker hits", () => {
    const out = filterCommandsByQuery(corpus, "wallet");
    // Both Wallet rows match via kicker; neither has "wallet" in label.
    // Order should still be deterministic by id.
    assert.equal(out[0]!.id, "wallet-add");
    assert.equal(out[1]!.id, "wallet-withdraw");
  });

  it("matches via the keywords array (not just label)", () => {
    const out = filterCommandsByQuery(corpus, "topup");
    assert.equal(out.length, 1);
    assert.equal(out[0]!.id, "wallet-add");
  });

  it("filters out entries that match no token", () => {
    const out = filterCommandsByQuery(corpus, "completely-unrelated");
    assert.equal(out.length, 0);
  });

  it("ranks a label match above a keyword-only match", () => {
    const out = filterCommandsByQuery(corpus, "withdraw");
    // wallet-withdraw has "withdraw" in label (score 2 + keyword 2);
    // no other row matches.
    assert.equal(out[0]!.id, "wallet-withdraw");
  });

  it("supports multi-token queries", () => {
    const out = filterCommandsByQuery(corpus, "get help");
    assert.equal(out[0]!.id, "support-new");
  });
});
