"use client";

import { useEffect } from "react";

// ─── Copy types ───────────────────────────────────────────────────────────────

export type ErrorFallbackCopy = {
  /** Eyebrow label above the heading (e.g. "Something didn't load"). */
  eyebrow: string;
  /** Main heading. */
  heading: string;
  /** Body paragraph. */
  body: string;
  /** Try again button label. */
  retryLabel: string;
  /** Homepage link label. */
  homeLabel: string;
};

export type NotFoundCopy = {
  /** Eyebrow label (e.g. "404 · Not found"). */
  eyebrow: string;
  /** Main heading. */
  heading: string;
  /** Body paragraph. */
  body: string;
  /** Homepage link label. */
  homeLabel: string;
};

const DEFAULT_ERROR_COPY: ErrorFallbackCopy = {
  eyebrow: "Something didn’t load",
  heading: "This page failed to render.",
  body: "Your data is safe. Try again — and if the issue persists, share the reference below with support so it can be traced quickly.",
  retryLabel: "Try again",
  homeLabel: "Go to homepage",
};

const DEFAULT_NOT_FOUND_COPY: NotFoundCopy = {
  eyebrow: "404 · Not found",
  heading: "That page isn’t here.",
  body: "It may have moved, been renamed, or never existed. Use the link below to get back on track.",
  homeLabel: "Go to homepage",
};

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * Generic premium error boundary used across all HenryCo apps.
 * Render from each app's `app/error.tsx` so failures get a calm,
 * branded fallback instead of a stack trace.
 *
 * Pass `copy={getErrorFallbackCopy(locale)}` (or a subset) to translate.
 * Falls back to English when `copy` is omitted.
 */
export function HenryCoErrorFallback({
  error,
  reset,
  division,
  copy = DEFAULT_ERROR_COPY,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  division: string;
  copy?: ErrorFallbackCopy;
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
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        {copy.heading}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-white/70">
        {copy.body}
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
          {copy.retryLabel}
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
        >
          {copy.homeLabel}
        </a>
      </div>
    </main>
  );
}

export function HenryCoNotFound({
  division,
  homeHref = "/",
  copy = DEFAULT_NOT_FOUND_COPY,
}: {
  division: string;
  homeHref?: string;
  copy?: NotFoundCopy;
}) {
  void division;
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-5 py-16 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/50">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        {copy.heading}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 dark:text-white/70">
        {copy.body}
      </p>
      <div className="mt-7">
        <a
          href={homeHref}
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
        >
          {copy.homeLabel}
        </a>
      </div>
    </main>
  );
}
