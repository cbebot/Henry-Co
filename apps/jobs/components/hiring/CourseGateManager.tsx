"use client";

import { useState } from "react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";

/**
 * V3-56 S3a — employer course-gate manager.
 *
 * Lets an employer require (hard) or prefer (soft) a verified Henry Onyx Learn
 * course on one posting. Add → POST /api/jobs/course-gates; remove → DELETE.
 * Both routes are sensitive (V3-02) so every call goes through
 * fetchWithSensitiveAction with a serialised body + an Idempotency-Key. All copy
 * is passed in already-translated — no user-facing literals here.
 */

export type CourseGateItem = {
  id: string;
  courseId: string;
  courseSlug: string | null;
  courseLabel: string | null;
  required: boolean;
};

export type GatableCourseItem = {
  id: string;
  slug: string | null;
  title: string;
};

export type CourseGateManagerCopy = {
  addCta: string;
  removeCta: string;
  empty: string;
  requiredOption: string;
  preferredOption: string;
};

export function CourseGateManager({
  jobSlug,
  employerSlug,
  initialGates,
  courses,
  copy,
}: {
  jobSlug: string;
  employerSlug: string;
  initialGates: CourseGateItem[];
  courses: GatableCourseItem[];
  copy: CourseGateManagerCopy;
}) {
  const [gates, setGates] = useState<CourseGateItem[]>(initialGates);
  const gatedCourseIds = new Set(gates.map((gate) => gate.courseId));
  const available = courses.filter((course) => !gatedCourseIds.has(course.id));

  const [courseId, setCourseId] = useState<string>("");
  const [required, setRequired] = useState<boolean>(true);
  const [pending, setPending] = useState<boolean>(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addGate() {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetchWithSensitiveAction("/api/jobs/course-gates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `gate-add-${jobSlug}-${course.id}-${required ? "req" : "pref"}`,
        },
        body: JSON.stringify({
          jobSlug,
          employerSlug,
          courseId: course.id,
          courseSlug: course.slug,
          courseLabel: course.title,
          required,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        gate?: { id?: string };
        message?: string;
      };
      if (!res.ok || !data.gate?.id) {
        setError(data.message ?? null);
        return;
      }
      setGates((prev) => [
        ...prev,
        {
          id: data.gate!.id!,
          courseId: course.id,
          courseSlug: course.slug,
          courseLabel: course.title,
          required,
        },
      ]);
      setCourseId("");
    } catch {
      setError(null);
    } finally {
      setPending(false);
    }
  }

  async function removeGate(id: string) {
    setRemoving(id);
    setError(null);
    try {
      const res = await fetchWithSensitiveAction("/api/jobs/course-gates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `gate-remove-${id}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? null);
        return;
      }
      setGates((prev) => prev.filter((gate) => gate.id !== id));
    } catch {
      setError(null);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      {gates.length === 0 ? (
        <p className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-sm text-[var(--jobs-muted)]">
          {copy.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {gates.map((gate) => (
            <li
              key={gate.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--jobs-paper-soft)] p-4"
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--jobs-ink)]">
                  {gate.courseLabel || gate.courseSlug || gate.courseId}
                </span>
                <span className="mt-1 inline-flex rounded-full bg-teal-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/25 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-400/30">
                  {gate.required ? copy.requiredOption : copy.preferredOption}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeGate(gate.id)}
                disabled={removing === gate.id}
                className="shrink-0 rounded-full bg-[var(--jobs-danger-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--jobs-danger)] transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {copy.removeCta}
              </button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="jobs-input sm:flex-1"
            aria-label={copy.addCta}
          >
            <option value="" />
            {available.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={required ? "required" : "preferred"}
            onChange={(event) => setRequired(event.target.value === "required")}
            className="jobs-input sm:w-48"
            aria-label={copy.requiredOption}
          >
            <option value="required">{copy.requiredOption}</option>
            <option value="preferred">{copy.preferredOption}</option>
          </select>
          <button
            type="button"
            onClick={addGate}
            disabled={pending || !courseId}
            className="jobs-button-primary inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {copy.addCta}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-[var(--jobs-danger)]">{error}</p>
      ) : null}
    </div>
  );
}
