"use client";

/**
 * AssignmentSubmission — file upload + free-text submission.
 *
 * V3 PASS 21 contract:
 *   • Accept file up to 50 MB
 *   • Reject oversized client-side; final validation server-side
 *   • Preview file metadata on selection (label, size, mime)
 *   • Free-text textarea alongside file (assignment can require either/both)
 *   • Status surface for graded/feedback after submission
 */

import { useState } from "react";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";

export type AssignmentSubmissionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => any;
  assignmentId: string;
  courseId?: string | null;
  /** Existing submission (if any) for read-back. */
  existing?: {
    submissionText: string;
    fileLabel: string | null;
    fileUrl: string | null;
    status: string;
    submittedAt: string;
  } | null;
  /** Existing grade (if instructor has reviewed). */
  grade?: {
    score: number;
    passed: boolean;
    feedback: string;
    gradedAt: string;
  } | null;
  /** Localized labels */
  labels: {
    title: string;
    description: string;
    fileLabel: string;
    fileHint: string;
    textLabel: string;
    textPlaceholder: string;
    submit: string;
    submitting: string;
    resubmit: string;
    submittedAt: string;
    gradedAt: string;
    score: string;
    feedback: string;
    fileTooLarge: string;
    pendingReview: string;
    passed: string;
    needsRevision: string;
  };
  /** Max file size in bytes (default 50 MB). */
  maxFileSizeBytes?: number;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(units.length - 1, Math.floor(Math.log10(bytes) / 3));
  return `${(bytes / 1000 ** exp).toFixed(1)} ${units[exp]}`;
}

function formatLocalDateTime(value: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export function AssignmentSubmission({
  action,
  assignmentId,
  courseId,
  existing,
  grade,
  labels,
  maxFileSizeBytes = 50 * 1024 * 1024,
}: AssignmentSubmissionProps) {
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileMeta(null);
      setFileError(null);
      return;
    }
    if (file.size > maxFileSizeBytes) {
      setFileError(labels.fileTooLarge);
      setFileMeta(null);
      event.target.value = "";
      return;
    }
    setFileError(null);
    setFileMeta({ name: file.name, size: file.size, type: file.type });
  };

  return (
    <section
      className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/5 p-6"
      aria-label={labels.title}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-copper)]">
        {labels.title}
      </p>
      <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{labels.description}</p>

      {existing ? (
        <div className="mt-5 rounded-[1.2rem] border border-[var(--learn-line)] bg-black/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
            {labels.submittedAt}: {formatLocalDateTime(existing.submittedAt)}
          </p>
          {existing.submissionText ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--learn-ink)]">
              {existing.submissionText}
            </p>
          ) : null}
          {existing.fileUrl && existing.fileLabel ? (
            <a
              href={existing.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-[var(--learn-copper)] underline"
            >
              {existing.fileLabel}
            </a>
          ) : null}
          {grade ? (
            <div className="mt-3 border-t border-[var(--learn-line)] pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
                {labels.gradedAt}: {formatLocalDateTime(grade.gradedAt)}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--learn-ink)]">
                {labels.score}: {grade.score}/100{" "}
                <span className={grade.passed ? "text-emerald-200" : "text-amber-200"}>
                  ({grade.passed ? labels.passed : labels.needsRevision})
                </span>
              </p>
              {grade.feedback ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--learn-ink-soft)]">
                  {grade.feedback}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              {labels.pendingReview}
            </p>
          )}
        </div>
      ) : null}

      <form action={action} className="mt-5 space-y-4" encType="multipart/form-data">
        <input type="hidden" name="assignmentId" value={assignmentId} />
        {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}

        <div>
          <label htmlFor="assignment-text" className="block text-sm font-semibold text-[var(--learn-ink)]">
            {labels.textLabel}
          </label>
          <textarea
            id="assignment-text"
            name="submissionText"
            rows={5}
            defaultValue={existing?.submissionText ?? ""}
            placeholder={labels.textPlaceholder}
            className="mt-2 w-full rounded-2xl border border-[var(--learn-line)] bg-transparent px-4 py-3 text-[var(--learn-ink)]"
          />
        </div>

        <div>
          <label htmlFor="assignment-file" className="block text-sm font-semibold text-[var(--learn-ink)]">
            {labels.fileLabel}
          </label>
          <input
            id="assignment-file"
            name="file"
            type="file"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm text-[var(--learn-ink-soft)]"
          />
          <p className="mt-1 text-xs text-[var(--learn-ink-soft)]">{labels.fileHint}</p>
          {fileMeta ? (
            <p className="mt-1 text-xs text-[var(--learn-ink)]">
              {fileMeta.name} · {formatBytes(fileMeta.size)} · {fileMeta.type || "file"}
            </p>
          ) : null}
          {fileError ? (
            <p className="mt-1 text-xs font-semibold text-amber-200" role="alert">
              {fileError}
            </p>
          ) : null}
        </div>

        <PendingSubmitButton pendingLabel={labels.submitting}>
          {existing ? labels.resubmit : labels.submit}
        </PendingSubmitButton>
      </form>
    </section>
  );
}
