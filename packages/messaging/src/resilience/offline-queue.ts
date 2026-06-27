export interface QueueStorage {
  read(): string | null;
  write(v: string): void;
}

export interface QueuedMessage {
  conversationId: string;
  body: string;
  attachments: string[];
}

export interface OfflineQueue {
  enqueue(m: QueuedMessage): void;
  pending(): QueuedMessage[];
  flush(send: (m: QueuedMessage) => Promise<{ ok: boolean; retryable?: boolean }>): Promise<void>;
}

const DEFAULT_KEY = "henryco.onyx-line.outbox.v1";

export function createOfflineQueue(storage: QueueStorage, key: string = DEFAULT_KEY): OfflineQueue {
  function load(): QueuedMessage[] {
    const raw = storage.read();
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as QueuedMessage[]) : []; }
    catch { return []; }
  }
  function save(items: QueuedMessage[]): void { storage.write(JSON.stringify(items)); }

  return {
    enqueue(m) { const items = load(); items.push(m); save(items); },
    pending() { return load(); },
    async flush(send) {
      let items = load();
      while (items.length > 0) {
        const next = items[0];
        const res = await send(next);
        if (!res.ok) {
          if (res.retryable === false) {
            // Poison message: a non-retryable failure will never succeed — drop it
            // (log, don't silently lose) and continue so it can't block the outbox head.
            console.warn("offline-queue: dropping non-retryable message", { conversationId: next.conversationId });
            items = items.slice(1);
            save(items);
            continue;
          }
          // Retryable (or unspecified) failure: stop and keep for a later flush (backpressure).
          return;
        }
        items = items.slice(1);
        save(items);
      }
    },
  };
}
