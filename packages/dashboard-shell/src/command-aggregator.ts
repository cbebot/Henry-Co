/**
 * @henryco/dashboard-shell/command-aggregator — server-side aggregator
 * that walks the module registry and collects each module's
 * `getCommandPaletteEntries` for the given viewer.
 *
 * DASH-5 ships this. The aggregator lives next to the registry rather
 * than in search-core because the registry is the source of truth for
 * eligibility and the aggregator is a pure manifest walk — no search
 * infrastructure (Typesense, ranking-by-text-match) is involved.
 *
 * Anti-pattern #4 (decorative tiles): an entry with neither `href`
 * nor `action` is dropped at aggregator time. Modules cannot ship
 * "decorative" commands.
 *
 * Anti-pattern #7 (reimplemented role helpers): the aggregator calls
 * `getEligibleModules(viewer)` — the same helper the WorkspaceRail
 * uses — so a module hidden from the rail is hidden from the palette
 * by construction. There is no client-side role re-derivation.
 */

import type { PaletteEntry } from "./command-palette";
import { getEligibleModules, type DashboardModule } from "./register";
import type { UnifiedViewer } from "@henryco/auth";

export interface CollectModuleCommandsResult {
  /** Commands eligible for this viewer, ranked. */
  commands: PaletteEntry[];
  /** Per-module count, used by the palette for grouping + debug. */
  bySource: Record<string, number>;
  /** Modules that registered but contributed zero entries. */
  emptyModules: string[];
}

/**
 * Walk every eligible module and collect its palette entries.
 *
 * Each module's `getCommandPaletteEntries(viewer)` may issue lightweight
 * data reads (e.g. marketplace's vendor flag). Those reads honour the
 * module's own RLS-bearing snapshot loader; the aggregator itself does
 * not touch Postgres.
 *
 * Failures in any single module's loader are caught and logged; the
 * palette degrades gracefully (one module's bug never blanks the
 * palette).
 */
export async function collectModuleCommands(
  viewer: UnifiedViewer,
): Promise<CollectModuleCommandsResult> {
  const modules = getEligibleModules(viewer);
  const commands: PaletteEntry[] = [];
  const bySource: Record<string, number> = {};
  const emptyModules: string[] = [];

  await Promise.all(
    modules.map(async (module: DashboardModule) => {
      let entries: ReadonlyArray<PaletteEntry> = [];
      try {
        entries = await module.getCommandPaletteEntries(viewer);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          `[dashboard-shell/command-aggregator] module "${module.slug}" ` +
            `threw in getCommandPaletteEntries:`,
          error,
        );
        entries = [];
      }

      const valid = entries.filter((entry) => {
        const hasTarget = Boolean(entry.href) || typeof entry.action === "function";
        if (!hasTarget) {
          // eslint-disable-next-line no-console
          console.warn(
            `[dashboard-shell/command-aggregator] dropping decorative entry ` +
              `"${entry.id}" from module "${module.slug}" — no href / action`,
          );
        }
        return hasTarget;
      });

      if (valid.length === 0) {
        emptyModules.push(module.slug);
        return;
      }

      bySource[module.slug] = valid.length;
      commands.push(...valid);
    }),
  );

  return {
    commands: rankCommands(commands),
    bySource,
    emptyModules,
  };
}

/**
 * Stable ranking for the commands list. Same shape as the signal feed
 * ranker (DASH-1 + DASH-4) so the patterns stay coherent across the
 * shell.
 *
 *   - Recency: entries with `recencyAt` set float to the top.
 *   - Group ordering: Open > Create > Search > Settings > Help.
 *   - Stable secondary sort by id so the order is deterministic.
 */
const GROUP_ORDER: Record<string, number> = {
  Open: 0,
  Create: 1,
  Search: 2,
  Settings: 3,
  Help: 4,
  Recent: 5,
};

export function rankCommands(commands: PaletteEntry[]): PaletteEntry[] {
  return [...commands].sort((left, right) => {
    const leftRecent = typeof left.recencyAt === "number" ? left.recencyAt : 0;
    const rightRecent = typeof right.recencyAt === "number" ? right.recencyAt : 0;
    if (leftRecent !== rightRecent) return rightRecent - leftRecent;

    const leftGroup = GROUP_ORDER[left.groupLabel] ?? 99;
    const rightGroup = GROUP_ORDER[right.groupLabel] ?? 99;
    if (leftGroup !== rightGroup) return leftGroup - rightGroup;

    return left.id.localeCompare(right.id);
  });
}

/**
 * Fuzzy-match a command list against a query string. Used by the
 * palette's client-side narrow.
 *
 * Each entry's `keywords` array is matched against the trimmed,
 * lowercased query. The label match is weighted 2× to bias towards
 * label-first matches.
 */
export function filterCommandsByQuery(
  commands: PaletteEntry[],
  query: string,
): PaletteEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return commands;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return commands;

  type Scored = { entry: PaletteEntry; score: number };
  const scored: Scored[] = [];

  for (const entry of commands) {
    let score = 0;
    const labelLower = entry.label.toLowerCase();
    const kickerLower = entry.kicker?.toLowerCase() ?? "";

    for (const token of tokens) {
      if (labelLower.includes(token)) score += 2;
      if (kickerLower.includes(token)) score += 1;
      for (const keyword of entry.keywords) {
        const kw = keyword.toLowerCase();
        if (kw === token) {
          score += 2;
          break;
        }
        if (kw.includes(token)) {
          score += 1;
          break;
        }
      }
    }

    if (score > 0) scored.push({ entry, score });
  }

  scored.sort(
    (left, right) =>
      right.score - left.score || left.entry.id.localeCompare(right.entry.id),
  );

  return scored.map((s) => s.entry);
}

/**
 * Wire-format for the /api/dashboard/commands GET. The palette UI
 * consumes this shape directly without further transformation.
 *
 * Server-only fields (action functions) are stripped before send. The
 * wire shape carries `href` only; modules that contribute action
 * handlers expose them via a separate route the palette posts to.
 * (V2 scope: every shipped command uses `href`. Action-handler
 * delivery is a V3 concern and is intentionally NOT shipped.)
 */
export interface CommandsWirePayload {
  ok: true;
  generatedAt: number;
  commands: WireCommand[];
  bySource: Record<string, number>;
  emptyModules: string[];
}

export interface WireCommand {
  id: string;
  source: string;
  label: string;
  kicker: string | null;
  groupLabel: string;
  href: string | null;
  keywords: string[];
  shortcut: string[] | null;
  recencyAt: number | null;
}

export function toWirePayload(
  input: CollectModuleCommandsResult,
): CommandsWirePayload {
  return {
    ok: true,
    generatedAt: Date.now(),
    commands: input.commands.map(toWireCommand),
    bySource: input.bySource,
    emptyModules: input.emptyModules,
  };
}

function toWireCommand(entry: PaletteEntry): WireCommand {
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
