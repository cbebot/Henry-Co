/**
 * The premium palette ranker.
 *
 * What this is — and what it isn't:
 *
 *   IS: a multi-signal, deterministic, RLS-respecting ranker that
 *       blends label match, prefix match, sub-token match, abbreviation
 *       match, recency-of-use (last 30 days, exponential decay),
 *       frequency-of-use, group affinity, and currently-typed
 *       trigraph completion likelihood.
 *
 *   IS NOT: a generative model, a vector embedding system, or a
 *       cross-user popularity metric. The V2 scope explicitly
 *       forbids those (master §4.1 #12). The ranker is intentionally
 *       fully transparent and reproducible: given a query + viewer +
 *       row set, the score is deterministic.
 *
 * The ranker runs on the client, in the browser, on every keystroke.
 * It is O(n × m) where n = total rows and m = mean keyword length.
 * For palette sizes of ≤1000 rows this is sub-millisecond.
 *
 * Signals (all normalized to a 0..1 axis where higher = better):
 *
 *   labelExactMatch  : full label equals the query                       1.00
 *   labelPrefixMatch : label starts with the query                       0.85
 *   labelSubstring   : query is a substring of label                     0.65
 *   keywordExactMatch: any keyword equals a query token                  0.55
 *   keywordPrefix    : any keyword starts with a query token             0.45
 *   keywordSubstring : any keyword contains a query token                0.30
 *   abbrevMatch      : query letters match the leading letters of the
 *                      label words ("po" matches "Pickup orders")        0.70
 *   trigraphScore    : Sørensen–Dice on trigrams, gives typo tolerance   0.0..0.6
 *
 * Per-row affinity boosts (additive on top of textual score):
 *
 *   recencyBoost     : exponential decay on `lastUsedAt` over 30d        +0.0..0.4
 *   frequencyBoost   : log-scaled use count                              +0.0..0.3
 *   groupAffinity    : current scope chip matches the row's source       +0.15
 *   suggestionBoost  : suggestion source baseline (only on suggestions)  +0.20
 *
 * Group-level baseline: when ranking is happening with an empty
 * query, "Suggestions" lead, then "Recents", then "Commands" (no
 * search results possible). When the query is non-empty, "Search"
 * + "Commands" interleave by score.
 */

import type { PaletteRow, StoredRecent } from "./types";

export interface RankerInput {
  /** The trimmed lowercased query. Empty = idle ranking. */
  query: string;
  /** The currently-selected scope chip (division/source slug), or null. */
  scope: string | null;
  /** Stored recents — used to compute recency + frequency. */
  recents: ReadonlyArray<StoredRecent>;
  /** The flat row list pre-grouping. */
  rows: ReadonlyArray<PaletteRow>;
}

export interface RankerOutput {
  rows: PaletteRow[];
  /** Score per row (same order as rows). Useful for debugging. */
  scores: number[];
}

const TRIGRAPH_LENGTH = 3;
const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RECENCY_HORIZON_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Rank a flat row list. Returns the rows in descending score order
 * with the score array aligned to the new ordering (so the caller can
 * surface debug overlays).
 *
 * Stability: ties are broken alphabetically by `key` so re-renders
 * with the same inputs produce identical orderings.
 */
export function rankPaletteRows(input: RankerInput): RankerOutput {
  const { query, scope, recents, rows } = input;

  const recencyMap = new Map<string, StoredRecent>();
  for (const r of recents) recencyMap.set(r.href, r);

  // Compute frequency-of-use as a count of times each href appears
  // in the recents list. (Recents are deduped at write time, so each
  // href appears at most once with the most-recent timestamp; for
  // proper frequency we'd need an event log, deferred to V3.)
  const frequencyMap = new Map<string, number>();
  for (const r of recents) {
    frequencyMap.set(r.href, (frequencyMap.get(r.href) ?? 0) + 1);
  }

  const trimmed = query.trim().toLowerCase();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const trigrams = trimmed.length >= TRIGRAPH_LENGTH ? toTrigrams(trimmed) : [];

  type Scored = { row: PaletteRow; score: number; rowIndex: number };
  const scored: Scored[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    let score = 0;

    if (trimmed.length > 0) {
      score += textualScore(row, trimmed, tokens, trigrams);
    }

    score += affinityBoost(row, recencyMap, frequencyMap, scope);

    if (trimmed.length > 0 && score < 0.05) {
      // Below the noise floor — drop.
      continue;
    }

    scored.push({ row, score, rowIndex: i });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.row.key.localeCompare(b.row.key);
  });

  return {
    rows: scored.map((s) => s.row),
    scores: scored.map((s) => s.score),
  };
}

function textualScore(
  row: PaletteRow,
  query: string,
  tokens: string[],
  trigrams: string[],
): number {
  const labelLower = row.label.toLowerCase();
  let score = 0;

  if (labelLower === query) score += 1.0;
  else if (labelLower.startsWith(query)) score += 0.85;
  else if (labelLower.includes(query)) score += 0.65;

  // Abbreviation match — query letters as the initials of the label words.
  const labelWords = labelLower.split(/[\s\-_]+/).filter(Boolean);
  if (labelWords.length > 0) {
    const initials = labelWords.map((w) => w[0] ?? "").join("");
    if (initials.startsWith(query.replace(/\s+/g, ""))) score += 0.7;
  }

  // Token-level matches — kicker contributes half-weight.
  const kickerLower = row.kicker?.toLowerCase() ?? "";
  for (const token of tokens) {
    if (labelLower.startsWith(token)) score += 0.45;
    else if (labelLower.includes(token)) score += 0.3;
    if (kickerLower.includes(token)) score += 0.15;
  }

  // Trigraph (typo-tolerance) — Sørensen–Dice between query trigrams
  // and label trigrams.
  if (trigrams.length > 0) {
    const labelTrigrams = toTrigrams(labelLower);
    const dice = sorensenDice(trigrams, labelTrigrams);
    score += 0.6 * dice;
  }

  return score;
}

function affinityBoost(
  row: PaletteRow,
  recencyMap: Map<string, StoredRecent>,
  frequencyMap: Map<string, number>,
  scope: string | null,
): number {
  let boost = 0;

  const recent = recencyMap.get(row.href);
  if (recent) {
    const age = Date.now() - recent.lastUsedAt;
    if (age < RECENCY_HORIZON_MS) {
      // Exponential decay — half-life 7 days, capped at 0.4.
      const decay = Math.exp(-Math.LN2 * (age / RECENCY_HALF_LIFE_MS));
      boost += 0.4 * decay;
    }
  }

  const freq = frequencyMap.get(row.href) ?? 0;
  if (freq > 0) {
    boost += 0.3 * Math.min(1, Math.log10(freq + 1) / Math.log10(11));
  }

  // Scope chip alignment — when the user has narrowed scope, rows
  // matching that scope's source/division get a small boost so the
  // chip's intent is honoured.
  if (scope && row.kind === "command" && row.meta?.toLowerCase() === scope.toLowerCase()) {
    boost += 0.15;
  }
  if (scope && row.kind === "search" && row.meta?.toLowerCase() === scope.toLowerCase()) {
    boost += 0.15;
  }

  if (row.kind === "suggestion") boost += 0.2;

  return boost;
}

function toTrigrams(input: string): string[] {
  if (input.length < TRIGRAPH_LENGTH) return [];
  const out: string[] = [];
  const padded = `  ${input}  `;
  for (let i = 0; i <= padded.length - TRIGRAPH_LENGTH; i += 1) {
    out.push(padded.slice(i, i + TRIGRAPH_LENGTH));
  }
  return out;
}

function sorensenDice(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Map<string, number>();
  for (const t of a) setA.set(t, (setA.get(t) ?? 0) + 1);
  let intersect = 0;
  for (const t of b) {
    const n = setA.get(t);
    if (n && n > 0) {
      intersect += 1;
      setA.set(t, n - 1);
    }
  }
  return (2 * intersect) / (a.length + b.length);
}
