"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="staff-fade-in flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--staff-critical-soft)]">
        <AlertTriangle className="h-8 w-8 text-[var(--staff-critical)]" />
      </div>
      <h2 className="text-xl font-bold text-[var(--staff-ink)]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--staff-muted)]">
        An unexpected error occurred while loading this page. This has been logged for investigation.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-[var(--staff-muted)]">
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--staff-gold)] px-5 py-2.5 text-sm font-semibold text-[var(--staff-bg)] transition-all hover:brightness-110"
      >
        <RotateCcw size={16} />
        Try again
      </button>
    </div>
  );
}
