"use client";

/**
 * SA-3 — the CLIENT-facing build preview review (Register-L, i18n Pattern A).
 * The client opens their generated site preview, then approves it or requests
 * changes — the purpose-built portal review UX that replaces SA-2's
 * staff-mediated flow. Approval moves the job to owner review (the owner's
 * reauth-gated deploy tap follows); a change request re-queues a build within
 * the included rounds. Nothing here can deploy — the client has no such tap.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, MessageSquarePlus } from "lucide-react";

import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

export function AgencyPreviewReview({
  jobId,
  previewUrl,
  roundsUsed,
  maxRounds,
  locale,
}: {
  jobId: string;
  previewUrl: string | null;
  roundsUsed: number;
  maxRounds: number;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "request">(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, maxRounds - roundsUsed);

  async function send(action: "approve" | "request_changes") {
    setBusy(action === "approve" ? "approve" : "request");
    setError(null);
    try {
      const res = await fetch(`/api/agency/jobs/${jobId}/client-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: action === "request_changes" ? notes.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(
          data.error === "revision_rounds_exhausted"
            ? t("You've used your included revision rounds. We've asked the team to help with anything further.")
            : t("We couldn't record that just now. Please try again."),
        );
        return;
      }
      setShowNotes(false);
      setNotes("");
      router.refresh();
    } catch {
      setError(t("We couldn't record that just now. Please try again."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="portal-card-elev p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
            {t("Preview ready")}
          </div>
          <h3 className="mt-1.5 text-[16px] font-semibold text-[var(--studio-ink)]">
            {t("Your site preview is ready to review")}
          </h3>
          <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-[var(--studio-ink-soft)]">
            {t("Open the preview, then approve it to go to final review, or request changes. Nothing goes live until your team does one last check after you approve.")}
          </p>
        </div>
      </div>

      {previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="portal-button portal-button-secondary mt-4 inline-flex"
          style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("Open preview")}
        </a>
      ) : (
        <p className="mt-4 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 text-[12px] text-[var(--studio-ink-soft)]">
          {t("Your preview link will appear here shortly.")}
        </p>
      )}

      <p className="mt-4 text-[12px] text-[var(--studio-ink-soft)]">
        {remaining} {t("of")} {maxRounds} {t("revision rounds remaining")}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="portal-button portal-button-primary"
          style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
          onClick={() => send("approve")}
          disabled={busy !== null}
        >
          {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {t("Approve preview")}
        </button>
        <button
          type="button"
          className="portal-button portal-button-secondary"
          style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
          onClick={() => setShowNotes((v) => !v)}
          disabled={busy !== null || remaining <= 0}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("Request changes")}
        </button>
      </div>

      {showNotes ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder={t("Describe what you'd like changed…")}
            className="w-full rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 text-[13px] text-[var(--studio-ink)] outline-none focus:border-[var(--studio-accent-ring)]"
          />
          <button
            type="button"
            className="portal-button portal-button-primary"
            style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
            onClick={() => send("request_changes")}
            disabled={busy !== null || notes.trim().length === 0}
          >
            {busy === "request" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
            {t("Send change request")}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[12px] text-[var(--studio-red-ink)]">{error}</p> : null}
    </section>
  );
}
