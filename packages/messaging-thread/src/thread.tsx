"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  X as XIcon,
} from "lucide-react";
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

/**
 * Audience-agnostic thread renderer. Owns:
 *   - render of bubble list
 *   - autoscroll on new message
 *   - composer with attachment chips
 *   - optimistic send (pending bubble appears immediately, replaced
 *     with persisted ID on success or removed + error shown on failure)
 *   - mark-read fire-and-forget on mount + after each incoming message
 *   - realtime INSERT subscription (Supabase postgres_changes), with
 *     graceful no-op fallback when getSupabase returns null
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
}: MessageThreadProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ThreadAttachment[]>([]);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleAttachment(file: File) {
    if (!file || !adapter.attachAction) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await adapter.attachAction(formData);
    setUploading(false);
    if (!result.ok) {
      setError("We couldn't upload that file. Try again.");
      return;
    }
    setAttachments((prev) => [
      ...prev,
      { url: result.url, name: result.name, type: result.type, size: result.size },
    ]);
  }

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: ThreadMessage = {
      id: optimisticId,
      threadId,
      senderId: viewer.userId,
      senderName: viewer.fullName,
      senderRole: "viewer",
      body,
      attachments,
      createdAt: new Date().toISOString(),
      editedAt: null,
      isOwnMessage: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    const sentAttachments = attachments;
    setAttachments([]);
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("threadId", threadId);
      formData.set("body", body);
      if (sentAttachments.length > 0) {
        formData.set("attachments", JSON.stringify(sentAttachments));
      }
      const result = await adapter.sendAction(formData);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError("We couldn't send the message. Try again.");
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...m, id: result.messageId, ...(result.message ?? {}) }
              : m,
          ),
        );
      }
    });
  }

  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

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

      <form className="mt-composer" onSubmit={handleSend}>
        {attachments.length > 0 ? (
          <div className="mt-composer-attachments">
            {attachments.map((attachment, idx) => (
              <span key={`${attachment.url}-${idx}`} className="mt-composer-attachment">
                <Paperclip className="h-3 w-3" aria-hidden />
                <span>{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  aria-label={`Remove ${attachment.name}`}
                  className="mt-composer-icon-btn"
                  style={{ width: "1.1rem", height: "1.1rem" }}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-composer-row">
          <textarea
            className="mt-composer-textarea"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
          />

          <div className="mt-composer-actions">
            {adapter.attachAction ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAttachment(file);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <button
                  type="button"
                  className="mt-composer-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Attach file"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>
              </>
            ) : null}
            <button
              type="submit"
              className="mt-composer-send"
              disabled={pending || draft.trim().length === 0}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {pending ? "Sending" : "Send"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-composer-error">{error}</p> : null}
        <p className="mt-composer-hint">⌘/Ctrl + Enter to send</p>
      </form>
    </div>
  );
}
