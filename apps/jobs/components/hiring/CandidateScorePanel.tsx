"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobsCopy } from "@henryco/i18n";

type RubricMean = { mean: number; count: number };

type Props = {
  applicationId: string;
  rubricKeys: readonly string[];
  myScores: Record<string, number>;
  summary: {
    overallMean: number | null;
    scorerCount: number;
    rubricMeans: Record<string, RubricMean>;
    predictiveScore: number | null;
  } | null;
  copy: JobsCopy["employerHiringSuite"];
};

const SCALE = [1, 2, 3, 4, 5] as const;

export function CandidateScorePanel({ applicationId, rubricKeys, myScores, summary, copy }: Props) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>(myScores);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rubricLabel = (key: string): string => {
    switch (key) {
      case "technical": return copy.scoreRubricTechnical;
      case "communication": return copy.scoreRubricCommunication;
      case "culture": return copy.scoreRubricCulture;
      case "experience": return copy.scoreRubricExperience;
      default: return key;
    }
  };

  async function submit(rubricKey: string, score: number) {
    setScores((prev) => ({ ...prev, [rubricKey]: score }));
    setSavingKey(rubricKey);
    setSavedKey(null);
    setError(null);
    try {
      const res = await fetch("/api/employer/hiring/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, rubricKey, score }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message || copy.scoreError);
        return;
      }
      setSavedKey(rubricKey);
      startTransition(() => router.refresh());
    } catch {
      setError(copy.scoreError);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {summary && summary.scorerCount > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[var(--jobs-paper-soft)] p-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--jobs-muted)]">{copy.scoreOverall}</div>
            <div className="text-lg font-semibold">{summary.overallMean ?? "—"}</div>
          </div>
          <div className="text-[var(--jobs-muted)]">{copy.scoreScorersTemplate.replace("{count}", String(summary.scorerCount))}</div>
          {summary.predictiveScore != null && (
            <div className="ml-auto">
              <div className="text-xs uppercase tracking-wide text-[var(--jobs-muted)]">{copy.predictiveLabel}</div>
              <div className="text-lg font-semibold">{summary.predictiveScore}</div>
            </div>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {rubricKeys.map((key) => {
          const teamMean = summary?.rubricMeans?.[key];
          return (
            <li key={key} className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{rubricLabel(key)}</span>
                <span className="text-xs text-[var(--jobs-muted)]">
                  {copy.scoreTeamAverage}: {teamMean ? teamMean.mean : copy.scoreNotYet}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[var(--jobs-muted)]">{copy.scoreYourLabel}</span>
                <div className="flex gap-1.5" role="group" aria-label={rubricLabel(key)}>
                  {SCALE.map((n) => {
                    const active = scores[key] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={savingKey === key}
                        onClick={() => submit(key, n)}
                        aria-pressed={active}
                        className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                          active
                            ? "bg-[var(--jobs-accent)] text-white"
                            : "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)]"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {savingKey === key && <span className="text-xs text-[var(--jobs-muted)]">{copy.scoreSaving}</span>}
                {savedKey === key && savingKey !== key && (
                  <span className="text-xs text-[var(--jobs-success)]">{copy.scoreSaved}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="status" className="text-sm text-[var(--jobs-warning)]">
          {error}
        </p>
      )}
    </div>
  );
}
