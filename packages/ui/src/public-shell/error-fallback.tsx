"use client";

import { useEffect } from "react";

/**
 * Generic premium error boundary used across all HenryCo apps.
 * Render from each app's `app/error.tsx` so failures get a calm,
 * branded fallback instead of a stack trace.
 */
export function HenryCoErrorFallback({
  error,
  reset,
  division,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  division: string;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error(`[${division}/error-boundary]`, error);
    }
  }, [error, division]);

  return (
    <main
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-5 py-16 sm:px-8"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/50">
        Something didn&rsquo;t load
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        We hit a snag rendering this page.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-white/70">
        Your data is safe. Try again — and if it persists, contact support and
        share the reference below so we can trace it quickly.
      </p>
      {error.digest ? (
        <p className="mt-3 inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
        >
          Go to homepage
        </a>
      </div>
    </main>
  );
}

export function HenryCoNotFound({
  division,
  homeHref = "/",
}: {
  division: string;
  homeHref?: string;
}) {
  void division;
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-5 py-16 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/50">
        404 · Not found
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        That page isn&rsquo;t here.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-white/70">
        It may have moved, been renamed, or never existed. Use the link below
        to get back on track.
      </p>
      <div className="mt-7">
        <a
          href={homeHref}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
        >
          Go to homepage
        </a>
      </div>
    </main>
  );
}
