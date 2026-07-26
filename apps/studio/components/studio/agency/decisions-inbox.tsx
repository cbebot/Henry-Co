"use client";

/**
 * SA-3 — the Owner-AI decisions inbox (Register-D). The orchestrator queues
 * durable, server-initiated one-tap decisions here; the owner returns to a
 * triaged, count-badged queue instead of a chat scrollback. A `deploy_approval`
 * one-tap routes to the SAME reauth-gated approve-deploy route
 * (fetchWithSensitiveAction opens the password modal on the 401 challenge) —
 * the inbox never carries authority, it only surfaces the decision.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { resolveAgencyDecisionAction } from "@/lib/agency/actions";

export type InboxDecision = {
  id: string;
  jobId: string;
  kind: string;
  title: string;
  body: string;
  projectTitle: string;
};

export function DecisionsInbox({ decisions }: { decisions: InboxDecision[] }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (decisions.length === 0) return null;

  function resolve(decisionId: string, status: "acted" | "dismissed") {
    setBusyId(decisionId);
    startTransition(async () => {
      const res = await resolveAgencyDecisionAction({ decisionId, status });
      setBusyId(null);
      setNote(res.ok ? t("Done.") : `${t("Could not update that.")} (${res.error ?? ""})`);
      if (res.ok) router.refresh();
    });
  }

  async function approveDeploy(decision: InboxDecision) {
    setBusyId(decision.id);
    try {
      // Same reauth-gated route as the console — the password modal opens on the
      // 401 challenge and retries with the same idempotency key.
      const res = await fetchWithSensitiveAction(`/api/agency/jobs/${decision.jobId}/approve-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `approve-${decision.jobId}` },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        await resolveAgencyDecisionAction({ decisionId: decision.id, status: "acted" });
        setNote(t("Deploy approved — the orchestrator will release the reviewed build."));
        router.refresh();
      } else {
        setNote(`${t("Approval did not go through.")} (${data.error ?? res.status})`);
      }
    } catch {
      setNote(t("Approval did not go through."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="studio-panel rounded-[1.75rem] p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
          {t("Decisions waiting")}
        </h2>
        <span className="inline-flex items-center rounded-full border border-[var(--studio-line-strong)] bg-black/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--studio-signal)]">
          {decisions.length}
        </span>
      </div>

      {note ? (
        <p role="status" className="mt-3 rounded-[1.2rem] border border-[var(--studio-line)] bg-black/15 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
          {note}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {decisions.map((decision) => {
          const busy = pending && busyId === decision.id;
          return (
            <li key={decision.id} className="rounded-[1.25rem] border border-[var(--studio-line)] bg-black/15 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[var(--studio-ink)]">{t(decision.title)}</h3>
                  <p className="mt-1 text-[13px] leading-6 text-[var(--studio-ink-soft)]">{t(decision.body)}</p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--studio-ink-soft)]">
                    {decision.projectTitle} · {decision.jobId.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {decision.kind === "deploy_approval" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void approveDeploy(decision)}
                    className="bg-[color:var(--home-accent)] text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)] inline-flex items-center rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {t("Approve deploy")} · {t("password required")}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => resolve(decision.id, "dismissed")}
                  className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink-soft)] disabled:opacity-60"
                >
                  {t("Dismiss")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
