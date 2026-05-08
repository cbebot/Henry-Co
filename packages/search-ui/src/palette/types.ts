/**
 * DashboardCommandPalette — types shared across desktop / mobile / row.
 *
 * Four sources the palette merges:
 *   1. "command"     — a `WireCommand` from /api/dashboard/commands
 *   2. "search"      — a `UnifiedSearchResult` from /api/search
 *   3. "recent"      — a stored client-side recent (mirrors WireCommand
 *                       or UnifiedSearchResult shape minimally)
 *   4. "suggestion"  — a `PaletteSuggestion` from /api/dashboard/suggestions
 *
 * Each row exposes a `key`, `label`, `kicker`, `href`, and an
 * optional `meta` for the right-aligned chip. Merging the four
 * sources into a single row union lets the keyboard handler treat all
 * rows identically.
 */

import type { WireCommand } from "@henryco/dashboard-shell";
import type { PaletteSuggestion, UnifiedSearchResult } from "@henryco/search-core";

export type PaletteGroupKey =
  | "Suggestions"
  | "Commands"
  | "Search"
  | "Recents";

export type PaletteRowKind = "command" | "search" | "recent" | "suggestion";

export interface PaletteRow {
  /** Unique within the group (used as React key + aria-activedescendant). */
  key: string;
  kind: PaletteRowKind;
  /** Group this row was placed into. Drives section ordering + Tab cycle. */
  group: PaletteGroupKey;
  label: string;
  kicker: string | null;
  detail: string | null;
  href: string;
  /** Right-side meta — division name, "Recent", priority chip, etc. */
  meta: string | null;
  /** Optional shortcut hint (e.g. ["⌘", "1"]). */
  shortcut: string[] | null;
  /** Source identifier — passed back to recents storage on activate. */
  sourceId: string;
}

export interface PaletteGroup {
  key: PaletteGroupKey;
  /** Visible label for the group header. */
  label: string;
  rows: PaletteRow[];
}

/**
 * Stored row for client-side recents. We store only what we need to
 * re-render a row and re-navigate; we do NOT store role-derived flags
 * because role state is server-side truth.
 */
export interface StoredRecent {
  key: string;
  kind: PaletteRowKind;
  label: string;
  kicker: string | null;
  detail: string | null;
  href: string;
  meta: string | null;
  /** ms-epoch when the user last activated this row. */
  lastUsedAt: number;
}

export type SourceCommand = WireCommand;
export type SourceSearch = UnifiedSearchResult;
export type SourceSuggestion = PaletteSuggestion;
