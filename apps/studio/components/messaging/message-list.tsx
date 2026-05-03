"use client";

import { Fragment, useMemo } from "react";
import type { ReactionEmoji } from "@/lib/messaging/constants";
import type { StudioMessage } from "@/lib/messaging/types";
import {
  groupIntoSequences,
  withDateSeparators,
} from "@/lib/messaging/utils";
import { MessageBubble } from "./message-bubble";
import { SystemMessage } from "./system-message";
import { DateSeparator } from "./date-separator";

type Props = {
  messages: StudioMessage[];
  /** Pending state by message id (optimistic / queued / failed). */
  pendingByMessageId?: Map<
    string,
    "sending" | "queued" | "failed"
  >;
  /** Resolved seen state for own messages. */
  seenByMessageId?: Map<string, boolean>;
  /** Search filter — when non-empty, dim non-matching messages. */
  searchQuery?: string;
  onReact: (messageId: string, emoji: ReactionEmoji) => Promise<void> | void;
  onReply: (message: StudioMessage) => void;
  onJumpToMessage?: (messageId: string) => void;
  onEdit?: (message: StudioMessage) => void;
  onDelete?: (message: StudioMessage) => void;
  onRetry?: (message: StudioMessage) => void;
};

const SYSTEM_TYPES = new Set([
  "system",
  "milestone_update",
  "file_share",
  "payment_update",
  "approval_request",
]);

/**
 * Renders the conversation as a vertically scrolling timeline. Inserts
 * date separators between days, groups consecutive same-sender bubbles
 * into sequences, and dispatches system messages to <SystemMessage />.
 *
 * Implementation note on virtualisation: rather than introducing a
 * heavyweight virtual scroller, the list relies on (1) the parent
 * limiting how many messages are loaded into state and (2) the
 * `content-visibility: auto` CSS hint applied to each bubble so the
 * browser skips paint/layout for off-screen rows. This keeps a long
 * thread responsive without a third-party dep.
 */
export function MessageList({
  messages,
  pendingByMessageId,
  seenByMessageId,
  searchQuery,
  onReact,
  onReply,
  onJumpToMessage,
  onEdit,
  onDelete,
  onRetry,
}: Props) {
  const entries = useMemo(() => withDateSeparators(messages), [messages]);

  const matchesSearch = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return null;
    const needle = searchQuery.trim().toLowerCase();
    const set = new Set<string>();
    for (const msg of messages) {
      if (msg.body.toLowerCase().includes(needle)) {
        set.add(msg.id);
      } else if (
        msg.attachments.some((a) =>
          a.label.toLowerCase().includes(needle),
        )
      ) {
        set.add(msg.id);
      }
    }
    return set;
  }, [messages, searchQuery]);

  // Pre-compute sequence boundaries so each bubble knows its position
  // in its sequence without re-running the grouping logic per render.
  const sequenceMembership = useMemo(() => {
    const sequences = groupIntoSequences(
      messages.filter((m) => !SYSTEM_TYPES.has(m.messageType)),
    );
    const positions = new Map<
      string,
      { isFirst: boolean; isLast: boolean }
    >();
    for (const sequence of sequences) {
      const seqMessages = sequence.messages;
      seqMessages.forEach((msg, idx) => {
        positions.set(msg.id, {
          isFirst: idx === 0,
          isLast: idx === seqMessages.length - 1,
        });
      });
    }
    return positions;
  }, [messages]);

  return (
    <div
      className="relative flex flex-col gap-0 py-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Project conversation"
    >
      {entries.map((entry) => {
        if (entry.kind === "date") {
          return <DateSeparator key={entry.id} iso={entry.iso} />;
        }
        const message = entry.message;
        const isSystem = SYSTEM_TYPES.has(message.messageType);
        const dim =
          matchesSearch !== null &&
          !matchesSearch.has(message.id);

        const wrapperCls = `${dim ? "opacity-30 transition-opacity" : "opacity-100 transition-opacity"} [content-visibility:auto] [contain-intrinsic-size:1px_120px]`;

        if (isSystem) {
          return (
            <Fragment key={message.id}>
              <div className={wrapperCls}>
                <SystemMessage message={message} />
              </div>
            </Fragment>
          );
        }

        const position = sequenceMembership.get(message.id) || {
          isFirst: true,
          isLast: true,
        };

        return (
          <Fragment key={message.id}>
            <div className={wrapperCls}>
              <MessageBubble
                message={message}
                isFirstInSequence={position.isFirst}
                isLastInSequence={position.isLast}
                pending={pendingByMessageId?.get(message.id)}
                seen={seenByMessageId?.get(message.id)}
                onReact={onReact}
                onReply={onReply}
                onJumpToMessage={onJumpToMessage}
                onEdit={onEdit}
                onDelete={onDelete}
                onRetry={onRetry}
              />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
