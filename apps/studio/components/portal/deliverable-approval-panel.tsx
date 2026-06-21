"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquarePlus, ShieldCheck } from "lucide-react";

import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

import { StatusBadge } from "@/components/portal/status-badge";
import { revisionStatusToken } from "@/lib/portal/status";
import { shortDate } from "@/lib/portal/helpers";

/** Mirror of DeliverableRevisionState (the server-only module is type-erased here). */
export type ApprovalPanelRound = {
  id: string;
  revisionNumber: number;
  status: "submitted" | "changes_requested" | "approved";
  changeNotes: string | null;
  billable: boolean;
  hasSignature: boolean;
  createdAt: string | null;
};

export type ApprovalPanelState = {
  allowance: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  billable: boolean;
  latestStatus: ApprovalPanelRound["status"] | null;
  rounds: ApprovalPanelRound[];
};

export function DeliverableApprovalPanel({
  deliverableId,
  deliverableTitle,
  state,
  locale,
}: {
  deliverableId: string;
  deliverableTitle: string;
  state: ApprovalPanelState;
  locale: AppLocale;
}) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "request">(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isApproved = state.latestStatus === "approved";

  async function send(action: "approve" | "request_changes") {
    setBusy(action === "approve" ? "approve" : "request");
    setError(null);
    try {
      const res = await fetch("/api/studio/revisions/deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          action,
          change_notes: action === "request_changes" ? notes.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(t("We couldn't record that just now. Please try again."));
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
    <section className="portal-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold text-[var(--studio-ink)]">{deliverableTitle}</h3>
          {/* Round-trip counter: X used / Y remaining */}
          <p className="mt-1 text-[12px] text-[var(--studio-ink-soft)]">
            {state.used} {t("of")} {state.allowance} {t("revisions used")} ·{" "}
            <span
              className={
                state.remaining > 0
                  ? "font-semibold text-[var(--studio-ink)]"
                  : "font-semibold text-[var(--studio-amber-ink)]"
              }
            >
              {state.remaining} {t("remaining")}
            </span>
          </p>
        </div>
        {state.latestStatus ? (
          (() => {
            const token = revisionStatusToken(state.latestStatus, locale);
            return <StatusBadge tone={token.tone} label={token.label} size="sm" />;
          })()
        ) : null}
      </div>

      {state.exhausted ? (
        <div className="mt-3 rounded-xl border border-[var(--studio-amber-line)] bg-[var(--studio-amber-soft)] px-3 py-2 text-[12px] text-[var(--studio-amber-ink)]">
          {t("Your included revisions are used up — further change requests may be billable.")}
        </div>
      ) : null}

      {state.rounds.length > 0 ? (
        <ol className="mt-4 space-y-2">
          {state.rounds.map((round) => {
            const token = revisionStatusToken(round.status, locale);
            return (
              <li
                key={round.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-fill-faint)] px-3 py-2 text-[12px]"
              >
                <span className="font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {t("Round")} {round.revisionNumber}
                </span>
                <StatusBadge tone={token.tone} label={token.label} size="sm" />
                {round.hasSignature ? (
                  <span
                    className="inline-flex items-center gap-1 text-[var(--studio-green-ink)]"
                    title={t("This approval is cryptographically signed.")}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("Signed")}
                  </span>
                ) : null}
                {round.billable ? (
                  <span className="text-[var(--studio-amber-ink)]">· {t("Billable")}</span>
                ) : null}
                {round.changeNotes ? (
                  <span className="w-full text-[var(--studio-ink-soft)]">{round.changeNotes}</span>
                ) : null}
                {round.createdAt ? (
                  <span className="text-[var(--studio-ink-soft)]">· {shortDate(round.createdAt)}</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {isApproved ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--studio-green-ink)]">
          <CheckCircle2 className="h-4 w-4" />
          {t("You approved this deliverable. The approval is signed and recorded.")}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="portal-button portal-button-primary"
            style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
            onClick={() => send("approve")}
            disabled={busy !== null}
          >
            {busy === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {t("Approve")}
          </button>
          <button
            type="button"
            className="portal-button portal-button-secondary"
            style={{ padding: "0.55rem 0.95rem", minHeight: 36 }}
            onClick={() => setShowNotes((v) => !v)}
            disabled={busy !== null}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            {t("Request changes")}
          </button>
        </div>
      )}

      {showNotes && !isApproved ? (
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
            {busy === "request" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-3.5 w-3.5" />
            )}
            {t("Send change request")}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[12px] text-[var(--studio-red-ink)]">{error}</p> : null}
    </section>
  );
}
