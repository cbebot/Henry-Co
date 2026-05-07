/**
 * @henryco/dashboard-shell/command-palette — Cmd+K palette entry
 * contract.
 *
 * Modules contribute palette entries via `getCommandPaletteEntries`.
 * DASH-5 ships the unified palette UI + fuzzy-search.
 */

import type { ReactNode } from "react";
import type { ModuleSlug } from "./register";

/**
 * One palette entry. The palette UI groups entries by `groupLabel`
 * and ranks them by recency × relevance × role-fit.
 *
 * `keywords` are the terms the fuzzy matcher checks against. Always
 * include the natural language label first plus 1-3 alternate phrasings
 * a user might search for ("settings preferences", "notifications
 * inbox alerts").
 */
export type PaletteEntry = {
  /** Stable id within the module — used as the React key. */
  id: string;

  /** Module that contributed this entry. */
  source: ModuleSlug;

  /** The visible label. */
  label: string;

  /** Optional kicker shown above the label (e.g. "Settings") */
  kicker?: string;

  /** Lucide icon identifier or React node. */
  icon?: ReactNode;

  /** Group label for ordering — e.g. "Open", "Search", "Recent". */
  groupLabel: PaletteGroupLabel;

  /** The destination URL or a server action. */
  href?: string;
  action?: () => void | Promise<void>;

  /** Fuzzy-match keywords. Always include the label first. */
  keywords: ReadonlyArray<string>;

  /** Optional shortcut — rendered as a kbd hint. */
  shortcut?: ReadonlyArray<string>;

  /** Recency timestamp (ms epoch) for the rank algorithm. */
  recencyAt?: number;
};

/**
 * The standard palette groupings. Modules pick one per entry; the
 * palette UI orders groups in this exact sequence.
 */
export type PaletteGroupLabel =
  | "Recent"
  | "Open"
  | "Create"
  | "Search"
  | "Settings"
  | "Help";
