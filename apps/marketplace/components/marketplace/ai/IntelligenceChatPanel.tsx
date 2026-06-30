"use client";

import { useState } from "react";
import { formatSurfaceTemplate } from "@henryco/i18n";
import type { ChatMessage } from "@henryco/ai-gateway";
import { intelligenceChatAction } from "@/lib/ai/intelligence-chat-action";

export interface ChatPanelCopy {
  heading: string;
  intro: string;
  placeholder: string;
  send: string;
  sending: string;
  advisory: string;
  errorFallback: string;
  priceTemplate: string;
}

function naira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function titleCase(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * V3-28 — the governed Henry Onyx Intelligence chat (Register-L), METERED per reply. The
 * topic guard (declines competing-brand / anti-company) is enforced server-side in the
 * gateway's system prompt. The client only ever sees the reply text + a redacted receipt
 * (kobo total + VAT + a capability tier label) — never a provider, model, cost, or margin.
 */
export function IntelligenceChatPanel({ copy }: { copy: ChatPanelCopy }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  async function onSend() {
    const content = draft.trim();
    if (!content || pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setPending(true);
    setError(null);
    try {
      const res = await intelligenceChatAction({ messages: next, idempotencyKey: crypto.randomUUID() });
      if (!res.ok) {
        setError(res.message || copy.errorFallback);
        return;
      }
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.receipt.billed) {
        setLastReceipt(
          formatSurfaceTemplate(copy.priceTemplate, {
            price: naira(res.receipt.totalKobo),
            vat: naira(res.receipt.vatKobo),
            tier: titleCase(res.receipt.tier),
          }),
        );
      }
    } catch {
      setError(copy.errorFallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="market-panel rounded-[1.75rem] p-5">
      <p className="market-kicker">{copy.heading}</p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--market-paper-white)]">{copy.intro}</p>

      <div className="mt-4 grid gap-3">
        {messages.length > 0 ? (
          <div className="grid gap-2 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4">
            {messages.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "user"
                    ? "whitespace-pre-line text-sm text-[var(--market-paper-white)]"
                    : "whitespace-pre-line text-sm text-[var(--market-muted)]"
                }
              >
                <span className="font-semibold">{m.role === "user" ? "You" : "Henry Onyx Intelligence"}: </span>
                {m.content}
              </p>
            ))}
          </div>
        ) : null}

        <textarea
          className="market-textarea rounded-[1.5rem] px-4 py-3"
          rows={2}
          placeholder={copy.placeholder}
          aria-label={copy.placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSend}
            disabled={pending || draft.trim().length === 0}
            className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? copy.sending : copy.send}
          </button>
          {lastReceipt ? <span className="text-xs text-[var(--market-muted)]">{lastReceipt}</span> : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--market-muted)]">{error}</p> : null}
      <p className="mt-3 text-xs text-[var(--market-muted)]">{copy.advisory}</p>
    </section>
  );
}
