"use client";

import type { OwnerFormState } from "@/lib/owner-form-state";

export function OwnerFormFeedback({ state }: { state: OwnerFormState }) {
  if (state.ok === null && !state.message) return null;

  const tone =
    state.ok === true
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
      : state.ok === false
        ? "border-red-500/35 bg-red-500/10 text-red-950 dark:text-red-100"
        : "border-[var(--acct-line)] bg-[var(--acct-bg-soft)] text-[var(--acct-muted)]";

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-3 py-2 text-sm ${tone}`}
    >
      {state.message}
    </p>
  );
}
