import type { ChatAttachment, ChatThreadMessage } from "./types";

/**
 * Optimistic-send state, kept as a pure immutable structure so every
 * transition (append → ack | fail → retry) is unit-testable without React.
 *
 * Local ids are namespaced `local-<n>`; they never collide with server ids or
 * with @henryco/messaging-thread's `optimistic-` convention.
 */
export type OutboxEntry = {
  localId: string;
  body: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  state: "sending" | "failed";
  failReason?: string | null;
};

export type OutboxState = {
  entries: OutboxEntry[];
  counter: number;
};

export function emptyOutbox(): OutboxState {
  return { entries: [], counter: 0 };
}

export function outboxAppend(
  state: OutboxState,
  input: { body: string; attachments?: ChatAttachment[]; now: string },
): { state: OutboxState; localId: string } {
  const localId = `local-${state.counter}`;
  const entry: OutboxEntry = {
    localId,
    body: input.body,
    attachments: input.attachments,
    createdAt: input.now,
    state: "sending",
    failReason: null,
  };
  return {
    state: { entries: [...state.entries, entry], counter: state.counter + 1 },
    localId,
  };
}

export function outboxFail(
  state: OutboxState,
  localId: string,
  reason?: string | null,
): OutboxState {
  return {
    ...state,
    entries: state.entries.map((entry) =>
      entry.localId === localId
        ? { ...entry, state: "failed", failReason: reason ?? null }
        : entry,
    ),
  };
}

/** Back to `sending` in place — position and timestamp are preserved. */
export function outboxRetry(state: OutboxState, localId: string): OutboxState {
  return {
    ...state,
    entries: state.entries.map((entry) =>
      entry.localId === localId ? { ...entry, state: "sending", failReason: null } : entry,
    ),
  };
}

export function outboxAck(state: OutboxState, localId: string): OutboxState {
  return {
    ...state,
    entries: state.entries.filter((entry) => entry.localId !== localId),
  };
}

/**
 * Render list = server snapshot, then locally-confirmed messages the server
 * list hasn't caught up with yet (deduped by id), then in-flight/failed
 * outbox entries as viewer messages, in dispatch order.
 */
export function mergeOutbox(
  server: ChatThreadMessage[],
  confirmed: ChatThreadMessage[],
  state: OutboxState,
  viewer: { id: string; name?: string },
): ChatThreadMessage[] {
  const seen = new Set(server.map((message) => message.id));
  const merged: ChatThreadMessage[] = [...server];

  for (const message of confirmed) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    merged.push(message);
  }

  for (const entry of state.entries) {
    merged.push({
      id: entry.localId,
      authorId: viewer.id,
      authorName: viewer.name,
      authorRole: "viewer",
      body: entry.body,
      createdAt: entry.createdAt,
      attachments: entry.attachments,
      deliveryState: entry.state === "failed" ? "failed" : "sending",
      failReason: entry.failReason ?? null,
    });
  }

  return merged;
}
