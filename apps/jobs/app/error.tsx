"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="jobs-page px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2.6rem] border border-[var(--jobs-line)] bg-[var(--jobs-paper)] p-8 shadow-[0_30px_90px_rgba(7,26,28,0.08)] sm:p-10">
        <p className="jobs-kicker">Something went wrong</p>
        <h1 className="mt-4 jobs-heading">This page didn't load correctly.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--jobs-muted)]">
          An unexpected error occurred. You can try reloading the page, or head back to the jobs board.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="jobs-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Reload this route
          </button>
          <Link href="/jobs" className="jobs-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
