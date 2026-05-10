# @henryco/messaging-thread

Audience-agnostic message thread renderer. Hosts plug in via an
adapter (table, channel name, row mapper, server actions); the engine
owns rendering, optimistic state, scroll, and the realtime
subscription.

## Why this exists

Before Phase 3a of the workspace-standardization pass, every division
re-implemented its own thread UI:

- Studio had a bespoke `MessageThread` for `/client/projects/[id]/messages`
- Jobs had its own composer for candidate↔recruiter chat
- Care, marketplace, and learn were each rolling their own

Each one duplicated:
- bubble layout (viewer / team / system alignment)
- composer + attachments
- optimistic send (pending bubble, replace on success, remove on failure)
- autoscroll
- realtime postgres_changes INSERT subscription
- mark-read fire-and-forget

This package replaces all of it with one engine. New consumers wire in
by writing a ~80-line adapter — no UI code.

## Quick start

```ts
"use client";

import { useCallback, useMemo } from "react";
import {
  MessageThread,
  type MessageThreadAdapter,
  type ThreadMessage,
} from "@henryco/messaging-thread";
import {
  sendMyMessageAction,
  markMyMessagesReadAction,
  uploadMyAttachmentAction,
} from "@/lib/actions";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const myAdapter: MessageThreadAdapter = {
  channelName: (id) => `my-thread-${id}`,
  subscriptionFilter: (id) => `conversation_id=eq.${id}`,
  table: "my_conversation_messages",
  schema: "public",
  rowToMessage: (row, viewerId): ThreadMessage | null => {
    if (row.is_internal) return null;
    return {
      id: String(row.id),
      threadId: String(row.conversation_id),
      senderId: row.sender_id as string | null,
      senderName: String(row.sender_name || "Anonymous"),
      senderRole: row.sender_id === viewerId ? "viewer" : "team",
      body: String(row.body || ""),
      attachments: (row.attachments as Array<unknown>) ?? [],
      createdAt: String(row.created_at),
      isOwnMessage: row.sender_id === viewerId,
    };
  },
  sendAction: async (formData) => {
    const result = await sendMyMessageAction(formData);
    return result.ok
      ? { ok: true, messageId: result.messageId }
      : { ok: false, reason: result.reason };
  },
  markReadAction: async (formData) => {
    await markMyMessagesReadAction(formData);
  },
  attachAction: async (formData) => {
    const result = await uploadMyAttachmentAction(formData);
    return result.ok
      ? { ok: true, url: result.url, name: result.name, type: result.type, size: result.size }
      : { ok: false };
  },
};

export function MyChat({ conversationId, initialMessages, viewer }) {
  const adapter = useMemo(() => myAdapter, []);
  const getSupabase = useCallback(() => {
    try { return getBrowserSupabase(); } catch { return null; }
  }, []);
  return (
    <MessageThread
      threadId={conversationId}
      initialMessages={initialMessages}
      viewer={viewer}
      adapter={adapter}
      getSupabase={getSupabase}
    />
  );
}
```

## Adapter contract

```ts
type MessageThreadAdapter = {
  // Identifiers — used to scope the realtime subscription
  channelName: (threadId: string) => string;
  subscriptionFilter: (threadId: string) => string;
  schema?: string;            // defaults to "public"
  table: string;

  // Map a Supabase INSERT payload → ThreadMessage. Return null to drop
  // (eg. internal-only messages the viewer shouldn't see).
  rowToMessage: (row: Record<string, unknown>, viewerId: string) => ThreadMessage | null;

  // Required: server action that persists a new message
  sendAction: (formData: FormData) => Promise<ThreadSendResult>;

  // Optional: server action to mark thread messages as read
  markReadAction?: (formData: FormData) => Promise<void>;

  // Optional: server action that uploads an attachment file
  attachAction?: (formData: FormData) => Promise<ThreadAttachmentUploadResult>;
};
```

`sendAction` and `attachAction` receive a `FormData` containing
`threadId` (engine-stamped) plus the operation's own keys (`body` +
optional `attachments` JSON for send; `file` for attach).

## Composer extras (host-rendered controls)

`composerExtras` is a render prop that lets hosts add their own
buttons next to Send. The slot receives the live `draft` and a
`setDraft` callback so extras can read AND mutate the textarea.

The studio app uses this to render an ✨ Refine button that calls
Claude to polish the draft:

```tsx
<MessageThread
  ...
  composerExtras={({ draft, setDraft }) => (
    <RefineWithAiButton
      draft={draft}
      setDraft={setDraft}
      projectTitle={projectTitle}
      projectSummary={projectSummary}
    />
  )}
/>
```

## Architecture invariants

1. **Engine owns rendering, optimistic state, scroll, subscription, mark-read.** Hosts own data fetching, persistence, Supabase client choice.

2. **`@supabase/supabase-js` is NEVER imported by the package.** Hosts pass their own factory via `getSupabase`. Returns `null` in environments without realtime — the engine gracefully degrades to "no live updates" with no errors.

3. **Inherits `--ws-*` tokens from `@henryco/workspace-shell`.** When mounted inside a workspace tree, themes per-division automatically. When mounted standalone, the shell's stylesheet defaults still apply.

4. **Optimistic state is explicit.** Pending bubble appears instantly with `id: optimistic-${Date.now()}`. On success the temp ID is replaced with the persisted ID. On failure the bubble is removed and an error toast appears under the composer.

5. **Realtime subscription is single-channel per thread.** The engine manages its own channel lifecycle (subscribe on mount, unsubscribe on unmount). Multiple `MessageThread` instances on the same page each open their own channel — Supabase Realtime de-duplicates server-side.

## Components

- `<MessageThread>` — the orchestrator. Use this directly; everything else is internal.

## Class reference

| Class | Purpose |
|---|---|
| `.mt-thread` | Outer container (28-32rem tall, scroll inside) |
| `.mt-thread-empty` | Empty-state when `initialMessages` is empty |
| `.mt-thread-list` | Scrollable bubble list |
| `.mt-bubble-row[data-side="own\|team\|system"]` | Per-bubble container |
| `.mt-bubble` | Bubble surface |
| `.mt-bubble-meta` | Sender + timestamp row |
| `.mt-attachment-chip` | Attachment chips inside bubbles |
| `.mt-composer` | Composer surface (form) |
| `.mt-composer-textarea` | Auto-growing textarea |
| `.mt-composer-send` | Send button |
| `.mt-composer-icon-btn` | Attach + extras button base |
| `.ws-refine-ai-*` | Studio's ✨ Refine button (if you copy the pattern, namespace your own `.ws-${slot}-*` classes) |

## Roadmap

- [x] Engine + studio /client migration (Phase 3a)
- [x] AI refine button in studio composer (Phase 3b)
- [ ] Jobs candidate↔recruiter messaging (different data shape — needs its own adapter)
- [ ] Care customer thread support
- [ ] Marketplace seller chat
- [ ] Learn instructor↔learner Q&A
- [ ] Read-receipt indicators (engine-level — show "Read by Adaeze" on viewer-side bubbles)
- [ ] Typing indicators (engine-level — broadcast via Supabase realtime presence)
