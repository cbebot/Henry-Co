"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUTO_SCROLL_THRESHOLD_PX } from "@/lib/messaging/constants";

type Options = {
  /** Latest message length — used to detect new arrivals. */
  messageCount: number;
  /** Whether motion preferences allow smooth scroll. */
  smooth?: boolean;
};

/**
 * Spec-compliant scroll behaviour for the message list:
 *
 *   On first mount: jump to bottom (or to first unread, when caller
 *     supplies a target via scrollToMessage).
 *   On new message arrival: auto-scroll only if the user is near the
 *     bottom. Otherwise expose `pendingNewMessage = true` so the UI
 *     can show a "New message" pill.
 *   On user-initiated send: always scroll to bottom.
 *   On history prepend: preserve the user's scroll anchor (no jump).
 */
export function useMessageScroll({ messageCount, smooth }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const previousCountRef = useRef(messageCount);
  const previousScrollHeightRef = useRef(0);
  const [pendingNewMessage, setPendingNewMessage] = useState(false);

  const isNearBottom = useCallback(() => {
    const node = containerRef.current;
    if (!node) return true;
    return (
      node.scrollHeight - node.scrollTop - node.clientHeight <
      AUTO_SCROLL_THRESHOLD_PX
    );
  }, []);

  const scrollToBottom = useCallback(
    (force = false) => {
      const node = containerRef.current;
      if (!node) return;
      if (!force && !isNearBottom()) return;
      node.scrollTo({
        top: node.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setPendingNewMessage(false);
    },
    [isNearBottom, smooth],
  );

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const node = containerRef.current;
      if (!node) return;
      const target = node.querySelector(
        `[data-message-id="${messageId}"]`,
      ) as HTMLElement | null;
      if (!target) return;
      target.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "center",
      });
      target.classList.add("studio-msg-flash");
      window.setTimeout(() => {
        target.classList.remove("studio-msg-flash");
      }, 1600);
    },
    [smooth],
  );

  // Detect new messages and act per the spec rules.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      previousCountRef.current = messageCount;
      return;
    }

    if (messageCount > previousCountRef.current) {
      const wasNearBottom = isNearBottom();
      if (wasNearBottom) {
        // Allow layout to settle before scrolling.
        requestAnimationFrame(() => scrollToBottom(true));
      } else {
        // Defer so React doesn't see a synchronous setState inside the
        // effect body — keeps render commit cheap and lint happy.
        queueMicrotask(() => setPendingNewMessage(true));
      }
    }

    previousCountRef.current = messageCount;
  }, [messageCount, isNearBottom, scrollToBottom]);

  // Preserve scroll anchor when older history is prepended.
  const onBeforeHistoryLoad = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    previousScrollHeightRef.current = node.scrollHeight;
  }, []);

  const onAfterHistoryLoad = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    const delta = node.scrollHeight - previousScrollHeightRef.current;
    node.scrollTop = node.scrollTop + delta;
    previousScrollHeightRef.current = 0;
  }, []);

  // Initial scroll: jump to bottom on first paint.
  useEffect(() => {
    requestAnimationFrame(() => {
      const node = containerRef.current;
      if (!node) return;
      node.scrollTop = node.scrollHeight;
    });
  }, []);

  return {
    containerRef,
    bottomAnchorRef,
    pendingNewMessage,
    scrollToBottom,
    scrollToMessage,
    onBeforeHistoryLoad,
    onAfterHistoryLoad,
    isNearBottom,
  };
}
