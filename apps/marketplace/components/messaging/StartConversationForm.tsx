"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ContactSafetyHint } from "./ContactSafetyHint";

/**
 * The Onyx Line (WS-4) — start a buyer<->seller conversation.
 *
 * Posts `mkt_conversation_start` to `/api/marketplace` in JSON mode and, on
 * success, routes the buyer to the live thread. The contact-safety hint runs
 * the same verdict the server enforces BEFORE persist, so a buyer learns
 * up-front that phone numbers, emails, and off-platform links can't be sent.
 *
 * The draft is preserved on every failure path (block or generic) so the buyer
 * never loses what they typed. AA: warm ink-on-paper marketplace tokens.
 */
export function StartConversationForm({
  anchorType,
  anchorId,
  vendorId,
  subjectDefault,
}: {
  anchorType: "order" | "listing";
  anchorId: string;
  vendorId?: string;
  subjectDefault?: string;
}) {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const router = useRouter();

  const [subject, setSubject] = useState(subjectDefault ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<null | "blocked" | "generic">(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !body.trim()) return;
    setSending(true);
    setError(null);

    const payload = new FormData();
    payload.set("intent", "mkt_conversation_start");
    payload.set("anchor_type", anchorType);
    payload.set("anchor_id", anchorId);
    if (vendorId) payload.set("vendor_id", vendorId);
    if (subject.trim()) payload.set("subject", subject.trim());
    payload.set("body", body);
    payload.set("response_mode", "json");

    let response: Response;
    try {
      response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { accept: "application/json" },
        body: payload,
      });
    } catch {
      // Network failure — keep the draft, surface a soft retryable error.
      setError("generic");
      setSending(false);
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      conversationId?: string;
      reason?: string;
    };

    if (response.ok && data.ok && data.conversationId) {
      // Leave `sending` true while navigating so the button can't double-fire.
      router.push(`/account/messages/${data.conversationId}`);
      return;
    }

    setError(data.reason === "contact_blocked" ? "blocked" : "generic");
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <label className="block space-y-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          {t("Subject (optional)")}
        </span>
        <input
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={140}
          placeholder={t("One short line about what you need")}
          className="market-input rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          {t("Your message")}
        </span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          rows={6}
          placeholder={t(
            "Ask about the item, delivery, or your order. Keep it on Henry Onyx — contact details can't be shared.",
          )}
          className="market-textarea rounded-[1.5rem] px-4 py-3"
        />
      </label>

      <ContactSafetyHint text={body} />

      {error ? (
        <div
          role="alert"
          className="rounded-[1.2rem] border border-[rgba(248,113,113,0.32)] bg-[rgba(248,113,113,0.08)] px-4 py-3"
        >
          <p className="text-[13px] font-semibold text-[var(--market-ink)]">
            {error === "blocked"
              ? t("Contact details can't be sent")
              : t("That didn't go through")}
          </p>
          <p className="mt-1 text-[12.5px] leading-6 text-[var(--market-muted)]">
            {error === "blocked"
              ? t(
                  "This message looks like it contains a phone number, email, or off-platform link. Remove it and try again — your draft is kept.",
                )
              : t("Something went wrong. Your draft is kept — please try again.")}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--market-line)] pt-5">
        <button
          type="submit"
          disabled={sending || !body.trim()}
          aria-busy={sending}
          className="
            market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3
            text-sm font-semibold transition outline-none
            focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55
            focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]
            disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-[0.5px]
          "
        >
          {sending ? t("Sending…") : t("Send message")}
          {sending ? null : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
