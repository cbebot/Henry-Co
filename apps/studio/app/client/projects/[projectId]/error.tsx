"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCcw, AlertCircle } from "lucide-react";

/**
 * Local error boundary for /client/projects/[projectId].
 *
 * Without this, a render error in any tab (overview / progress / files /
 * messages / payments) bubbles to the studio app's global error.tsx and
 * the user lands on the generic "failed to render page" surface with no
 * context about where they were.
 *
 * Catching at this scope keeps the chrome (sidebar, mobile-header, etc.)
 * intact and gives the visitor a real recovery path: retry, or jump
 * back to the projects list.
 */
export default function ClientProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/client/projects"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      <section className="portal-card-elev space-y-5 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,184,184,0.06)] text-[#ffb8b8]">
            <AlertCircle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#ffb8b8]">
              We couldn&apos;t load this project
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-[var(--studio-ink)] sm:text-2xl">
              Something interrupted the render
            </h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
              The page hit an unexpected error while putting your project workspace together.
              The team has the error reference; usually a retry clears it. If it persists, open
              a support thread from the Studio support page and we will pick it up.
            </p>
            {error.digest ? (
              <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                Reference {error.digest}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="portal-button portal-button-primary"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/client/projects" className="portal-button portal-button-secondary">
            Back to projects
          </Link>
          <Link href="/support" className="portal-button portal-button-ghost">
            Open a support thread
          </Link>
        </div>
      </section>
    </div>
  );
}
