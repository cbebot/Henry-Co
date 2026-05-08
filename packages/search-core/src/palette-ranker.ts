/**
 * Palette ranker — multi-signal, deterministic, RLS-respecting
 * ranking for the Cmd+K palette.
 *
 * Lives in search-core (rather than search-ui) because:
 *   - It has no React surface — pure data transform.
 *   - Jest is already configured in search-core, and the ranker is
 *     security-critical (a bug here can downrank or hide commands a
 *     user is eligible to see). Tests live alongside.
 *
 * Operates on a generic shape (`RankablePaletteRow`) so search-ui
 * can extend it with React-side fields. Concrete `PaletteRow` in
 * search-ui structurally satisfies this interface.
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
 * Determinism: given identical inputs the ordering is identical
 * across renders. Ties break alphabetically by `key`.
 */

export interface RankablePaletteRow {
  /** Stable id within the palette — used as React key + for tie-break sort. */
  key: string;
  /** Source identifier. */
  kind: "command" | "search" | "recent" | "suggestion";
  /** The visible label. */
  label: string;
  /** Optional kicker (division / module hint). */
  kicker: string | null;
  /** Destination URL — drives recency lookup. */
  href: string;
  /** Right-aligned meta — tested against scope on alignment boost. */
  meta: string | null;
}

export interface RankableStoredRecent {
  href: string;
  /** ms-epoch when the user last activated this row. */
  lastUsedAt: number;
}

export interface RankerInput<R extends RankablePaletteRow> {
  /** The trimmed lowercased query. Empty = idle ranking. */
  query: string;
  /** The currently-selected scope chip (division/source slug), or null. */
  scope: string | null;
  /** Stored recents — used to compute recency + frequency. */
  recents: ReadonlyArray<RankableStoredRecent>;
  /** The flat row list pre-grouping. */
  rows: ReadonlyArray<R>;
  /** Override Date.now for deterministic tests. */
  now?: () => number;
}

export interface RankerOutput<R extends RankablePaletteRow> {
  rows: R[];
  /** Score per row (same order as rows). Useful for debugging. */
  scores: number[];
}

const TRIGRAPH_LENGTH = 3;
const RECENCY_HALF_LIFE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RECENCY_HORIZON_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Rank a flat row list. Returns the rows in descending score order
 * with the score array aligned to the new ordering.
 *
 * Stability: ties are broken alphabetically by `key` so re-renders
 * with the same inputs produce identical orderings.
 */
export function rankPaletteRows<R extends RankablePaletteRow>(
  input: RankerInput<R>,
): RankerOutput<R> {
  const { query, scope, recents, rows } = input;
  const now = input.now ?? Date.now;

  const nowMs = now();

  // Only consider recents within the horizon — stale entries
  // contribute neither a recency NOR a frequency boost. This keeps
  // affinityBoost() symmetric (a row past the horizon scores 0 from
  // affinity by construction) and matches the determinism contract.
  const recencyMap = new Map<string, RankableStoredRecent>();
  const frequencyMap = new Map<string, number>();
  for (const r of recents) {
    if (nowMs - r.lastUsedAt >= RECENCY_HORIZON_MS) continue;
    // Keep the freshest entry per href (recents are append-style at
    // write time; the most recent activation is the head of the array).
    const existing = recencyMap.get(r.href);
    if (!existing || r.lastUsedAt > existing.lastUsedAt) {
      recencyMap.set(r.href, r);
    }
    frequencyMap.set(r.href, (frequencyMap.get(r.href) ?? 0) + 1);
  }

  const trimmed = query.trim().toLowerCase();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const trigrams = trimmed.length >= TRIGRAPH_LENGTH ? toTrigrams(trimmed) : [];

  type Scored = { row: R; score: number; rowIndex: number };
  const scored: Scored[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    let score = 0;

    if (trimmed.length > 0) {
      score += textualScore(row, trimmed, tokens, trigrams);
    }

    score += affinityBoost(row, recencyMap, frequencyMap, scope, nowMs);

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

function textualScore<R extends RankablePaletteRow>(
  row: R,
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

function affinityBoost<R extends RankablePaletteRow>(
  row: R,
  recencyMap: Map<string, RankableStoredRecent>,
  frequencyMap: Map<string, number>,
  scope: string | null,
  nowMs: number,
): number {
  let boost = 0;

  const recent = recencyMap.get(row.href);
  if (recent) {
    // recencyMap is pre-filtered to within RECENCY_HORIZON_MS, so any
    // hit here is still in-horizon. Exponential decay — half-life 7
    // days, capped at 0.4.
    const age = nowMs - recent.lastUsedAt;
    const decay = Math.exp(-Math.LN2 * (age / RECENCY_HALF_LIFE_MS));
    boost += 0.4 * decay;
  }

  // frequencyMap is built from the same pre-filtered set, so a stale
  // recent contributes neither recency nor frequency.
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
