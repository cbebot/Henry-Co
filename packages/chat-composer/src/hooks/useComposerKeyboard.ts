"use client";

import type { KeyboardEvent } from "react";
import { useCallback } from "react";

export type ComposerKeyboardOptions = {
  onSubmit: () => void;
  onEscape?: () => void;
  multilineWithShift?: boolean;
  disabled?: boolean;
};

export function useComposerKeyboard(options: ComposerKeyboardOptions) {
  const { onSubmit, onEscape, multilineWithShift = true, disabled } = options;

  const handler = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      if (event.key === "Escape" && onEscape) {
        onEscape();
        return;
      }
      const isEnter = event.key === "Enter";
      if (!isEnter) return;
      const cmdSubmit = event.metaKey || event.ctrlKey;
      if (cmdSubmit) {
        event.preventDefault();
        onSubmit();
        return;
      }
      if (multilineWithShift && event.shiftKey) {
        // allow newline
        return;
      }
    },
    [onSubmit, onEscape, multilineWithShift, disabled]
  );

  return handler;
}

export function isMacLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as unknown as { userAgentData?: { platform?: string } })
      .userAgentData?.platform || navigator.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function shortcutHintText(macLike: boolean): string {
  return macLike ? "⌘ + Enter to send" : "Ctrl + Enter to send";
}
