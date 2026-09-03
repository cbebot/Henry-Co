"use client";

import type { OwnerFormState } from "@/lib/owner-form-state";

export function OwnerFormFeedback({ state }: { state: OwnerFormState }) {
  if (state.ok === null && !state.message) return null;

  const tone =
    state.ok === true
      ? "border-[color-mix(in_srgb,var(--acct-green)_35%,transparent)] bg-[var(--acct-green-soft)] text-[var(--acct-ink)]"
      : state.ok === false
        ? "border-[color-mix(in_srgb,var(--acct-red)_35%,transparent)] bg-[var(--acct-red-soft)] text-[var(--acct-ink)]"
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
