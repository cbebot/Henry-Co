"use client";

import type { KeyboardEvent } from "react";
import { useCallback } from "react";

export type ComposerKeyboardOptions = {
  onSubmit: () => void;
  onEscape?: () => void;
  multilineWithShift?: boolean;
  disabled?: boolean;
  /**
   * When true, plain Enter (no modifier) submits and Shift+Enter inserts a
   * newline — chat-app parity. Default false preserves the historical
   * contract (plain Enter = newline, Cmd/Ctrl+Enter = send).
   */
  enterSends?: boolean;
};

export function useComposerKeyboard(options: ComposerKeyboardOptions) {
  const {
    onSubmit,
    onEscape,
    multilineWithShift = true,
    disabled,
    enterSends = false,
  } = options;

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
      if (enterSends && !event.shiftKey) {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, onEscape, multilineWithShift, disabled, enterSends]
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
