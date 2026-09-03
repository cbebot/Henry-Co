"use client";

import { useState } from "react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";

/**
 * V3-56 — learner career-visibility toggles (S4). Consent-first: a toggle is the
 * opt-in/opt-out act. All copy is passed in already-translated (no literals).
 * Each change goes through fetchWithSensitiveAction (V3-02 reauth) → the learn
 * candidate-optin route.
 */

export type CareerVisibilityItem = {
  courseId: string;
  title: string;
  slug: string | null;
  listed: boolean;
};

export type CareerVisibilityCopy = {
  listLabel: string; // contains {course}
  unlistLabel: string; // contains {course}
  consentNote: string;
  listedStatus: string;
  notListedStatus: string;
};

function fill(template: string, course: string): string {
  return template.replace("{course}", course);
}

export function CareerVisibilityClient({
  items,
  copy,
}: {
  items: CareerVisibilityItem[];
  copy: CareerVisibilityCopy;
}) {
  const [state, setState] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map((i) => [i.courseId, i.listed])),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(item: CareerVisibilityItem) {
    const currentlyListed = state[item.courseId] ?? false;
    const action = currentlyListed ? "opt_out" : "opt_in";
    setPending(item.courseId);
    setError(null);
    try {
      const res = await fetchWithSensitiveAction("/api/learn/candidate-optin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `optin-${item.courseId}-${action}` },
        body: JSON.stringify({ courseId: item.courseId, courseSlug: item.slug, action }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; listed?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Couldn't update your visibility. Try again.");
        return;
      }
      setState((prev) => ({ ...prev, [item.courseId]: Boolean(data.listed) }));
    } catch {
      setError("Couldn't update your visibility. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const listed = state[item.courseId] ?? false;
        const busy = pending === item.courseId;
        return (
          <div
            key={item.courseId}
            className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--site-ink,#1a1a1a)]">{item.title}</p>
              <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">
                {listed ? copy.listedStatus : copy.notListedStatus}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(item)}
              disabled={busy}
              aria-pressed={listed}
              className={[
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                listed
                  ? "bg-teal-600/12 text-teal-800 ring-1 ring-inset ring-teal-600/25 dark:text-teal-200"
                  : "bg-black/[0.06] text-black/70 ring-1 ring-inset ring-black/10 dark:bg-white/10 dark:text-white/80 dark:ring-white/15",
              ].join(" ")}
            >
              {fill(listed ? copy.unlistLabel : copy.listLabel, item.title)}
            </button>
          </div>
        );
      })}
      <p className="mt-1 text-xs leading-relaxed text-black/55 dark:text-white/55">{copy.consentNote}</p>
      {error ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
