"use client";

import { useState } from "react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { LearnVerifiedBadge } from "@/components/hiring/LearnVerifiedBadge";

/**
 * V3-56 S5 — verified-candidate pool selection + bulk invite.
 *
 * The employer selects candidates and one of their own postings, optionally adds
 * a note, and invites the selection. The route (/api/jobs/candidate-invites) is
 * sensitive (V3-02) and idempotent per (job, candidate) and re-checks consent,
 * so re-sends are safe. All copy arrives already-translated.
 */

export type BulkInviteCandidate = {
  userId: string;
  courseLabels: string[];
};

export type BulkInviteJob = {
  slug: string;
  title: string;
};

export type BulkInviteCopy = {
  badgeLabel: string;
  badgeAria: string;
  bulkCta: string;
  /** Contains {count}. */
  sentNotice: string;
  none: string;
  messageLabel: string;
  messagePlaceholder: string;
  candidateLabel: string;
  selectJobLabel: string;
};

export function BulkInviteClient({
  candidates,
  jobs,
  employerSlug,
  defaultJobSlug,
  copy,
}: {
  candidates: BulkInviteCandidate[];
  jobs: BulkInviteJob[];
  employerSlug: string;
  defaultJobSlug: string;
  copy: BulkInviteCopy;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [jobSlug, setJobSlug] = useState<string>(defaultJobSlug || jobs[0]?.slug || "");
  const [message, setMessage] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  function toggle(userId: string) {
    setSelected((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  async function invite() {
    if (selectedIds.length === 0 || !jobSlug) {
      setError(copy.none);
      return;
    }
    const job = jobs.find((item) => item.slug === jobSlug);
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetchWithSensitiveAction("/api/jobs/candidate-invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `invite-${jobSlug}-${selectedIds.slice().sort().join("_")}`,
        },
        body: JSON.stringify({
          jobSlug,
          jobTitle: job?.title,
          employerSlug,
          candidateUserIds: selectedIds,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        invited?: number;
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? null);
        return;
      }
      setNotice(copy.sentNotice.replace("{count}", String(data.invited ?? selectedIds.length)));
      setSelected({});
      setMessage("");
    } catch {
      setError(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {candidates.map((candidate, index) => {
          const checked = Boolean(selected[candidate.userId]);
          return (
            <li
              key={candidate.userId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--jobs-paper-soft)] p-4"
            >
              <label className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(candidate.userId)}
                  className="h-4 w-4 shrink-0 rounded border-[var(--jobs-line)] text-[var(--jobs-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--jobs-ink)]">
                    {`${copy.candidateLabel} ${index + 1}`}
                  </span>
                  {candidate.courseLabels.length > 0 ? (
                    <span className="mt-0.5 block truncate text-xs text-[var(--jobs-muted)]">
                      {candidate.courseLabels.join(" · ")}
                    </span>
                  ) : null}
                </span>
              </label>
              <LearnVerifiedBadge size="sm" label={copy.badgeLabel} ariaLabel={copy.badgeAria} />
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 rounded-2xl border border-[var(--jobs-line)] p-4">
        {jobs.length > 0 ? (
          <label className="block">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
              {copy.selectJobLabel}
            </span>
            <select
              value={jobSlug}
              onChange={(event) => setJobSlug(event.target.value)}
              className="jobs-input mt-2 w-full"
            >
              {jobs.map((job) => (
                <option key={job.slug} value={job.slug}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
            {copy.messageLabel}
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={copy.messagePlaceholder}
            className="jobs-textarea mt-2 min-h-24 w-full"
          />
        </label>

        <button
          type="button"
          onClick={invite}
          disabled={pending || selectedIds.length === 0 || !jobSlug}
          className="jobs-button-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {copy.bulkCta}
        </button>

        {notice ? (
          <p className="text-xs font-medium text-[var(--jobs-success)]">{notice}</p>
        ) : null}
        {error ? (
          <p className="text-xs font-medium text-[var(--jobs-danger)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
