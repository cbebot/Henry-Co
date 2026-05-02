"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ChatComposer } from "@henryco/chat-composer";
import type { ComposerSendPayload } from "@henryco/chat-composer";

const CONTACT_PATTERNS = [
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "email address" },
  {
    regex: /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    label: "phone number",
  },
  { regex: /@[a-zA-Z0-9_]{2,30}/g, label: "social handle" },
  {
    regex: /(?:whatsapp|telegram|signal|viber)\s*[:\-]?\s*[\w.+@]/i,
    label: "messaging app",
  },
  {
    regex: /(?:instagram|facebook|twitter|linkedin)\.com\/[\w.-]+/i,
    label: "social link",
  },
];

function checkOffPlatform(text: string) {
  const found: string[] = [];
  for (const { regex, label } of CONTACT_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text) && !found.includes(label)) found.push(label);
  }
  return found;
}

export function MessageComposer({
  conversationId,
  senderId,
  senderType,
}: {
  conversationId: string;
  senderId: string;
  senderType: string;
}) {
  const router = useRouter();
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTyping = useCallback(() => {
    /* hook for future typing indicator broadcast */
  }, []);

  const handleSend = useCallback(
    async ({ text }: ComposerSendPayload) => {
      setError(null);
      const detected = checkOffPlatform(text);
      if (detected.length > 0) {
        setWarning(
          `Detected ${detected.join(
            ", "
          )}. To keep the hiring process secure and auditable, please share contact details through the platform once both parties are ready.`
        );
        throw new Error("Off-platform contact detected. Adjust and retry.");
      }
      setWarning(null);

      const res = await fetch("/api/hiring/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderId,
          senderType,
          body: text,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Failed to send message.");
      }
      router.refresh();
    },
    [conversationId, senderId, senderType, router]
  );

  const labels = useMemo(
    () => ({
      sendLabel: "Send",
      sendingLabel: "Sending…",
      attachLabel: "Attach",
      draftSavedLabel: "Draft saved",
      discardDraftLabel: "Discard",
      expandLabel: "Open full-screen composer",
      collapseLabel: "Collapse composer",
      fullScreenTitleLabel: "New message",
      removeAttachmentLabel: "Remove attachment",
      retryUploadLabel: "Retry upload",
    }),
    []
  );

  return (
    <div className="space-y-2">
      {warning && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{warning}</span>
        </div>
      )}

      <ChatComposer
        threadId={conversationId}
        tone="jobs"
        ariaLabel="Hiring conversation composer"
        placeholder="Type your message…"
        enableAttachments={false}
        labels={labels}
        onSend={handleSend}
        onTyping={handleTyping}
        onSendError={(err) => setError(err.message)}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
