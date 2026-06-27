"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";

/**
 * V3 PASS 21 — Candidate <ProfileBuilder> with auto-save (J3).
 *
 * Persists to /api/candidate/profile/draft every 30s and on blur. Reload
 * fetches the stored draft so work-in-progress restores. The official
 * "Save profile" submit still routes through the existing
 * saveCandidateProfileAction (formData) — this component is the
 * incremental draft layer beneath that, not a replacement.
 *
 * Shape is intentionally minimal — fields can grow as the
 * candidate-profile spec stabilizes. The draft JSON is treated as an
 * opaque blob by the server.
 */

type Basics = {
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  phone?: string;
  email?: string;
};

type ExperienceEntry = {
  id: string;
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};

type EducationEntry = {
  id: string;
  institution?: string;
  credential?: string;
  startDate?: string;
  endDate?: string;
};

export type ProfileBuilderDraft = {
  basics?: Basics;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: string[];
  portfolio?: Array<{ label: string; url: string }>;
};

type ProfileBuilderProps = {
  initialDraft?: ProfileBuilderDraft | null;
  labels: {
    sectionBasics: string;
    sectionExperience: string;
    sectionEducation: string;
    sectionSkills: string;
    sectionPortfolio: string;
    fullName: string;
    headline: string;
    summary: string;
    location: string;
    phone: string;
    email: string;
    saving: string;
    savedAt: string;
    autosaveHint: string;
    saveError: string;
  };
};

const AUTOSAVE_INTERVAL_MS = 30_000;

function makeId() {
  return Math.random().toString(36).slice(2, 11);
}

export function ProfileBuilder({
  initialDraft,
  labels,
}: ProfileBuilderProps) {
  const locale = useHenryCoLocale();
  const builderCopy = getJobsCandidateSurfaceCopy(locale).profileBuilder;
  const [draft, setDraft] = useState<ProfileBuilderDraft>(() => ({
    basics: initialDraft?.basics ?? {},
    experience: initialDraft?.experience ?? [],
    education: initialDraft?.education ?? [],
    skills: initialDraft?.skills ?? [],
    portfolio: initialDraft?.portfolio ?? [],
  }));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lastSavedRef = useRef<string>(JSON.stringify(initialDraft ?? {}));

  // 30s auto-save loop. Only fires when the draft has changed since
  // the last persisted snapshot to avoid pointless round-trips.
  useEffect(() => {
    const interval = setInterval(() => {
      const next = JSON.stringify(draft);
      if (next === lastSavedRef.current) return;
      void persist(draft);
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  async function persist(value: ProfileBuilderDraft) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/candidate/profile/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          setError(body.message || labels.saveError);
          return;
        }
        lastSavedRef.current = JSON.stringify(value);
        setSavedAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        console.error("[ProfileBuilder] save failed:", err);
        setError(labels.saveError);
      }
    });
  }

  function handleBlur() {
    if (JSON.stringify(draft) !== lastSavedRef.current) {
      void persist(draft);
    }
  }

  function updateBasics(patch: Partial<Basics>) {
    setDraft((prev) => ({ ...prev, basics: { ...(prev.basics ?? {}), ...patch } }));
  }

  function addExperience() {
    setDraft((prev) => ({
      ...prev,
      experience: [
        { id: makeId() },
        ...(prev.experience ?? []),
      ],
    }));
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setDraft((prev) => ({
      ...prev,
      experience: (prev.experience ?? []).map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function removeExperience(id: string) {
    setDraft((prev) => ({
      ...prev,
      experience: (prev.experience ?? []).filter((entry) => entry.id !== id),
    }));
  }

  return (
    <div
      className="space-y-4"
      onBlur={handleBlur}
      data-saving={isPending ? "true" : undefined}
    >
      <header className="flex items-center justify-between text-xs text-[var(--jobs-muted)]">
        <span>
          {isPending
            ? labels.saving
            : savedAt
              ? `${labels.savedAt} ${new Date(savedAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : labels.autosaveHint}
        </span>
        {error ? (
          <span className="text-[var(--jobs-danger,#a00)]">{error}</span>
        ) : null}
      </header>

      <section className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-4">
        <div className="jobs-kicker">{labels.sectionBasics}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">
            {labels.fullName}
            <input
              type="text"
              value={draft.basics?.fullName ?? ""}
              onChange={(e) => updateBasics({ fullName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium">
            {labels.headline}
            <input
              type="text"
              value={draft.basics?.headline ?? ""}
              onChange={(e) => updateBasics({ headline: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            {labels.summary}
            <textarea
              rows={4}
              value={draft.basics?.summary ?? ""}
              onChange={(e) => updateBasics({ summary: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium">
            {labels.location}
            <input
              type="text"
              value={draft.basics?.location ?? ""}
              onChange={(e) => updateBasics({ location: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium">
            {labels.phone}
            <input
              type="tel"
              value={draft.basics?.phone ?? ""}
              onChange={(e) => updateBasics({ phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-4">
        <div className="flex items-center justify-between">
          <div className="jobs-kicker">{labels.sectionExperience}</div>
          <button
            type="button"
            onClick={addExperience}
            className="rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-accent)]"
          >
            {builderCopy.addButton}
          </button>
        </div>
        <ol className="mt-3 space-y-3">
          {(draft.experience ?? []).map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-[var(--jobs-line)] bg-white p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder={builderCopy.rolePlaceholder}
                  value={entry.role ?? ""}
                  onChange={(e) =>
                    updateExperience(entry.id, { role: e.target.value })
                  }
                  className="rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder={builderCopy.companyPlaceholder}
                  value={entry.company ?? ""}
                  onChange={(e) =>
                    updateExperience(entry.id, { company: e.target.value })
                  }
                  className="rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <textarea
                rows={3}
                placeholder={builderCopy.descriptionPlaceholder}
                value={entry.description ?? ""}
                onChange={(e) =>
                  updateExperience(entry.id, { description: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeExperience(entry.id)}
                className="mt-2 text-xs font-semibold text-[var(--jobs-muted)] hover:text-red-600"
              >
                {builderCopy.removeButton}
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* Skills section — chips view. */}
      <section className="rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] p-4">
        <div className="jobs-kicker">{labels.sectionSkills}</div>
        <input
          type="text"
          placeholder={builderCopy.skillPlaceholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const value = event.currentTarget.value.trim();
              if (!value) return;
              event.preventDefault();
              setDraft((prev) => ({
                ...prev,
                skills: Array.from(
                  new Set([...(prev.skills ?? []), value]),
                ),
              }));
              event.currentTarget.value = "";
            }
          }}
          className="mt-2 w-full rounded-lg border border-[var(--jobs-line)] bg-white px-2 py-1.5 text-sm"
        />
        <ul className="mt-3 flex flex-wrap gap-2">
          {(draft.skills ?? []).map((skill) => (
            <li key={skill}>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    skills: (prev.skills ?? []).filter((s) => s !== skill),
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full bg-[var(--jobs-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--jobs-accent)]"
              >
                <span>{skill}</span>
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
