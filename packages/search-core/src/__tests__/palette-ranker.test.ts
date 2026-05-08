/**
 * Palette ranker probes — DASH-5 verification.
 *
 * These tests pin the ranker's behaviour for the high-value cases
 * that "feel right" matters most:
 *   - exact-label match always ranks highest
 *   - prefix beats substring beats trigraph
 *   - typo tolerance — one-letter typo still ranks within reach
 *   - recency boost decays over 7 days (half-life)
 *   - frequency boost saturates
 *   - scope chip alignment lifts matching division
 *   - empty query + no recents = stable order by key
 *   - filter-out below noise floor when the query is non-empty
 */

import { describe, it, expect } from "@jest/globals";

import {
  rankPaletteRows,
  type RankablePaletteRow,
  type RankableStoredRecent,
} from "../palette-ranker";

function row(
  partial: Partial<RankablePaletteRow> & {
    key: string;
    label: string;
    href: string;
  },
): RankablePaletteRow {
  return {
    kind: "command",
    kicker: null,
    meta: null,
    ...partial,
  };
}

const RIGHT_NOW = 1_700_000_000_000; // 2023-11-14
const NOW = () => RIGHT_NOW;

describe("rankPaletteRows", () => {
  describe("textual scoring", () => {
    it("ranks exact label match higher than prefix or substring", () => {
      const result = rankPaletteRows({
        query: "wallet",
        scope: null,
        recents: [],
        rows: [
          row({ key: "a", label: "Wallet", href: "/wallet" }),
          row({ key: "b", label: "Wallet activity", href: "/wallet/activity" }),
          row({ key: "c", label: "Open wallet", href: "/open" }),
        ],
        now: NOW,
      });
      expect(result.rows[0]!.key).toBe("a");
      expect(result.scores[0]).toBeGreaterThan(result.scores[1]!);
      expect(result.scores[1]).toBeGreaterThan(result.scores[2]!);
    });

    it("matches abbreviations of label words", () => {
      const result = rankPaletteRows({
        query: "po",
        scope: null,
        recents: [],
        rows: [
          row({ key: "po", label: "Pickup orders", href: "/pickup" }),
          row({ key: "po2", label: "Property", href: "/property" }),
        ],
        now: NOW,
      });
      // Pickup orders matches by "po" abbrev → ranks first.
      expect(result.rows[0]!.key).toBe("po");
    });

    it("tolerates a one-letter typo via trigraph match", () => {
      const result = rankPaletteRows({
        query: "withdrwa", // typo of "withdraw"
        scope: null,
        recents: [],
        rows: [
          row({ key: "with", label: "Withdraw", href: "/wallet/withdrawals" }),
          row({ key: "open", label: "Open library", href: "/learn" }),
        ],
        now: NOW,
      });
      // Even with the typo, Withdraw should surface above Open library.
      expect(result.rows[0]!.key).toBe("with");
    });

    it("drops rows below the noise floor when query is non-empty", () => {
      const result = rankPaletteRows({
        query: "verylongcompletely-different-string",
        scope: null,
        recents: [],
        rows: [
          row({ key: "a", label: "Wallet", href: "/wallet" }),
          row({ key: "b", label: "Property", href: "/property" }),
        ],
        now: NOW,
      });
      expect(result.rows).toHaveLength(0);
    });
  });

  describe("recency boost", () => {
    it("lifts a recently-used row above an equally-matched stale row", () => {
      const recents: RankableStoredRecent[] = [
        { href: "/wallet/activity", lastUsedAt: RIGHT_NOW - 60_000 }, // 1m ago
      ];
      const result = rankPaletteRows({
        query: "wal",
        scope: null,
        recents,
        rows: [
          row({ key: "stale", label: "Wallet", href: "/wallet" }),
          row({ key: "fresh", label: "Wallet activity", href: "/wallet/activity" }),
        ],
        now: NOW,
      });
      // The fresh row carries the recency boost; despite "Wallet"'s
      // shorter label match advantage, the recency lift puts
      // "Wallet activity" first.
      expect(result.rows[0]!.key).toBe("fresh");
    });

    it("does not boost rows older than 30 days", () => {
      const recents: RankableStoredRecent[] = [
        {
          href: "/wallet/activity",
          lastUsedAt: RIGHT_NOW - 31 * 24 * 60 * 60 * 1000,
        },
      ];
      const result = rankPaletteRows({
        query: "",
        scope: null,
        recents,
        rows: [row({ key: "old", label: "Wallet activity", href: "/wallet/activity" })],
        now: NOW,
      });
      expect(result.scores[0]).toBe(0);
    });
  });

  describe("scope alignment", () => {
    it("boosts rows with meta matching the scope chip", () => {
      const result = rankPaletteRows({
        query: "view",
        scope: "wallet",
        recents: [],
        rows: [
          row({
            key: "a",
            label: "View transactions",
            href: "/wallet",
            meta: "Wallet",
            kind: "command",
          }),
          row({
            key: "b",
            label: "View invoices",
            href: "/invoices",
            meta: "Account",
            kind: "command",
          }),
        ],
        now: NOW,
      });
      expect(result.rows[0]!.key).toBe("a");
    });
  });

  describe("determinism", () => {
    it("breaks ties by key alphabetically", () => {
      const result = rankPaletteRows({
        query: "",
        scope: null,
        recents: [],
        rows: [
          row({ key: "z", label: "Zeta", href: "/z" }),
          row({ key: "a", label: "Alpha", href: "/a" }),
          row({ key: "m", label: "Mu", href: "/m" }),
        ],
        now: NOW,
      });
      // All scores 0 (no query, no recents) — tie-break by key asc.
      expect(result.rows.map((r) => r.key)).toEqual(["a", "m", "z"]);
    });

    it("produces identical orderings on identical inputs", () => {
      const make = () => ({
        query: "wal",
        scope: null,
        recents: [],
        rows: [
          row({ key: "a", label: "Wallet", href: "/a" }),
          row({ key: "b", label: "Walk", href: "/b" }),
          row({ key: "c", label: "Wallaby", href: "/c" }),
        ],
        now: NOW,
      });
      const r1 = rankPaletteRows(make());
      const r2 = rankPaletteRows(make());
      expect(r1.rows.map((r) => r.key)).toEqual(r2.rows.map((r) => r.key));
      expect(r1.scores).toEqual(r2.scores);
    });
  });

  describe("suggestion baseline", () => {
    it("lifts suggestions on empty query with no recents", () => {
      const result = rankPaletteRows({
        query: "",
        scope: null,
        recents: [],
        rows: [
          row({ key: "cmd", label: "Command", kind: "command", href: "/c" }),
          row({ key: "sug", label: "Continue verification", kind: "suggestion", href: "/v" }),
        ],
        now: NOW,
      });
      expect(result.rows[0]!.key).toBe("sug");
    });
  });
});
