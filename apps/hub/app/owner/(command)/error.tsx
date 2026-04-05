"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OwnerCommandError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[owner-route-error]", error.digest || "", error.message);
  }, [error]);

  return (
    <div className="acct-fade-in mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-6 px-4 py-16 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">Command center</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--acct-ink)]">This view could not load safely</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--acct-muted)]">
          Something failed while rendering owner data. Your session is still protected — retry, return to the overview, or
          contact engineering if the problem persists. Raw system details are not shown here.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="acct-button-primary">
          Try again
        </button>
        <Link href="/owner" className="acct-button-secondary">
          Executive overview
        </Link>
      </div>
    </div>
  );
}
