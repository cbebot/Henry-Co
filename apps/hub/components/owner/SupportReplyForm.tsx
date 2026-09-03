"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { Send } from "lucide-react";

/**
 * SupportReplyForm — the owner writes straight into a support thread from the
 * Support Command console. Posts to /api/owner/support/reply (audit-first,
 * same support_messages spine the staff console uses) and refreshes the page
 * data on success so the new reply appears as the thread's latest message.
 */
export default function SupportReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const message = body.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/support/reply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body: message }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error || t("The reply could not be sent. Try again."));
        return;
      }
      setBody("");
      setSent(true);
      router.refresh();
      window.setTimeout(() => setSent(false), 4000);
    } catch {
      setError(t("The reply could not be sent. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("Write to them as Henry Onyx…")}
        rows={2}
        maxLength={4000}
        disabled={busy}
        className="w-full resize-y rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--acct-gold)] px-4 py-2 text-sm font-semibold text-[var(--hc-ink-on-accent,#1a1814)] disabled:opacity-50"
        >
          <ButtonPendingContent pending={busy} pendingLabel={t("Sending…")} spinnerLabel={t("Sending")}>
            <>
              <Send className="h-3.5 w-3.5" aria-hidden />
              {t("Send reply")}
            </>
          </ButtonPendingContent>
        </button>
        {sent ? (
          <span className="text-xs font-semibold text-[var(--acct-green-text)]" role="status">
            {t("Sent. They'll see it in their support inbox.")}
          </span>
        ) : null}
        {error ? (
          <span className="text-xs font-semibold text-[var(--acct-red-text)]" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
