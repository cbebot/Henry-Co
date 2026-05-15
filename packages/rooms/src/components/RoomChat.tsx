"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EmptyState,
  LoadingSkeleton,
  Panel,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

import { sendRoomMessage as sendRoomMessageAction } from "../server/actions";
import { useRoomsRealtime } from "../realtime/rooms-realtime";
import { isRoomError } from "../types";
import type { RoomMessage } from "../types";

/**
 * RoomChat — in-room chat panel.
 *
 * Reads messages from the rooms realtime context. The send box is a
 * lightweight Markdown-capable textarea + Send button — the consumer
 * MAY swap in `@henryco/chat-composer`'s `<ChatComposer>` by passing a
 * `renderComposer` slot (Wave B/C consumers do this for parity with
 * the rest of their messaging surfaces).
 *
 * Why not import ChatComposer directly:
 *   - Composer pulls in tailwind-merge + clsx; the rooms surface
 *     wants a lower bundle floor when rooms is mounted without a
 *     consumer's chat surface.
 *   - The composer's full attachment-upload pipeline requires a host-
 *     supplied uploader; rooms-internal composers don't always need it.
 *
 * Anti-patterns avoided:
 *   - Reads from the shell-level realtime context (no per-widget
 *     subscription).
 *   - Empty / loading / error / success states all rendered.
 *   - `<ActionButton>` for send (success-lock prevents double-submit).
 */
export type RoomChatProps = {
  sessionId: string;
  /**
   * Display-name resolver — same shape as PresencePane's. The chat
   * surface renders sender names next to bubbles.
   */
  resolveDisplayName?: (userId: string) => string | null;
  /**
   * Resolve the user's own id so the chat can right-align own
   * messages.
   */
  selfUserId: string;
  /** Optional max height — defaults to 24rem. */
  maxHeight?: string;
  /**
   * Render the composer body. Defaults to the package's lightweight
   * textarea. Consumers can pass an `<ChatComposer>` instance.
   */
  renderComposer?: (args: {
    onSend: (body: string) => Promise<void>;
    sending: boolean;
  }) => React.ReactNode;
};

export function RoomChat({
  sessionId,
  resolveDisplayName,
  selfUserId,
  maxHeight = "24rem",
  renderComposer,
}: RoomChatProps) {
  const { messages, status } = useRoomsRealtime();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message arrival.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const send = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      setSending(true);
      setError(null);
      const result = await sendRoomMessageAction({
        sessionId,
        bodyMd: trimmed,
      });
      setSending(false);
      if (isRoomError(result)) {
        setError(`Could not send: ${result.error}`);
        return;
      }
      setDraft("");
    },
    [sessionId],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await send(draft);
    },
    [draft, send],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void send(draft);
      }
    },
    [draft, send],
  );

  const composerNode = useMemo(() => {
    if (renderComposer) {
      return renderComposer({ onSend: send, sending });
    }
    return (
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "flex-end",
          padding: "0.5rem 0.5rem 0",
          borderTop: `1px solid var(${CSS_VARS.hairline})`,
        }}
      >
        <textarea
          aria-label="Chat message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message — Enter to send."
          rows={2}
          disabled={sending}
          style={{
            flex: 1,
            minHeight: "2.5rem",
            maxHeight: "8rem",
            resize: "vertical",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.75rem",
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
            color: `var(${CSS_VARS.ink})`,
            fontFamily: "inherit",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          style={{
            padding: "0.5rem 0.85rem",
            minHeight: "2.5rem",
            borderRadius: "9999px",
            border: `1px solid var(${CSS_VARS.accent})`,
            backgroundColor: `var(${CSS_VARS.accent})`,
            color: `var(${CSS_VARS.textOnAccent})`,
            fontWeight: 600,
            cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
            opacity: sending || !draft.trim() ? 0.6 : 1,
          }}
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    );
  }, [renderComposer, send, sending, draft, onSubmit, onKeyDown]);

  return (
    <Panel
      tone="flat"
      padding="md"
      aria-label="Room chat"
      style={{
        display: "flex",
        flexDirection: "column",
        maxHeight,
      }}
    >
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.25rem 0",
          minHeight: "8rem",
        }}
      >
        {status === "connecting" && messages.length === 0 ? (
          <LoadingSkeleton variant="card" lines={3} />
        ) : messages.length === 0 ? (
          <EmptyState
            kicker="Room chat"
            headline="No messages yet"
            body="Send the first message — others in the room will see it instantly."
            align="start"
          />
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                selfUserId={selfUserId}
                displayName={resolveDisplayName?.(m.senderUserId) ?? "Participant"}
              />
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: "0.35rem 0.5rem",
            color: "var(--hc-status-danger-text, #B91C1C)",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </p>
      ) : null}
      {composerNode}
    </Panel>
  );
}

function MessageRow({
  message,
  selfUserId,
  displayName,
}: {
  message: RoomMessage;
  selfUserId: string;
  displayName: string;
}) {
  const isSelf = message.senderUserId === selfUserId;
  return (
    <li
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isSelf ? "flex-end" : "flex-start",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          color: `var(${CSS_VARS.inkMuted})`,
          marginBottom: "0.15rem",
        }}
      >
        {isSelf ? "You" : displayName} ·{" "}
        {new Date(message.sentAt).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <p
        style={{
          margin: 0,
          padding: "0.5rem 0.75rem",
          maxWidth: "85%",
          borderRadius: "0.85rem",
          backgroundColor: isSelf
            ? `var(${CSS_VARS.accentSoft})`
            : `var(${CSS_VARS.surfaceElevated})`,
          color: `var(${CSS_VARS.ink})`,
          fontSize: "0.95rem",
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.bodyMd}
      </p>
    </li>
  );
}
