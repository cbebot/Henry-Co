/**
 * Audience-agnostic message shape consumed by the thread renderer.
 * Hosts map their per-division row shape (studio_project_messages,
 * jobs_interview_messages, care_threads, marketplace_seller_chat, ...)
 * onto this via `MessageThreadAdapter.rowToMessage()`.
 */
export type ThreadMessage = {
  id: string;
  /** The thread / project / conversation ID this message belongs to. */
  threadId: string;
  /** Author user ID. Null when the message is system-generated. */
  senderId: string | null;
  /** Display name (eg. "Adaeze Okonkwo", "HenryCo Team"). */
  senderName: string;
  /** Coarse role for layout alignment + tone tinting:
   *   - "viewer"  → render right-aligned with viewer styling
   *   - "team"    → render left-aligned with team styling
   *   - "system"  → render centered, muted (status changes, etc) */
  senderRole: "viewer" | "team" | "system";
  /** Plain-text body. Markdown is rendered safely if `renderMarkdown` is true. */
  body: string;
  /** Attachments rendered as chips below the body. */
  attachments?: ThreadAttachment[];
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp; null when not edited. */
  editedAt?: string | null;
  /** Optional ISO timestamp the server marked the message as delivered to
   * the recipient(s). When present on a viewer-owned bubble the engine
   * shows a "Delivered" status. Adapters that don't track delivery can
   * leave this undefined — the engine falls back to "Sent". */
  deliveredAt?: string | null;
  /** Optional ISO timestamp the recipient marked the message as read.
   * When present on a viewer-owned bubble the engine shows "Read".
   * Outranks `deliveredAt`. */
  readAt?: string | null;
  /** True when the viewer is the sender — drives "Sent" indicator + alignment. */
  isOwnMessage?: boolean;
};

export type ThreadAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number | null;
};

/** Minimal viewer profile rendered as the avatar / Sent-by badge. */
export type ThreadViewer = {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
};

/** Result of `sendAction` — host returns the persisted ID + optional row
 * for replacing the optimistic message. */
export type ThreadSendResult =
  | {
      ok: true;
      messageId: string;
      message?: Partial<ThreadMessage>;
    }
  | {
      ok: false;
      reason?: string;
    };

/** Result of `attachAction` — host returns the uploaded asset metadata. */
export type ThreadAttachmentUploadResult =
  | {
      ok: true;
      url: string;
      name: string;
      type: string;
      size: number | null;
    }
  | {
      ok: false;
      reason?: string;
    };

/**
 * Everything a host must supply to plug the thread engine into a
 * specific Supabase table + server-action set.
 *
 * Engine owns: rendering, optimistic state, scroll, draft persistence.
 * Host owns: subscription identifiers, row mapping, server actions.
 */
export type MessageThreadAdapter = {
  /** Channel name used for the realtime subscription. Should be
   * stable per-thread so multiple mounts share a channel. */
  channelName: (threadId: string) => string;

  /** Postgres-changes filter, eg. `project_id=eq.${threadId}`. */
  subscriptionFilter: (threadId: string) => string;

  /** Schema + table the engine subscribes to for INSERTs. */
  schema?: string;
  table: string;

  /** Map a raw Supabase row → ThreadMessage. Return null to drop the row
   * (eg. internal-only messages the viewer shouldn't see). */
  rowToMessage: (row: Record<string, unknown>, viewerId: string) => ThreadMessage | null;

  /** Server action that persists a message. Receives a FormData with
   * `threadId`, `body`, optionally `attachments` (JSON-stringified). */
  sendAction: (formData: FormData) => Promise<ThreadSendResult>;

  /** Optional server action that marks all messages in this thread as
   * read by the viewer. Engine fires it once on mount + after each
   * incoming message. Defaults to no-op. */
  markReadAction?: (formData: FormData) => Promise<void>;

  /** Optional server action that uploads an attachment. Receives a
   * FormData with `file`. */
  attachAction?: (formData: FormData) => Promise<ThreadAttachmentUploadResult>;
};

/**
 * Browser Supabase factory. The engine never imports `@supabase/supabase-js`
 * directly — the host passes its own factory so the package stays portable.
 *
 * Returns null in environments without realtime (SSR, tests). The engine
 * gracefully degrades to "no live updates" when null.
 */
export type ThreadSupabaseFactory = () => ThreadSupabaseLike | null;

export type ThreadSupabaseLike = {
  channel: (name: string) => ThreadChannelLike;
  removeChannel: (channel: ThreadChannelLike) => unknown;
};

export type ThreadChannelLike = {
  on: (
    /**
     * The realtime event family. We use:
     *   - "postgres_changes" → row INSERTs in adapter.table
     *   - "broadcast"        → typing presence pings (PASS 24 phase 5)
     */
    event: string,
    /**
     * Options shape varies by event family. For `postgres_changes` the
     * engine passes `{ event, schema, table, filter }`. For `broadcast`
     * the engine passes `{ event }`. We use a permissive structural
     * shape so the engine can satisfy both without TS unions getting in
     * the way of the @supabase/ssr browser client typedef.
     */
    options: {
      event?: string;
      schema?: string;
      table?: string;
      filter?: string;
    },
    handler: (payload: Record<string, unknown>) => void,
  ) => ThreadChannelLike;
  subscribe: (callback?: (status: string) => void) => ThreadChannelLike;
  /** Optional broadcast publish — undefined on hosts that don't support
   * Realtime broadcast. Engine guards every call. */
  send?: (payload: {
    type: "broadcast";
    event: string;
    payload: Record<string, unknown>;
  }) => unknown;
};

export type MessageThreadProps = {
  /** Stable thread identifier (project ID, conversation ID, etc). */
  threadId: string;
  /** Initial messages from the host's server-side fetch. */
  initialMessages: ThreadMessage[];
  /** Authenticated viewer. */
  viewer: ThreadViewer;
  /** Per-thread adapter. */
  adapter: MessageThreadAdapter;
  /** Browser Supabase factory for the live subscription. */
  getSupabase?: ThreadSupabaseFactory;
  /** Optional placeholder text in the composer textarea. */
  placeholder?: string;
  /** Optional empty-state copy. */
  emptyTitle?: string;
  emptyBody?: string;
  /** Render markdown in the body. Defaults to false (plain text). */
  renderMarkdown?: boolean;
  /**
   * Hide the composer entirely. Hosts use this for read-only states —
   * eg. resolved/closed support threads where staff has signed the
   * thread off and replying should funnel into a fresh ticket.
   *
   * The engine still renders the bubble list + SR announcer + live
   * banner, so the host doesn't need a separate read-only branch.
   */
  disableComposer?: boolean;
  /**
   * Enable the Realtime broadcast-based typing presence indicator. When
   * true (the default) the composer broadcasts a "typing" ping at most
   * once every 2s while the user is composing, and the bubble list
   * renders a calm three-dot indicator for any other participant who's
   * actively typing. Hosts whose Supabase channel doesn't carry
   * broadcast permission (or which want a stricter privacy posture) can
   * disable.
   */
  enableTypingPresence?: boolean;
  /**
   * Extra controls rendered in the composer's actions row, before Send.
   *
   * Receives the live `draft` and a `setDraft` callback so the extras
   * can both read AND mutate the textarea content. Used today for the
   * studio "Refine with AI" sparkle button — the action takes the
   * current draft, sends it to Claude, and replaces the draft with a
   * polished version.
   *
   * Render prop instead of plain ReactNode so the slot stays purely
   * declarative without forcing the engine to expose its internal
   * draft state via context.
   */
  composerExtras?: (ctx: { draft: string; setDraft: (value: string) => void }) => import("react").ReactNode;
  /**
   * Optional day-divider labeller. When provided, the engine groups
   * consecutive messages by calendar day in the viewer's local timezone
   * and emits a divider row (`<li class="mt-day-divider">`) before the
   * first message of each new day. The host owns the label entirely —
   * pass `translateSurfaceLabel` for the relative tokens ("Today",
   * "Yesterday") and `Intl.DateTimeFormat` for the absolute date so the
   * output stays locale-correct.
   *
   * `position` is one of:
   *   - "today"     → message date matches the viewer's local today
   *   - "yesterday" → message date is exactly one day before today
   *   - "earlier"   → any older calendar day; host typically formats it
   *
   * Returning null suppresses the divider for that day (eg. system-only
   * spans the host wants to keep visually quiet).
   */
  dayDividerLabel?: (
    date: Date,
    position: "today" | "yesterday" | "earlier",
  ) => string | null;
  /**
   * Auto-focus the composer textarea when the thread mounts. Hosts use
   * this on chat-first surfaces (eg. a dedicated /support/[threadId] page)
   * where opening the keyboard immediately on mobile is the right default.
   * Hosts mounting threads inside a dashboard tab should leave it off so
   * the engine doesn't steal focus from the surrounding page.
   */
  autoFocusComposer?: boolean;
};
