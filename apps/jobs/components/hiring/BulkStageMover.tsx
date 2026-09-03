"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobsCopy } from "@henryco/i18n";

type Applicant = { applicationId: string; candidateName: string; currentStage: string };

type Props = {
  applicants: Applicant[];
  stages: string[];
  copy: JobsCopy["employerHiringSuite"];
};

/**
 * V3-70 S2 — bulk stage move. Additive to the drag-to-move kanban: select N
 * applicants, pick a target stage, move them in one all-or-nothing request.
 */
export function BulkStageMover({ applicants, stages, copy }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetStage, setTargetStage] = useState<string>("");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedCount = selected.size;
  const allSelected = useMemo(
    () => applicants.length > 0 && selected.size === applicants.length,
    [applicants.length, selected.size],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === applicants.length ? new Set() : new Set(applicants.map((a) => a.applicationId))));
  }

  async function move() {
    if (selectedCount === 0 || !targetStage) return;
    setFeedback(null);
    const applicationIds = Array.from(selected);
    try {
      const res = await fetch("/api/employer/hiring/stage-move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationIds, toStage: targetStage }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; moved?: number; message?: string };
      if (!res.ok || !data.ok) {
        setFeedback({ tone: "error", text: data.message || copy.bulkMoveError });
        return;
      }
      setFeedback({ tone: "ok", text: copy.bulkMovedTemplate.replace("{count}", String(data.moved ?? applicationIds.length)) });
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch {
      setFeedback({ tone: "error", text: copy.bulkMoveError });
    }
  }

  if (applicants.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--jobs-paper-soft)] p-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label={copy.bulkSelectLabel}
            className="h-4 w-4 accent-[var(--jobs-accent)]"
          />
          {copy.bulkSelectedTemplate.replace("{count}", String(selectedCount))}
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="bulk-stage">
            {copy.bulkMoveLabel}
          </label>
          <select
            id="bulk-stage"
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            className="rounded-xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] px-3 py-1.5 text-sm"
          >
            <option value="">{copy.bulkMovePlaceholder}</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={move}
            disabled={selectedCount === 0 || !targetStage || pending}
            className="rounded-xl bg-[var(--jobs-accent)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {copy.bulkMoveButton}
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm font-semibold text-[var(--jobs-muted)]"
            >
              {copy.bulkClearLabel}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <p
          role="status"
          className={`text-sm ${feedback.tone === "ok" ? "text-[var(--jobs-success)]" : "text-[var(--jobs-warning)]"}`}
        >
          {feedback.text}
        </p>
      )}

      <ul className="space-y-2">
        {applicants.map((a) => (
          <li key={a.applicationId}>
            <label className="flex items-center gap-3 rounded-xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(a.applicationId)}
                onChange={() => toggle(a.applicationId)}
                className="h-4 w-4 accent-[var(--jobs-accent)]"
              />
              <span className="font-semibold">{a.candidateName}</span>
              <span className="ml-auto rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold">
                {a.currentStage}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
