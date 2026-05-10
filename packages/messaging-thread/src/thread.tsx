"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Paperclip } from "lucide-react";
import {
  ChatComposer,
  type AttachmentUploader,
  type ComposerSendPayload,
  type ComposerTone,
  type RemoteAttachment,
} from "@henryco/chat-composer";
import type {
  MessageThreadProps,
  ThreadAttachment,
  ThreadMessage,
} from "./types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || (name[0] || "S").toUpperCase();
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  const isOwn = Boolean(message.isOwnMessage);
  const isSystem = message.senderRole === "system";
  const side = isSystem ? "system" : isOwn ? "own" : "team";
  const initials = getInitials(message.senderName);

  return (
    <li className="mt-bubble-row" data-side={side}>
      {!isSystem && !isOwn ? (
        <span className="mt-avatar" aria-hidden>
          {initials}
        </span>
      ) : null}
      <div className="mt-bubble">
        {!isSystem ? (
          <div className="mt-bubble-meta">
            <span className="mt-bubble-name">
              {isOwn ? "You" : message.senderName}
            </span>
            <span>{formatTime(message.createdAt)}</span>
            {message.editedAt ? <span className="mt-bubble-edited">(edited)</span> : null}
          </div>
        ) : null}
        <p className="mt-bubble-body">{message.body}</p>
        {message.attachments && message.attachments.length > 0 ? (
          <div className="mt-bubble-attachments">
            {message.attachments.map((attachment, idx) => (
              <a
                key={`${attachment.url}-${idx}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="mt-attachment-chip"
              >
                <Paperclip className="h-3 w-3" aria-hidden />
                <span>{attachment.name}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function pickComposerTone(threadId: string): ComposerTone {
  // Heuristic: division-prefixed thread IDs (`studio-thread-…`,
  // `account-…`) tint the composer accent. Defaults to neutral when the
  // host hasn't encoded a division — the workspace-shell --ws-* tokens
  // still carry the division in CSS.
  if (threadId.startsWith("studio")) return "studio";
  if (threadId.startsWith("account")) return "account";
  if (threadId.startsWith("care")) return "care";
  if (threadId.startsWith("jobs")) return "jobs";
  if (threadId.startsWith("marketplace")) return "marketplace";
  return "neutral";
}

/**
 * Audience-agnostic thread renderer. Owns:
 *   - render of bubble list
 *   - autoscroll on new message
 *   - optimistic send (pending bubble appears immediately, replaced
 *     with persisted ID on success or removed + error shown on failure)
 *   - mark-read fire-and-forget on mount + after each incoming message
 *   - realtime INSERT subscription (Supabase postgres_changes), with
 *     graceful no-op fallback when getSupabase returns null
 *
 * Composer concerns (autosize, drag-drop, paste, multi-attach, draft
 * persistence, full-screen mobile, send-button states, keyboard shortcuts,
 * reduced-motion) are delivered by `@henryco/chat-composer`'s ChatComposer.
 *
 * Does NOT own:
 *   - data fetching of initial messages (host passes initialMessages)
 *   - persistence — adapter.sendAction does the write
 *   - upload — adapter.attachAction does the upload
 *   - which Supabase client to use — host passes getSupabase
 */
export function MessageThread({
  threadId,
  initialMessages,
  viewer,
  adapter,
  getSupabase,
  placeholder = "Write a message…",
  emptyTitle = "Start the conversation",
  emptyBody = "Ask a question, share feedback, or attach a reference. Replies arrive here in real time.",
  composerExtras,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [composerError, setComposerError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll to bottom when message count changes.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Mark-read on mount.
  useEffect(() => {
    if (!adapter.markReadAction) return;
    const formData = new FormData();
    formData.set("threadId", threadId);
    adapter.markReadAction(formData).catch(() => null);
  }, [threadId, adapter]);

  // Realtime INSERT subscription.
  useEffect(() => {
    if (!getSupabase) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const schema = adapter.schema ?? "public";
    const channel = supabase
      .channel(adapter.channelName(threadId))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema,
          table: adapter.table,
          filter: adapter.subscriptionFilter(threadId),
        },
        (payload: { new?: Record<string, unknown> }) => {
          if (!payload.new) return;
          const incoming = adapter.rowToMessage(payload.new, viewer.userId);
          if (!incoming) return;
          if (incoming.senderId === viewer.userId) return;
          setMessages((prev) =>
            prev.find((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
          if (adapter.markReadAction) {
            const formData = new FormData();
            formData.set("threadId", threadId);
            adapter.markReadAction(formData).catch(() => null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, viewer.userId, adapter, getSupabase]);

  // Bridge the engine's per-file `attachAction` (FormData → upload result)
  // to ChatComposer's `AttachmentUploader` (file + onProgress → remote).
  // Server actions don't expose granular upload progress, so we surface a
  // mid-tick + final tick to keep the chip animated.
  const uploader: AttachmentUploader | undefined = useMemo(() => {
    const attach = adapter.attachAction;
    if (!attach) return undefined;
    return async (file, onProgress) => {
      onProgress(15);
      const formData = new FormData();
      formData.set("file", file, file.name);
      const result = await attach(formData);
      onProgress(100);
      if (!result.ok) {
        throw new Error(result.reason || "Upload failed");
      }
      const remote: RemoteAttachment = {
        url: result.url,
        bytes: result.size ?? undefined,
        format: result.type,
        resourceType: result.type.startsWith("image/") ? "image" : "raw",
      };
      return remote;
    };
  }, [adapter]);

  const handleSend = useCallback(
    async (payload: ComposerSendPayload) => {
      const body = payload.text.trim();
      const uploadedAttachments: ThreadAttachment[] = payload.attachments
        .filter((a) => a.status === "uploaded" && a.remote?.url)
        .map((a) => ({
          url: a.remote!.url,
          name: a.name,
          type: a.mimeType,
          size: a.size,
        }));

      if (!body && uploadedAttachments.length === 0) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: ThreadMessage = {
        id: optimisticId,
        threadId,
        senderId: viewer.userId,
        senderName: viewer.fullName,
        senderRole: "viewer",
        body,
        attachments: uploadedAttachments,
        createdAt: new Date().toISOString(),
        editedAt: null,
        isOwnMessage: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      setComposerError(null);

      const formData = new FormData();
      formData.set("threadId", threadId);
      formData.set("body", body);
      if (uploadedAttachments.length > 0) {
        formData.set("attachments", JSON.stringify(uploadedAttachments));
      }
      const result = await adapter.sendAction(formData);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        // Throwing here lets ChatComposer drive its own send-failed UX
        // (shake + error region) — host doesn't have to wire it.
        throw new Error(result.reason || "We couldn't send the message. Try again.");
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...m, id: result.messageId, ...(result.message ?? {}) }
            : m,
        ),
      );
    },
    [adapter, threadId, viewer.userId, viewer.fullName],
  );

  const tone = useMemo(() => pickComposerTone(threadId), [threadId]);

  return (
    <div className="mt-thread">
      {messages.length === 0 ? (
        <div className="mt-thread-empty">
          <span className="mt-thread-empty-icon" aria-hidden>
            <MessageSquare className="h-5 w-5" />
          </span>
          <h3 className="mt-thread-empty-title">{emptyTitle}</h3>
          <p className="mt-thread-empty-body">{emptyBody}</p>
        </div>
      ) : (
        <div ref={scrollRef} className="mt-thread-list" aria-live="polite">
          <ul className="mt-thread-list-inner">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-composer-host">
        <ChatComposer
          threadId={threadId}
          tone={tone}
          placeholder={placeholder}
          enableAttachments={Boolean(adapter.attachAction)}
          enableDraft
          enableFullScreenOnMobile
          uploadAttachment={uploader}
          onSend={handleSend}
          onSendError={(error) => setComposerError(error.message)}
          onSendSuccess={() => setComposerError(null)}
          composerExtras={
            composerExtras
              ? ({ text, setText }) => composerExtras({ draft: text, setDraft: setText })
              : undefined
          }
        />
        {composerError ? (
          <p className="mt-composer-error" role="alert">
            {composerError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
