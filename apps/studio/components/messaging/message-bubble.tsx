"use client";

import { useState, useRef, useCallback } from "react";
import {
  Check,
  CheckCheck,
  Clock4,
  CornerUpLeft,
  Pencil,
  RotateCcw,
  Smile,
  Trash2,
} from "lucide-react";
import type { ReactionEmoji } from "@/lib/messaging/constants";
import type {
  StudioMessage,
} from "@/lib/messaging/types";
import {
  formatMessageTimestamp,
  isMessageDeleted,
} from "@/lib/messaging/utils";
import { MessageAttachmentView } from "./message-attachment";
import {
  ReactionDisplay,
  ReactionPicker,
} from "./message-reactions";
import { ReplyBubblePreview } from "./message-reply-preview";

type Props = {
  message: StudioMessage;
  /** True when this is the first bubble in a same-sender sequence. */
  isFirstInSequence: boolean;
  /** True when this is the last bubble in a same-sender sequence. */
  isLastInSequence: boolean;
  /** Optional pending state — used for optimistic / queued messages. */
  pending?: "sending" | "queued" | "failed";
  onReact: (messageId: string, emoji: ReactionEmoji) => Promise<void> | void;
  onReply: (message: StudioMessage) => void;
  onJumpToMessage?: (messageId: string) => void;
  onEdit?: (message: StudioMessage) => void;
  onDelete?: (message: StudioMessage) => void;
  onRetry?: (message: StudioMessage) => void;
  /** Resolved seen state for own messages (e.g. "Seen" once team read). */
  seen?: boolean;
};

/**
 * Single-message bubble. Renders three visual variants:
 *   - own (right-aligned, gold tint)
 *   - other (left-aligned, deep slate)
 *   - deleted (centred muted "removed" pill)
 *
 * System messages (milestone updates etc.) are NOT rendered here —
 * the parent message-list dispatches those to <SystemMessage />.
 */
export function MessageBubble({
  message,
  isFirstInSequence,
  isLastInSequence,
  pending,
  onReact,
  onReply,
  onJumpToMessage,
  onEdit,
  onDelete,
  onRetry,
  seen,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyEmoji, setBusyEmoji] = useState<ReactionEmoji | null>(null);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOwn = message.isOwnMessage;
  const isDeleted = isMessageDeleted(message);

  const handleReact = useCallback(
    async (emoji: ReactionEmoji) => {
      setPickerOpen(false);
      setBusyEmoji(emoji);
      try {
        await onReact(message.id, emoji);
      } finally {
        setBusyEmoji(null);
      }
    },
    [message.id, onReact],
  );

  if (isDeleted) {
    return <DeletedBubble alignRight={isOwn} createdAt={message.createdAt} messageId={message.id} />;
  }

  const hasAttachments = message.attachments.length > 0;
  const hasReply = Boolean(message.reply);

  const bubbleAlignment = isOwn ? "ml-auto" : "mr-auto";
  const bubbleColour = isOwn
    ? "bg-[#d4b14e]/15 border-[#d4b14e]/30 text-[#F5F4EE]"
    : "bg-[#0F1524] border-white/[0.06] text-[#F5F4EE]";
  const radiusCls = isOwn
    ? "rounded-[16px] rounded-br-[4px]"
    : "rounded-[16px] rounded-bl-[4px]";

  const sequenceMarginCls = isFirstInSequence ? "mt-3" : "mt-1";

  return (
    <div
      ref={containerRef}
      data-message-id={message.id}
      className={`${sequenceMarginCls} group relative flex w-full px-3 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPickerOpen(false);
      }}
    >
      {/* Avatar column for team messages, only on the first message of a sequence. */}
      {!isOwn ? (
        <div className="mr-2 flex w-8 shrink-0 flex-col items-center">
          {isFirstInSequence ? (
            <Avatar name={message.senderName} role={message.senderRole} />
          ) : (
            <span aria-hidden className="block h-8 w-8" />
          )}
        </div>
      ) : null}

      <div
        className={`relative flex max-w-[72%] flex-col ${bubbleAlignment} motion-safe:animate-[${
          isOwn ? "studio-msg-in-right" : "studio-msg-in-left"
        }_200ms_ease-out]`}
      >
        {/* Sender name above first-in-sequence team bubble. */}
        {!isOwn && isFirstInSequence ? (
          <div className="mb-1 ml-1 text-[12px] font-medium tracking-[0.005em] text-[#d4b14e]">
            {message.senderName}
            {message.senderRole === "team" ? (
              <span className="ml-2 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.10em] text-white/35">
                Studio
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={`relative ${bubbleColour} ${radiusCls} border px-3.5 py-2 ${
            pending === "sending" || pending === "queued" ? "opacity-80" : ""
          } ${
            pending === "failed"
              ? "border-l-[3px] border-l-red-400/80"
              : ""
          }`}
        >
          {hasReply && message.reply ? (
            <div className="mb-1.5">
              <ReplyBubblePreview
                preview={message.reply}
                ownTone={isOwn}
                onJump={onJumpToMessage}
              />
            </div>
          ) : null}

          {hasAttachments ? (
            <div className="mb-1.5 flex flex-col gap-1.5">
              {message.attachments.map((attachment) => (
                <MessageAttachmentView
                  key={attachment.id}
                  attachment={attachment}
                  ownTone={isOwn}
                />
              ))}
            </div>
          ) : null}

          {message.body ? (
            <p
              className={`whitespace-pre-wrap break-words text-[14px] leading-[1.45] ${
                isOwn ? "text-[#F5F4EE]" : "text-[#F5F4EE]"
              }`}
            >
              {message.body}
            </p>
          ) : null}

          {message.editedAt ? (
            <span
              className={`mt-1 inline-block text-[10px] italic ${
                isOwn ? "text-[#F5F4EE]/55" : "text-white/45"
              }`}
              title={`Edited ${formatMessageTimestamp(message.editedAt)}`}
            >
              edited
            </span>
          ) : null}

          {/* Hover-reveal action rail */}
          {hovered || pickerOpen ? (
            <div
              className={`absolute -top-3 z-20 inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-[#0A0E1A]/95 px-1 py-0.5 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm ${
                isOwn ? "right-2" : "left-2"
              }`}
            >
              <ActionButton
                label="React"
                icon={Smile}
                onClick={() => setPickerOpen((prev) => !prev)}
              />
              <ActionButton
                label="Reply"
                icon={CornerUpLeft}
                onClick={() => onReply(message)}
              />
              {isOwn && onEdit ? (
                <ActionButton
                  label="Edit"
                  icon={Pencil}
                  onClick={() => onEdit(message)}
                />
              ) : null}
              {isOwn && onDelete ? (
                <ActionButton
                  label="Delete"
                  icon={Trash2}
                  onClick={() => onDelete(message)}
                  intent="danger"
                />
              ) : null}
              {pending === "failed" && onRetry ? (
                <ActionButton
                  label="Retry"
                  icon={RotateCcw}
                  onClick={() => onRetry(message)}
                  intent="warn"
                />
              ) : null}
            </div>
          ) : null}

          <ReactionPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={handleReact}
            alignRight={isOwn}
          />
        </div>

        {message.reactions.length > 0 ? (
          <div className={isOwn ? "self-end" : "self-start"}>
            <ReactionDisplay
              reactions={message.reactions}
              onToggle={(emoji) => void handleReact(emoji)}
              ownTone={isOwn}
              busy={busyEmoji}
            />
          </div>
        ) : null}

        {/* Timestamp + status */}
        {isLastInSequence ? (
          <div
            className={`mt-1 flex items-center gap-1.5 text-[11px] tabular-nums text-white/40 ${
              isOwn ? "self-end" : "self-start"
            }`}
          >
            {pending === "sending" ? (
              <Clock4 className="h-3 w-3" aria-hidden />
            ) : pending === "queued" ? (
              <span className="inline-flex items-center gap-1 text-amber-300/80">
                <Clock4 className="h-3 w-3" aria-hidden />
                Queued
              </span>
            ) : pending === "failed" ? (
              <span className="inline-flex items-center gap-1 text-red-300">
                <RotateCcw className="h-3 w-3" aria-hidden />
                Tap to retry
              </span>
            ) : null}
            <time dateTime={message.createdAt}>
              {formatMessageTimestamp(message.createdAt)}
            </time>
            {isOwn && pending !== "sending" && pending !== "queued" && pending !== "failed" ? (
              <SeenIndicator seen={Boolean(seen)} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DeletedBubble({
  alignRight,
  createdAt,
  messageId,
}: {
  alignRight: boolean;
  createdAt: string;
  messageId: string;
}) {
  return (
    <div
      data-message-id={messageId}
      className={`mt-2 flex w-full px-3 ${
        alignRight ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[60%] rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 text-[12px] italic text-white/40 ${
          alignRight ? "rounded-br-[4px]" : "rounded-bl-[4px]"
        }`}
      >
        This message was removed
        <time className="ml-2 not-italic text-white/30" dateTime={createdAt}>
          {formatMessageTimestamp(createdAt)}
        </time>
      </div>
    </div>
  );
}

function Avatar({
  name,
  role,
}: {
  name: string;
  role: StudioMessage["senderRole"];
}) {
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "S";
  const isTeam = role === "team";
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.02em] ${
        isTeam
          ? "bg-gradient-to-br from-[#d4b14e]/30 to-[#d4b14e]/10 text-[#d4b14e]"
          : "bg-white/[0.06] text-white/70"
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  intent,
}: {
  label: string;
  icon: typeof Smile;
  onClick: () => void;
  intent?: "warn" | "danger";
}) {
  const tone =
    intent === "danger"
      ? "text-red-300 hover:bg-red-500/10"
      : intent === "warn"
        ? "text-amber-300 hover:bg-amber-500/10"
        : "text-white/65 hover:bg-white/[0.06] hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${tone}`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function SeenIndicator({ seen }: { seen: boolean }) {
  if (!seen) {
    return <Check className="h-3 w-3 text-white/35" aria-label="Sent" />;
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[#d4b14e]">
      <CheckCheck className="h-3.5 w-3.5" aria-hidden />
      <span className="font-medium tracking-[0.005em] text-white/55">Seen</span>
    </span>
  );
}
