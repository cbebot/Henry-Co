/**
 * Client-side recents — localStorage scoped to user_id.
 *
 * Recents are not RLS-bearing: the user has already proven access by
 * activating the row in a prior session, so we are not leaking access.
 * The user_id-scoped key prevents a shared device from leaking recents
 * between profiles.
 *
 * On signOut the layout dispatches a `henryco:palette:clear-recents`
 * CustomEvent; we listen for it and wipe the store.
 */

"use client";

import type { PaletteRow, StoredRecent } from "./types";

const STORAGE_VERSION = "v2";
const MAX_RECENTS = 10;

function storageKey(userId: string): string {
  return `henryco:palette:recents:${STORAGE_VERSION}:${userId}`;
}

export function loadRecents(userId: string | null): StoredRecent[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isValidRecent)
      .slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

export function saveRecent(userId: string | null, row: PaletteRow): void {
  if (!userId || typeof window === "undefined") return;
  try {
    const existing = loadRecents(userId);
    const stored: StoredRecent = {
      key: row.key,
      kind: row.kind,
      label: row.label,
      kicker: row.kicker,
      detail: row.detail,
      href: row.href,
      meta: row.meta,
      lastUsedAt: Date.now(),
    };
    const next = [stored, ...existing.filter((e) => e.href !== row.href)].slice(
      0,
      MAX_RECENTS,
    );
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // localStorage may be disabled (private mode, quota). Silent.
  }
}

export function clearRecents(userId: string | null): void {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Convert stored recents into rows the palette can render. The
 * recents group always renders at the bottom; rows keep their original
 * `kind` so the result row component can pick the right icon.
 */
export function recentsToRows(recents: StoredRecent[]): PaletteRow[] {
  return recents.map((r) => ({
    key: `recent:${r.key}`,
    kind: r.kind,
    group: "Recents" as const,
    label: r.label,
    kicker: r.kicker,
    detail: r.detail,
    href: r.href,
    meta: r.meta ?? "Recent",
    shortcut: null,
    sourceId: r.key,
  }));
}

function isValidRecent(value: unknown): value is StoredRecent {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<StoredRecent>;
  return (
    typeof r.key === "string" &&
    typeof r.label === "string" &&
    typeof r.href === "string" &&
    (r.kind === "command" || r.kind === "search" || r.kind === "recent" || r.kind === "suggestion") &&
    typeof r.lastUsedAt === "number"
  );
}

/**
 * Event name dispatched on signOut by the host layout. The provider
 * listens and calls `clearRecents()` for the resolved user_id.
 */
export const PALETTE_CLEAR_RECENTS_EVENT = "henryco:palette:clear-recents";
