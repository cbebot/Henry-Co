"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobsCopy } from "@henryco/i18n";

type Props = {
  applicationId: string;
  candidateName: string;
  copy: JobsCopy["employerHiringSuite"];
};

type DecisionType = "offer" | "rejection" | "hire";

export function DecisionActions({ applicationId, candidateName, copy }: Props) {
  const router = useRouter();
  const [tone, setTone] = useState("standard");
  const [busy, setBusy] = useState<DecisionType | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  async function decide(type: DecisionType) {
    if (type === "rejection" && !window.confirm(copy.decisionConfirmRejectTemplate.replace("{name}", candidateName))) {
      return;
    }
    setBusy(type);
    setFeedback(null);
    try {
      const res = await fetch("/api/employer/hiring/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, type, tone }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setFeedback({ tone: "error", text: data.message || copy.decisionError });
        return;
      }
      setFeedback({ tone: "ok", text: copy.decisionSent });
      startTransition(() => router.refresh());
    } catch {
      setFeedback({ tone: "error", text: copy.decisionError });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-[var(--jobs-muted)]" htmlFor="decision-tone">
          {copy.decisionToneLabel}
        </label>
        <select
          id="decision-tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="rounded-xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] px-3 py-1.5 text-sm"
        >
          <option value="warm">{copy.decisionToneWarm}</option>
          <option value="standard">{copy.decisionToneStandard}</option>
          <option value="brief">{copy.decisionToneBrief}</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("offer")}
          disabled={busy !== null}
          className="rounded-xl bg-[var(--jobs-accent)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "offer" ? copy.decisionSending : copy.decisionOffer}
        </button>
        <button
          type="button"
          onClick={() => decide("hire")}
          disabled={busy !== null}
          className="rounded-xl bg-[var(--jobs-success)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy === "hire" ? copy.decisionSending : copy.decisionHire}
        </button>
        <button
          type="button"
          onClick={() => decide("rejection")}
          disabled={busy !== null}
          className="rounded-xl border border-[var(--jobs-line)] px-4 py-1.5 text-sm font-semibold text-[var(--jobs-ink)] disabled:opacity-50"
        >
          {busy === "rejection" ? copy.decisionSending : copy.decisionReject}
        </button>
        <a
          href={`/api/employer/hiring/document?applicationId=${encodeURIComponent(applicationId)}&type=rejection`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--jobs-accent)] underline"
        >
          {copy.rejectionDocTitle}
        </a>
      </div>

      {feedback && (
        <p
          role="status"
          className={`text-sm ${feedback.tone === "ok" ? "text-[var(--jobs-success)]" : "text-[var(--jobs-warning)]"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
