"use client";

/**
 * SA-2 — the agency build console (Register-D, staff/ops). Lists build jobs
 * with their real stage, cost-vs-budget, heartbeat age, and QA verdict, and
 * exposes the human gates: record client approval, approve deploy (one-tap +
 * password reauth), run the deploy. The deploy-approve call goes through
 * fetchWithSensitiveAction so a missing/stale reauth opens the password modal
 * and retries — no code path deploys without it.
 */

import { useState, useTransition } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import {
  recordClientApprovalAction,
  recordChangesRequestedAction,
  postPreviewToThreadAction,
} from "@/lib/agency/actions";

export type ConsoleJob = {
  id: string;
  projectTitle: string;
  stage: string;
  attempt: number;
  budgetKobo: number;
  costKobo: number;
  heartbeatAgeMs: number | null;
  qaOk: boolean | null;
  artifactHash: string | null;
  isInternal: boolean;
};

function naira(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

function stageTone(stage: string): string {
  if (stage === "live" || stage === "aftercare") return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
  if (stage === "stalled" || stage === "build_failed" || stage === "qa_failed" || stage === "cancelled")
    return "border-rose-400/35 bg-rose-400/10 text-rose-100";
  if (stage === "owner_review" || stage === "approved_for_deploy")
    return "border-[var(--studio-line-strong)] bg-black/20 text-[var(--studio-signal)]";
  return "border-[var(--studio-line-strong)] bg-black/15 text-[var(--studio-ink-soft)]";
}

export function AgencyConsole({ jobs }: { jobs: ConsoleJob[] }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function run(jobId: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(jobId);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      setNote(res.ok ? t("Done.") : `${t("Could not complete that.")} (${res.error ?? ""})`);
    });
  }

  async function approveDeploy(jobId: string) {
    setBusyId(jobId);
    try {
      // fetchWithSensitiveAction opens the reauth modal on the 401 challenge
      // and retries with the same idempotency key — the deploy gate.
      const res = await fetchWithSensitiveAction(`/api/agency/jobs/${jobId}/approve-deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `approve-${jobId}` },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setNote(res.ok && data.ok ? t("Deploy approved. You can run it now.") : `${t("Approval did not go through.")} (${data.error ?? res.status})`);
    } catch {
      setNote(t("Approval did not go through."));
    } finally {
      setBusyId(null);
    }
  }

  async function runDeploy(jobId: string) {
    setBusyId(jobId);
    try {
      const res = await fetch(`/api/agency/jobs/${jobId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; host?: string; error?: string };
      setNote(res.ok && data.ok ? `${t("Site is live at")} ${data.host}` : `${t("Deploy did not run.")} (${data.error ?? res.status})`);
    } catch {
      setNote(t("Deploy did not run."));
    } finally {
      setBusyId(null);
    }
  }

  if (jobs.length === 0) {
    return (
      <p className="studio-panel rounded-[1.6rem] p-6 text-sm leading-7 text-[var(--studio-ink-soft)]">
        {t("No build jobs yet. Create one from a paid project to begin.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {note ? (
        <p role="status" className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/15 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
          {note}
        </p>
      ) : null}
      {jobs.map((job) => {
        const busy = pending && busyId === job.id;
        const heartbeat =
          job.heartbeatAgeMs == null
            ? t("no heartbeat yet")
            : `${Math.round(job.heartbeatAgeMs / 1000)}s ${t("ago")}`;
        return (
          <article key={job.id} className="studio-panel rounded-[1.75rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stageTone(job.stage)}`}>
                    {t(job.stage.replaceAll("_", " "))}
                  </span>
                  {job.isInternal ? (
                    <span className="rounded-full border border-[var(--studio-line)] px-2 py-0.5 text-[11px] text-[var(--studio-ink-soft)]">
                      {t("internal")}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 truncate text-lg font-semibold text-[var(--studio-ink)]">{job.projectTitle}</h3>
                <p className="mt-1 font-mono text-xs text-[var(--studio-ink-soft)]">
                  {job.id.slice(0, 8)} · {t("attempt")} {job.attempt}
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="text-[var(--studio-ink)]">
                  {naira(job.costKobo)} <span className="text-[var(--studio-ink-soft)]">/ {naira(job.budgetKobo)}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--studio-ink-soft)]">
                  {t("heartbeat")} {heartbeat}
                </div>
                <div className="mt-1 text-xs text-[var(--studio-ink-soft)]">
                  {t("QA")}: {job.qaOk == null ? "—" : job.qaOk ? t("passed") : t("failed")}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {job.stage === "client_review" ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(job.id, () => postPreviewToThreadAction({ jobId: job.id, previewUrl: `preview:${job.id.slice(0, 8)}` }))}
                    className="studio-button-secondary rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {t("Post preview to client")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(job.id, () => recordClientApprovalAction({ jobId: job.id }))}
                    className="rounded-full border border-[var(--studio-line)] bg-black/15 px-4 py-2 text-xs font-semibold text-[var(--studio-ink)] disabled:opacity-60"
                  >
                    {t("Record client approval")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(job.id, () => recordChangesRequestedAction({ jobId: job.id }))}
                    className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink-soft)] disabled:opacity-60"
                  >
                    {t("Client requested changes")}
                  </button>
                </>
              ) : null}

              {job.stage === "owner_review" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approveDeploy(job.id)}
                  className="bg-[color:var(--home-accent)] text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)] inline-flex items-center rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-60"
                >
                  {t("Approve deploy")} · {t("password required")}
                </button>
              ) : null}

              {job.stage === "approved_for_deploy" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runDeploy(job.id)}
                  className="bg-[color:var(--home-accent)] text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)] inline-flex items-center rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-60"
                >
                  {t("Run deploy")}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
