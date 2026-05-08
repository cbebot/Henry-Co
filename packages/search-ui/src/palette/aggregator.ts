/**
 * Client-side aggregator that turns the four sources (commands,
 * search results, recents, suggestions) into ordered PaletteGroups.
 *
 * The keyboard handler reads from the flat row array; the surface
 * renders the groups in declared order with section labels.
 *
 * Group ordering, by query state:
 *
 *   query empty:
 *     1. Suggestions (when present)
 *     2. Commands (always — palette IS a command surface)
 *     3. Recents    (when present, query empty only)
 *
 *   query non-empty:
 *     1. Search results (highest signal — user typed)
 *     2. Commands (filtered by the query — they're navigable too)
 *
 * No row appears in more than one group within a single render. The
 * `href` is the dedup key.
 */

import type { PaletteEntry, WireCommand } from "@henryco/dashboard-shell";
import { filterCommandsByQuery } from "@henryco/dashboard-shell";
import type { PaletteSuggestion, UnifiedSearchResult } from "@henryco/search-core";

import type {
  PaletteGroup,
  PaletteGroupKey,
  PaletteRow,
  StoredRecent,
} from "./types";

const DIVISION_LABELS: Record<string, string> = {
  hub: "Hub",
  account: "Account",
  care: "Care",
  marketplace: "Marketplace",
  jobs: "Jobs",
  learn: "Learn",
  logistics: "Logistics",
  property: "Property",
  studio: "Studio",
  staff: "Staff",
  "customer-overview": "Account",
  wallet: "Wallet",
  building: "Building",
  hotel: "Hotel",
  notifications: "Notifications",
  settings: "Settings",
  support: "Support",
};

function divisionLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return DIVISION_LABELS[slug] ?? slug;
}

function commandToRow(command: WireCommand): PaletteRow {
  return {
    key: `cmd:${command.id}`,
    kind: "command",
    group: "Commands",
    label: command.label,
    kicker: command.kicker,
    detail: command.groupLabel,
    href: command.href ?? "#",
    meta: divisionLabel(command.source) || command.groupLabel,
    shortcut: command.shortcut,
    sourceId: command.id,
  };
}

function searchToRow(result: UnifiedSearchResult): PaletteRow {
  return {
    key: `search:${result.id}`,
    kind: "search",
    group: "Search",
    label: result.title,
    kicker: result.subtitle ?? null,
    detail: result.description ?? null,
    href: result.url,
    meta: divisionLabel(result.division) || result.badge || null,
    shortcut: null,
    sourceId: result.id,
  };
}

function suggestionToRow(s: PaletteSuggestion): PaletteRow {
  return {
    key: `sug:${s.id}`,
    kind: "suggestion",
    group: "Suggestions",
    label: s.label,
    kicker: s.kicker,
    detail: s.detail,
    href: s.href,
    meta: s.priority === "critical" ? "Now" : s.priority === "high" ? "Soon" : null,
    shortcut: null,
    sourceId: s.id,
  };
}

function recentToRow(r: StoredRecent): PaletteRow {
  return {
    key: `recent:${r.key}`,
    kind: "recent",
    group: "Recents",
    label: r.label,
    kicker: r.kicker,
    detail: r.detail,
    href: r.href,
    meta: r.meta ?? "Recent",
    shortcut: null,
    sourceId: r.key,
  };
}

export interface AggregatorInput {
  query: string;
  scope: string | null;
  commands: ReadonlyArray<WireCommand>;
  searchResults: ReadonlyArray<UnifiedSearchResult>;
  suggestions: ReadonlyArray<PaletteSuggestion>;
  recents: ReadonlyArray<StoredRecent>;
}

export interface AggregatorOutput {
  groups: PaletteGroup[];
  /** Flat list in render order. Drives keyboard nav indices. */
  flat: PaletteRow[];
}

export function aggregate(input: AggregatorInput): AggregatorOutput {
  const trimmed = input.query.trim();
  const queryActive = trimmed.length > 0;

  // Apply scope filter (chip narrows by division/source slug).
  const scopedCommands = input.scope
    ? input.commands.filter((c) => c.source === input.scope)
    : input.commands;
  const scopedSearch = input.scope
    ? input.searchResults.filter((r) => r.division === input.scope)
    : input.searchResults;

  const filteredCommandEntries = queryActive
    ? filterCommandsByQuery(
        scopedCommands.map((c) => commandWireToEntry(c)),
        trimmed,
      )
    : scopedCommands.slice(0, 12).map((c) => commandWireToEntry(c));
  const commandRows = filteredCommandEntries.map((e) =>
    commandToRow(entryToWire(e)),
  );

  const searchRows = queryActive ? scopedSearch.map(searchToRow) : [];
  const suggestionRows = queryActive
    ? []
    : input.suggestions.map(suggestionToRow);
  const recentRows = queryActive
    ? []
    : input.recents.slice(0, 6).map(recentToRow);

  const seen = new Set<string>();
  const dedupe = (row: PaletteRow): boolean => {
    if (seen.has(row.href)) return false;
    seen.add(row.href);
    return true;
  };

  const groups: PaletteGroup[] = [];
  const flat: PaletteRow[] = [];

  if (queryActive) {
    pushGroup("Search", "Search results", searchRows.filter(dedupe));
    pushGroup("Commands", "Commands", commandRows.filter(dedupe));
  } else {
    pushGroup("Suggestions", "Suggestions", suggestionRows.filter(dedupe));
    pushGroup("Commands", "Commands", commandRows.filter(dedupe));
    pushGroup("Recents", "Recents", recentRows.filter(dedupe));
  }

  function pushGroup(key: PaletteGroupKey, label: string, rows: PaletteRow[]) {
    if (rows.length === 0) return;
    groups.push({ key, label, rows });
    for (const row of rows) flat.push(row);
  }

  return { groups, flat };
}

function commandWireToEntry(command: WireCommand): PaletteEntry {
  return {
    id: command.id,
    source: command.source as PaletteEntry["source"],
    label: command.label,
    kicker: command.kicker ?? undefined,
    groupLabel: command.groupLabel as PaletteEntry["groupLabel"],
    href: command.href ?? undefined,
    keywords: command.keywords,
    shortcut: command.shortcut ?? undefined,
    recencyAt: command.recencyAt ?? undefined,
  };
}

function entryToWire(entry: PaletteEntry): WireCommand {
  return {
    id: entry.id,
    source: entry.source,
    label: entry.label,
    kicker: entry.kicker ?? null,
    groupLabel: entry.groupLabel,
    href: entry.href ?? null,
    keywords: Array.from(entry.keywords),
    shortcut: entry.shortcut ? Array.from(entry.shortcut) : null,
    recencyAt: typeof entry.recencyAt === "number" ? entry.recencyAt : null,
  };
}
