"use client";

import { useState, useTransition } from "react";
import {
  getJobsCopy,
  useHenryCoLocale,
  type JobsCopy,
} from "@henryco/i18n";

/**
 * V3 PASS 21 — PipelineKanban (Distinctive Rule #3 + J4).
 *
 * Per-pipeline kanban for /employer/hiring/[pipelineId]. Columns are
 * the pipeline.stages (configurable per pipeline; default list comes
 * from apps/jobs/lib/jobs/content.ts).
 *
 * Drag-to-move: optimistic UI commit on the client; if the wire call
 * to POST /api/jobs/pipeline/move returns non-200, we roll back to
 * fromStage. Native HTML5 drag-and-drop (no new dep) — keyboard parity
 * follows in a follow-up pass once dnd-kit lands.
 *
 * Mobile (<md): columns collapse to stacked accordions; drag is
 * replaced by a "Move to..." menu per applicant card.
 */

export type PipelineApplicantCard = {
  applicationId: string;
  candidateName: string;
  candidateAvatarUrl?: string | null;
  stage: string;
  jobTitle: string;
  status: "active" | "withdrawn" | "rejected" | "hired";
  createdAt: string;
};

type PipelineKanbanProps = {
  pipelineId: string;
  stages: string[];
  applicants: PipelineApplicantCard[];
};

type StageBucket = Record<string, PipelineApplicantCard[]>;

function bucketByStage(
  applicants: PipelineApplicantCard[],
  stages: string[],
): StageBucket {
  const out: StageBucket = {};
  for (const stage of stages) out[stage] = [];
  for (const card of applicants) {
    const key = stages.includes(card.stage) ? card.stage : stages[0] || "applied";
    if (!out[key]) out[key] = [];
    out[key].push(card);
  }
  return out;
}

export function PipelineKanban({
  pipelineId: _pipelineId,
  stages,
  applicants,
}: PipelineKanbanProps) {
  const locale = useHenryCoLocale();
  const copy: JobsCopy = getJobsCopy(locale);
  const labels = copy.hiring;
  const [buckets, setBuckets] = useState<StageBucket>(() =>
    bucketByStage(applicants, stages),
  );
  const [moving, setMoving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function moveCard(
    applicationId: string,
    fromStage: string,
    toStage: string,
  ) {
    if (fromStage === toStage) return;

    // Optimistic commit.
    setBuckets((prev) => {
      const next: StageBucket = {};
      for (const key of Object.keys(prev)) next[key] = [...prev[key]];
      const fromList = next[fromStage] || [];
      const card = fromList.find((c) => c.applicationId === applicationId);
      if (!card) return prev;
      next[fromStage] = fromList.filter(
        (c) => c.applicationId !== applicationId,
      );
      next[toStage] = [{ ...card, stage: toStage }, ...(next[toStage] || [])];
      return next;
    });
    setMoving((prev) => ({ ...prev, [applicationId]: true }));
    setError(null);

    try {
      const response = await fetch("/api/jobs/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, stage: toStage, fromStage }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message || "Move failed");
      }
    } catch (err) {
      console.error("[PipelineKanban] move failed:", err);
      setError(err instanceof Error ? err.message : "Move failed");
      // Rollback.
      setBuckets((prev) => {
        const next: StageBucket = {};
        for (const key of Object.keys(prev)) next[key] = [...prev[key]];
        const toList = next[toStage] || [];
        const card = toList.find((c) => c.applicationId === applicationId);
        if (!card) return prev;
        next[toStage] = toList.filter(
          (c) => c.applicationId !== applicationId,
        );
        next[fromStage] = [
          { ...card, stage: fromStage },
          ...(next[fromStage] || []),
        ];
        return next;
      });
    } finally {
      setMoving((prev) => {
        const next = { ...prev };
        delete next[applicationId];
        return next;
      });
    }
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, card: PipelineApplicantCard) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/x-henryco-applicant",
      JSON.stringify({ applicationId: card.applicationId, fromStage: card.stage }),
    );
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, toStage: string) {
    event.preventDefault();
    const raw = event.dataTransfer.getData(
      "application/x-henryco-applicant",
    );
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        applicationId?: string;
        fromStage?: string;
      };
      if (!parsed.applicationId || !parsed.fromStage) return;
      startTransition(() => {
        void moveCard(parsed.applicationId!, parsed.fromStage!, toStage);
      });
    } catch (err) {
      console.error("[PipelineKanban] drop parse failed:", err);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 overflow-x-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stages.map((stage) => {
          const cards = buckets[stage] || [];
          return (
            <section
              key={stage}
              className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-3"
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, stage)}
            >
              <header className="flex items-center justify-between border-b border-[var(--jobs-line)] pb-2">
                <div className="jobs-kicker">{stage}</div>
                <span className="text-xs font-semibold text-[var(--jobs-muted)]">
                  {cards.length}
                </span>
              </header>
              <ol className="mt-3 space-y-2" aria-label={`${stage} applicants`}>
                {cards.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-[var(--jobs-line)] p-3 text-center text-xs text-[var(--jobs-muted)]">
                    —
                  </li>
                ) : (
                  cards.map((card) => (
                    <li key={card.applicationId}>
                      <div
                        draggable
                        onDragStart={(event) => handleDragStart(event, card)}
                        className={`cursor-grab rounded-xl border border-[var(--jobs-line)] bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                          moving[card.applicationId] ? "opacity-50" : ""
                        }`}
                        aria-busy={moving[card.applicationId] ? "true" : undefined}
                      >
                        <div className="text-sm font-semibold leading-tight">
                          {card.candidateName}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--jobs-muted)]">
                          {card.jobTitle}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--jobs-muted)]">
                          {card.status}
                        </div>
                      </div>
                      <label className="mt-1 block md:hidden">
                        <span className="sr-only">
                          {labels.reviewApplications}
                        </span>
                        <select
                          value={card.stage}
                          onChange={(event) =>
                            startTransition(() => {
                              void moveCard(
                                card.applicationId,
                                card.stage,
                                event.target.value,
                              );
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1 text-xs"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))
                )}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
