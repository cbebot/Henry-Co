"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, MessageSquare, Paperclip, Send } from "lucide-react";
import { sendProjectMessageAction, markProjectMessagesReadAction, attachMessageFileAction } from "@/lib/portal/actions";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { ClientMessage, ClientMessageAttachment } from "@/types/portal";
import { relativeTime } from "@/lib/portal/helpers";

function senderInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || (name[0] || "S").toUpperCase();
}

export function MessageThread({
  projectId,
  initialMessages,
  viewerId,
  viewerName,
}: {
  projectId: string;
  initialMessages: ClientMessage[];
  viewerId: string;
  viewerName: string;
}) {
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ClientMessageAttachment[]>([]);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const formData = new FormData();
    formData.set("projectId", projectId);
    markProjectMessagesReadAction(formData).catch(() => null);
  }, [projectId]);

  useEffect(() => {
    let supabase: ReturnType<typeof getBrowserSupabase>;
    try {
      supabase = getBrowserSupabase();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`portal-messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "studio_project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          if (row.is_internal) return;
          if (row.sender_id === viewerId) return;
          const incoming: ClientMessage = {
            id: String(row.id || ""),
            projectId,
            senderId: (row.sender_id as string | null) || null,
            senderName: String(row.sender || "HenryCo Studio"),
            senderRole: String(row.sender_role || "team"),
            body: String(row.body || ""),
            attachments: Array.isArray(row.attachments)
              ? (row.attachments as ClientMessageAttachment[])
              : [],
            readBy: Array.isArray(row.read_by) ? (row.read_by as string[]) : [],
            createdAt: String(row.created_at || new Date().toISOString()),
            editedAt: (row.edited_at as string | null) || null,
            isOwnMessage: false,
          };
          setMessages((prev) =>
            prev.find((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );

          const formData = new FormData();
          formData.set("projectId", projectId);
          markProjectMessagesReadAction(formData).catch(() => null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, viewerId]);

  async function handleAttachment(file: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await attachMessageFileAction(formData);
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
    const optimistic: ClientMessage = {
      id: optimisticId,
      projectId,
      senderId: viewerId,
      senderName: viewerName,
      senderRole: "client",
      body,
      attachments,
      readBy: [viewerId],
      createdAt: new Date().toISOString(),
      editedAt: null,
      isOwnMessage: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    const sentAttachments = attachments;
    setAttachments([]);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("body", body);
      if (sentAttachments.length > 0) {
        formData.set("attachments", JSON.stringify(sentAttachments));
      }

      const result = await sendProjectMessageAction(formData);
      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError("We couldn't send the message. Try again.");
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, id: result.messageId } : m))
        );
      }
    });
  }

  return (
    <div className="portal-card-elev flex h-[28rem] flex-col overflow-hidden sm:h-[32rem]">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-[var(--studio-ink)]">Start the conversation</h3>
          <p className="max-w-sm text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
            Ask the team a question, share feedback, or attach a reference. Replies arrive here in
            real time.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-5"
          aria-live="polite"
        >
          <ul className="space-y-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSend} className="border-t border-[var(--studio-line)] bg-[rgba(255,255,255,0.02)] p-3 sm:p-4">
        {attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <span
                key={`${attachment.url}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[11.5px] font-semibold text-[var(--studio-ink)]"
              >
                <Paperclip className="h-3 w-3" />
                {attachment.name}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                  className="text-[var(--studio-ink-soft)] hover:text-[var(--studio-ink)]"
                  aria-label={`Remove ${attachment.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="portal-button portal-button-ghost"
            style={{ padding: "0.55rem", minHeight: 40 }}
            aria-label="Attach a file"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) handleAttachment(next);
              event.target.value = "";
            }}
          />
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message…"
            rows={1}
            className="portal-textarea min-h-[40px] flex-1 resize-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
                event.preventDefault();
                (event.currentTarget.form as HTMLFormElement)?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || pending}
            className="portal-button portal-button-primary"
            style={{ padding: "0.55rem 0.95rem", minHeight: 40 }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        {error ? <p className="mt-2 text-[12px] text-[#ffb8b8]">{error}</p> : null}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ClientMessage }) {
  const own = message.isOwnMessage;
  return (
    <li className={`flex items-start gap-2.5 ${own ? "flex-row-reverse" : ""}`}>
      <span
        className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold uppercase tracking-[0.06em] ${
          own
            ? "bg-[linear-gradient(135deg,#dff8fb,#4eb8c2)] text-[#021016]"
            : "border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] text-[var(--studio-ink)]"
        }`}
      >
        {senderInitials(message.senderName || "Studio")}
      </span>
      <div className={`flex max-w-[80%] flex-col ${own ? "items-end" : "items-start"}`}>
        <div className="flex items-baseline gap-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
          <span>{own ? "You" : message.senderName}</span>
          <span>· {relativeTime(message.createdAt)}</span>
        </div>
        <div className="portal-message-bubble mt-1" data-own={own ? "true" : "false"}>
          <p className="whitespace-pre-wrap text-[14px] leading-6 text-[var(--studio-ink)]">
            {message.body}
          </p>
          {message.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.attachments.map((attachment, index) => (
                <a
                  key={`${attachment.url}-${index}`}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[11.5px] font-semibold text-[var(--studio-ink)] hover:border-[rgba(151,244,243,0.45)]"
                >
                  <Paperclip className="h-3 w-3" />
                  {attachment.name || "Attachment"}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
