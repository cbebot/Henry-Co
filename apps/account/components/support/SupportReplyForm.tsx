"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { Paperclip, Send, X } from "lucide-react";

export default function SupportReplyForm({ threadId }: { threadId: string }) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const draftKey = useMemo(() => `henryco-support-draft:${threadId}`, [threadId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(draftKey);
    if (stored) {
      setMessage(stored);
    }
  }, [draftKey]);

  useEffect(() => {
    if (message.trim()) {
      window.localStorage.setItem(draftKey, message);
    } else {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.set("thread_id", threadId);
      formData.set("body", message);
      for (const attachment of attachments) {
        formData.append("attachments", attachment);
      }

      const response = await fetch("/api/support/reply", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to send your reply.");
      }

      setMessage("");
      setAttachments([]);
      window.localStorage.removeItem(draftKey);
      setFeedback({ type: "success", text: "Reply sent." });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to send your reply.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {feedback ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="rounded-[1.6rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] px-3 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[76px] w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-7 text-[var(--acct-ink)] outline-none"
          placeholder="Reply with context, screenshots, or next steps. Drafts stay here while you type."
          required
        />

        {attachments.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2 px-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--acct-surface)] px-3 py-1.5 text-xs font-medium text-[var(--acct-ink)]"
              >
                <span className="max-w-[12rem] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded-full p-0.5 text-[var(--acct-muted)] transition hover:bg-[var(--acct-bg)] hover:text-[var(--acct-ink)]"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--acct-line)] px-2 pt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setAttachments((current) => [...current, ...nextFiles].slice(0, 4));
                event.currentTarget.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="acct-button-ghost rounded-xl"
            >
              <Paperclip size={15} />
              Attach
            </button>
            <p className="text-xs text-[var(--acct-muted)]">
              Mobile-safe composer with draft memory and attachments.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="acct-button-primary rounded-xl px-4"
          >
            <ButtonPendingContent pending={loading} pendingLabel="Sending reply..." spinnerLabel="Sending reply">
              <>
                <Send size={16} />
                Send reply
              </>
            </ButtonPendingContent>
          </button>
        </div>
      </div>
    </form>
  );
}
