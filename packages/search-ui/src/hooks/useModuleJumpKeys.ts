/**
 * Hook: useModuleJumpKeys — wires Cmd+1..9 (Ctrl+1..9 on non-mac) to
 * jump directly to the first 9 eligible modules in the rail order.
 *
 * The map is provided by the host app at mount; the host walks
 * `getEligibleModules(viewer)` once on the server and passes a stable
 * slug → href list to the palette host. A flag flip that changes
 * eligibility re-renders the host (the rail itself is also a server
 * component and re-renders the same way), so the map stays in sync.
 *
 * Out-of-range presses (e.g. Cmd+5 with 4 modules) are no-ops.
 *
 * The hook never preventDefault's a numeric press if the user is
 * typing inside an input, textarea, contenteditable, or the palette's
 * own search field — those keystrokes belong to the input, not the
 * shortcut.
 */

"use client";

import { useEffect } from "react";

export interface ModuleJumpEntry {
  slug: string;
  href: string;
}

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return TEXT_INPUT_TAGS.has(target.tagName);
}

export function useModuleJumpKeys(entries: ReadonlyArray<ModuleJumpEntry>): void {
  useEffect(() => {
    if (entries.length === 0) return;
    function handler(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      if (event.shiftKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const digit = Number(event.key);
      if (!Number.isFinite(digit) || digit < 1 || digit > 9) return;
      const target = entries[digit - 1];
      if (!target) return;
      event.preventDefault();
      window.location.assign(target.href);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [entries]);
}
