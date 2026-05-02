/**
 * Hook: useCommandKey — bind Cmd/Ctrl+K (and "/" when focus is not in
 * an input) to a callback. Used by the shell-mounted palette host so
 * the palette can be opened from anywhere on the platform.
 *
 * The "/" binding mirrors common dev-tool / docs-site conventions. We
 * deliberately ignore "/" when the user is typing in any text field;
 * platform inputs would otherwise lose a slash on every keystroke.
 */

"use client";

import { useEffect } from "react";

const TEXT_INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return TEXT_INPUT_TAGS.has(target.tagName);
}

export function useCommandKey(callback: () => void): void {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        callback();
        return;
      }
      if (event.key === "/" && !isEditableTarget(event.target)) {
        event.preventDefault();
        callback();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback]);
}
