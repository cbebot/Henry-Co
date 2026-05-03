"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SendMessageInput } from "@/lib/messaging/types";

type QueuedMessage = SendMessageInput & {
  clientId: string;
  queuedAt: number;
  attempts: number;
  lastError?: string;
};

type SendFn = (
  input: SendMessageInput,
) => Promise<{ ok: boolean; messageId?: string; error?: string }>;

/**
 * Buffer outgoing messages while the network is unreachable, replay
 * automatically when it returns. Persists to localStorage so that a
 * user who closes the tab during an outage doesn't lose their drafts.
 *
 * The queue is per-project — the storage key includes the projectId.
 */
export function useOfflineQueue(projectId: string, send: SendFn) {
  const storageKey = `studio-msg-queue:${projectId}`;
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const flushingRef = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as QueuedMessage[];
        if (Array.isArray(parsed)) setQueue(parsed);
      }
    } catch {
      // Corrupt storage — wipe it.
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* noop */
      }
    }
  }, [storageKey]);

  // Persist to localStorage on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (queue.length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(queue));
      }
    } catch {
      /* swallow quota errors */
    }
  }, [queue, storageKey]);

  // Track online/offline state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const enqueue = useCallback(
    (input: SendMessageInput, clientId: string) => {
      setQueue((current) => [
        ...current,
        {
          ...input,
          clientId,
          queuedAt: Date.now(),
          attempts: 0,
        },
      ]);
    },
    [],
  );

  const removeFromQueue = useCallback((clientId: string) => {
    setQueue((current) => current.filter((q) => q.clientId !== clientId));
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (!isOnline) return;
    flushingRef.current = true;
    try {
      // Snapshot a copy — we mutate state inside the loop.
      const snapshot = [...queue];
      for (const item of snapshot) {
        const result = await send({
          projectId: item.projectId,
          body: item.body,
          attachments: item.attachments,
          replyToId: item.replyToId,
          messageType: item.messageType,
          metadata: item.metadata,
        });
        if (result.ok) {
          removeFromQueue(item.clientId);
        } else {
          // Bump attempt count and store error; leave in queue for
          // manual retry after the user has tried to fix the issue.
          setQueue((current) =>
            current.map((q) =>
              q.clientId === item.clientId
                ? {
                    ...q,
                    attempts: q.attempts + 1,
                    lastError: result.error,
                  }
                : q,
            ),
          );
          break; // Stop the flush — don't retry-storm on a server error.
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }, [isOnline, queue, send, removeFromQueue]);

  // Auto-flush when we come back online.
  useEffect(() => {
    if (!isOnline) return;
    if (queue.length === 0) return;
    void flush();
  }, [isOnline, queue.length, flush]);

  return {
    queue,
    isOnline,
    enqueue,
    removeFromQueue,
    flush,
  };
}
