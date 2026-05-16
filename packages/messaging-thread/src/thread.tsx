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
  ThreadChannelLike,
  ThreadMessage,
} from "./types";
import { renderBody as renderMarkdownBody } from "./markdown";
import { useThreadAppearance } from "./appearance";

/** Typing-presence cadence — broadcasts at most once per 2s while a
 * participant is actively typing; the indicator decays after 4s with no
 * fresh ping so a participant who walks away fades out naturally. */
const TYPING_BROADCAST_INTERVAL_MS = 2_000;
const TYPING_TTL_MS = 4_000;

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

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

/** Coarse, human label for a MIME type used in file chips. */
function formatTypeLabel(type: string | null | undefined): string {
  if (!type) return "FILE";
  const subtype = type.split("/")[1] ?? type;
  // Strip the +xml / +zip suffixes some MIME types carry.
  const root = subtype.split("+")[0] ?? subtype;
  if (root.length <= 4) return root.toUpperCase();
  // A handful of common ones get nice short labels.
  if (root === "pdf") return "PDF";
  if (root === "msword" || root === "vnd.ms-word") return "DOC";
  if (root.startsWith("vnd.openxmlformats-officedocument.wordprocessingml")) return "DOCX";
  if (root.startsWith("vnd.openxmlformats-officedocument.spreadsheetml")) return "XLSX";
  if (root === "vnd.ms-excel") return "XLS";
  if (root.startsWith("vnd.openxmlformats-officedocument.presentationml")) return "PPTX";
  if (root === "plain") return "TXT";
  return root.slice(0, 4).toUpperCase();
}

function isImageAttachment(attachment: ThreadAttachment): boolean {
  return Boolean(attachment.type && attachment.type.startsWith("image/"));
}

/** Status label shown under viewer-owned bubbles. Adapters opt-in by
 * populating `readAt` / `deliveredAt`; engine-only consumers see
 * "Sending…" while optimistic and "Sent" once persisted. */
function ownStatusLabel(message: ThreadMessage, isPending: boolean): string {
  if (isPending) return "Sending…";
  if (message.readAt) return "Read";
  if (message.deliveredAt) return "Delivered";
  return "Sent";
}

function MessageBubble({
  message,
  renderMarkdown,
}: {
  message: ThreadMessage;
  renderMarkdown: boolean;
}) {
  const isOwn = Boolean(message.isOwnMessage);
  const isSystem = message.senderRole === "system";
  const side = isSystem ? "system" : isOwn ? "own" : "team";
  const initials = getInitials(message.senderName);
  const isPending = message.id.startsWith("optimistic-");
  const attachments = message.attachments ?? [];
  const images = attachments.filter(isImageAttachment);
  const files = attachments.filter((a) => !isImageAttachment(a));

  return (
    <li className="mt-bubble-row" data-side={side} data-pending={isPending || undefined}>
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
        {message.body ? (
          renderMarkdown && !isSystem ? (
            <div className="mt-bubble-body mt-bubble-body-rich">
              {renderMarkdownBody(message.body, `m-${message.id}`)}
            </div>
          ) : (
            <p className="mt-bubble-body">{message.body}</p>
          )
        ) : null}
        {images.length > 0 ? (
          <div
            className="mt-bubble-images"
            data-count={images.length > 1 ? "many" : "one"}
          >
            {images.map((attachment, idx) => (
              <a
                key={`img-${attachment.url}-${idx}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="mt-attachment-image"
                aria-label={`Open image ${attachment.name} in a new tab`}
              >
                <img
                  src={attachment.url}
                  alt={attachment.name || "Attached image"}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ))}
          </div>
        ) : null}
        {files.length > 0 ? (
          <ul className="mt-bubble-attachments">
            {files.map((attachment, idx) => {
              const sizeLabel = formatBytes(attachment.size ?? null);
              const typeLabel = formatTypeLabel(attachment.type);
              return (
                <li key={`file-${attachment.url}-${idx}`}>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-attachment-chip"
                  >
                    <span className="mt-attachment-icon" aria-hidden>
                      <Paperclip className="h-3 w-3" />
                    </span>
                    <span className="mt-attachment-text">
                      <span className="mt-attachment-name">{attachment.name}</span>
                      <span className="mt-attachment-meta">
                        {[typeLabel, sizeLabel].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
        {isOwn && !isSystem ? (
          <span
            className="mt-bubble-status"
            data-state={
              isPending
                ? "pending"
                : message.readAt
                  ? "read"
                  : message.deliveredAt
                    ? "delivered"
                    : "sent"
            }
          >
            {ownStatusLabel(message, isPending)}
          </span>
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
 *   - render of bubble list with rich attachments (inline image
 *     previews + file chips with type/size labels)
 *   - per-bubble status on viewer-owned messages
 *     (Sending… → Sent → Delivered → Read; the latter two only when
 *     the adapter populates ThreadMessage.deliveredAt / readAt)
 *   - autoscroll on new message
 *   - optimistic send (pending bubble appears immediately, replaced
 *     with persisted ID on success or removed + error shown on failure)
 *   - mark-read fire-and-forget on mount + after each incoming message
 *   - realtime INSERT subscription (Supabase postgres_changes), with
 *     graceful no-op fallback when getSupabase returns null
 *   - polite SR announcer that fires on incoming-only messages
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
/** Calendar-day key for a date in the viewer's local timezone. The
 *  divider walk compares these so two messages sent on the same day
 *  cluster, two messages a minute apart but across midnight don't. */
function localDayKey(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "invalid";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Classify a calendar day relative to the viewer's local today. */
function dayPosition(iso: string): "today" | "yesterday" | "earlier" {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "earlier";
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const msgKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (msgKey === todayKey) return "today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
  if (msgKey === yKey) return "yesterday";
  return "earlier";
}

export function MessageThread({
  threadId,
  initialMessages,
  viewer,
  adapter,
  getSupabase,
  placeholder = "Write a message…",
  emptyTitle = "Start the conversation",
  emptyBody = "Ask a question, share feedback, or attach a reference. Replies arrive here in real time.",
  renderMarkdown = false,
  disableComposer = false,
  enableTypingPresence = true,
  composerExtras,
  dayDividerLabel,
}: MessageThreadProps) {
  const appearance = useThreadAppearance();
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [composerError, setComposerError] = useState<string | null>(null);
  // Hidden polite announcer for screen readers — gets the latest
  // INCOMING message as a string (eg. "Adaeze said: thanks for the
  // update"), so SR users hear new messages without the engine
  // shouting on every state mutation.
  const [announcement, setAnnouncement] = useState<string>("");
  // Realtime channel state. "live" once SUBSCRIBED, "reconnecting"
  // when the channel ERRORs / TIMES_OUT / CLOSES (engine auto-resubs).
  // "idle" when getSupabase returned null (SSR / disabled host).
  const [liveStatus, setLiveStatus] = useState<
    "idle" | "connecting" | "live" | "reconnecting"
  >("idle");
  // PASS 24 phase 5 — typing presence. Map from sender userId to the
  // last "typing" broadcast timestamp + display name. The render loop
  // shows a calm three-dot indicator whenever at least one entry is
  // newer than TYPING_TTL ms; the cleanup interval prunes stale entries
  // so a user who stops typing without sending fades out naturally.
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { name: string; lastAt: number }>
  >(() => new Map());
  // Ref to the current channel so the composer's onTyping callback can
  // broadcast through it without re-mounting the realtime effect.
  const channelRef = useRef<ThreadChannelLike | null>(null);
  const lastTypingSentRef = useRef<number>(0);
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

  // Realtime INSERT subscription with explicit reconnect-on-drop.
  // Supabase Realtime auto-recovers most transient drops, but on
  // channel CLOSED / CHANNEL_ERROR / TIMED_OUT we tear down + recreate
  // the channel so the host doesn't have to refresh the route to
  // restore live updates.
  useEffect(() => {
    if (!getSupabase) {
      setLiveStatus("idle");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setLiveStatus("idle");
      return;
    }
    setLiveStatus("connecting");

    const schema = adapter.schema ?? "public";
    let channel: ThreadChannelLike | null = null;
    let cancelled = false;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1500;

    const handleInsert = (payload: Record<string, unknown>) => {
      const newRow = (payload as { new?: Record<string, unknown> }).new;
      if (!newRow) return;
      const incoming = adapter.rowToMessage(newRow, viewer.userId);
      if (!incoming) return;
      if (incoming.senderId === viewer.userId) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      // A new INSERT means the typing burst from that sender just
      // resolved — clear their indicator immediately so the bubble
      // doesn't render alongside a stale "typing…" row.
      if (incoming.senderId) {
        setTypingUsers((prev) => {
          if (!prev.has(incoming.senderId!)) return prev;
          const next = new Map(prev);
          next.delete(incoming.senderId!);
          return next;
        });
      }
      if (incoming.senderRole !== "system") {
        const preview = incoming.body
          ? incoming.body.length > 140
            ? `${incoming.body.slice(0, 140)}…`
            : incoming.body
          : incoming.attachments && incoming.attachments.length > 0
            ? `sent ${incoming.attachments.length} attachment${
                incoming.attachments.length === 1 ? "" : "s"
              }`
            : "";
        setAnnouncement(
          preview
            ? `${incoming.senderName} said: ${preview}`
            : `${incoming.senderName} sent a message`,
        );
      }
      if (adapter.markReadAction) {
        const formData = new FormData();
        formData.set("threadId", threadId);
        adapter.markReadAction(formData).catch(() => null);
      }
    };

    const handleTyping = (payload: Record<string, unknown>) => {
      const data = (payload as { payload?: Record<string, unknown> }).payload;
      if (!data) return;
      const senderId = typeof data.userId === "string" ? data.userId : null;
      const name = typeof data.name === "string" ? data.name : "";
      if (!senderId || senderId === viewer.userId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(senderId, { name: name || "Someone", lastAt: Date.now() });
        return next;
      });
    };

    const connect = () => {
      if (cancelled) return;
      const ch = supabase.channel(adapter.channelName(threadId));
      const withInsert = ch.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema,
          table: adapter.table,
          filter: adapter.subscriptionFilter(threadId),
        },
        handleInsert,
      );
      const withTyping = enableTypingPresence
        ? withInsert.on("broadcast", { event: "typing" }, handleTyping)
        : withInsert;
      channel = withTyping.subscribe((status: string) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setLiveStatus("live");
          retryDelay = 1500;
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setLiveStatus("reconnecting");
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch {
              // ignore — channel was already torn down
            }
            channel = null;
            channelRef.current = null;
          }
          // Capped exponential back-off, max 15s. The retry handle is
          // tracked so the cleanup function can clear it on unmount.
          retryHandle = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 15000);
        }
      });
      channelRef.current = channel;
    };

    connect();

    return () => {
      cancelled = true;
      channelRef.current = null;
      if (retryHandle) {
        clearTimeout(retryHandle);
        retryHandle = null;
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [threadId, viewer.userId, viewer.fullName, adapter, getSupabase, enableTypingPresence]);

  // Decay stale typing entries every second so a participant who stops
  // typing without sending fades out after TYPING_TTL_MS instead of
  // sticking forever.
  useEffect(() => {
    if (!enableTypingPresence) return;
    if (typingUsers.size === 0) return;
    const handle = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TTL_MS;
      setTypingUsers((prev) => {
        let mutated = false;
        const next = new Map(prev);
        for (const [id, entry] of next) {
          if (entry.lastAt < cutoff) {
            next.delete(id);
            mutated = true;
          }
        }
        return mutated ? next : prev;
      });
    }, 1_000);
    return () => window.clearInterval(handle);
  }, [enableTypingPresence, typingUsers.size]);

  const handleTyping = useCallback(() => {
    if (!enableTypingPresence) return;
    const channel = channelRef.current;
    if (!channel?.send) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_BROADCAST_INTERVAL_MS) return;
    lastTypingSentRef.current = now;
    try {
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: viewer.userId, name: viewer.fullName },
      });
    } catch {
      // Broadcast failed — the next keystroke will retry. Engine never
      // surfaces typing-presence errors because they're cosmetic.
    }
  }, [enableTypingPresence, viewer.userId, viewer.fullName]);

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
  const activeTypers = useMemo(() => {
    const cutoff = Date.now() - TYPING_TTL_MS;
    const out: Array<{ id: string; name: string }> = [];
    for (const [id, entry] of typingUsers) {
      if (entry.lastAt >= cutoff) out.push({ id, name: entry.name });
    }
    return out;
  }, [typingUsers]);

  return (
    <div
      className="mt-thread"
      data-live={liveStatus}
      data-font={appearance.fontSize}
      data-density={appearance.density}
      data-surface={appearance.surfaceTone}
    >
      {liveStatus === "reconnecting" ? (
        <div className="mt-live-banner" role="status">
          <span className="mt-live-dot" aria-hidden />
          <span>Reconnecting…</span>
        </div>
      ) : null}
      {liveStatus === "live" ? (
        <div
          className="mt-live-pill"
          role="status"
          aria-label="Realtime updates are live"
        >
          <span className="mt-live-pill-dot" aria-hidden />
          <span className="mt-live-pill-label">Live</span>
        </div>
      ) : null}
      {messages.length === 0 ? (
        <div className="mt-thread-empty">
          <span className="mt-thread-empty-icon" aria-hidden>
            <MessageSquare className="h-5 w-5" />
          </span>
          <h3 className="mt-thread-empty-title">{emptyTitle}</h3>
          <p className="mt-thread-empty-body">{emptyBody}</p>
        </div>
      ) : (
        <div ref={scrollRef} className="mt-thread-list">
          <ul className="mt-thread-list-inner">
            {(() => {
              const out: import("react").ReactNode[] = [];
              let prevDayKey: string | null = null;
              for (const message of messages) {
                if (dayDividerLabel) {
                  const key = localDayKey(message.createdAt);
                  if (key !== prevDayKey) {
                    const date = new Date(message.createdAt);
                    if (Number.isFinite(date.getTime())) {
                      const label = dayDividerLabel(date, dayPosition(message.createdAt));
                      if (label) {
                        out.push(
                          <li
                            key={`day-${key}-${message.id}`}
                            className="mt-day-divider"
                            role="separator"
                            aria-label={label}
                          >
                            <span>{label}</span>
                          </li>,
                        );
                      }
                    }
                    prevDayKey = key;
                  }
                }
                out.push(
                  <MessageBubble
                    key={message.id}
                    message={message}
                    renderMarkdown={renderMarkdown}
                  />,
                );
              }
              return out;
            })()}
            {activeTypers.length > 0 ? (
              <TypingIndicator typers={activeTypers} />
            ) : null}
          </ul>
        </div>
      )}

      {/* Dedicated polite announcer — only ever holds the latest
          incoming message string, so screen readers say it once
          without re-announcing on every state mutation. */}
      <div
        className="mt-sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {announcement}
      </div>

      {disableComposer ? null : (
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
            onTyping={enableTypingPresence ? handleTyping : undefined}
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
      )}
    </div>
  );
}

function TypingIndicator({ typers }: { typers: Array<{ id: string; name: string }> }) {
  const label =
    typers.length === 1
      ? `${typers[0].name} is typing`
      : typers.length === 2
        ? `${typers[0].name} and ${typers[1].name} are typing`
        : `${typers[0].name} and ${typers.length - 1} others are typing`;
  return (
    <li className="mt-bubble-row mt-bubble-row--typing" aria-live="off">
      <span className="mt-avatar" aria-hidden>
        {getInitials(typers[0].name)}
      </span>
      <div className="mt-typing-bubble" role="status" aria-label={label}>
        <span className="mt-typing-dot" aria-hidden />
        <span className="mt-typing-dot" aria-hidden />
        <span className="mt-typing-dot" aria-hidden />
        <span className="mt-sr-only">{label}</span>
      </div>
    </li>
  );
}
