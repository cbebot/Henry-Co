"use client";

import { useState, useTransition } from "react";
import { Send, AlertTriangle } from "lucide-react";

const CONTACT_PATTERNS = [
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: "email address" },
  { regex: /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, label: "phone number" },
  { regex: /@[a-zA-Z0-9_]{2,30}/g, label: "social handle" },
  { regex: /(?:whatsapp|telegram|signal|viber)\s*[:\-]?\s*[\w.+@]/i, label: "messaging app" },
  { regex: /(?:instagram|facebook|twitter|linkedin)\.com\/[\w.-]+/i, label: "social link" },
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
  const [body, setBody] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    setBody(value);
    const detected = checkOffPlatform(value);
    if (detected.length > 0) {
      setWarning(
        `Detected ${detected.join(", ")}. To keep the hiring process secure and auditable, please share contact details through the platform once both parties are ready.`
      );
    } else {
      setWarning(null);
    }
  }

  function handleSend() {
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/hiring/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, senderId, senderType, body: body.trim() }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to send message.");
          return;
        }
        setBody("");
        setWarning(null);
        window.location.reload();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {warning && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[var(--jobs-border)] bg-[var(--jobs-bg)] px-4 py-3 text-sm outline-none transition focus:border-[var(--jobs-accent)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !body.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--jobs-accent)] text-white transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
