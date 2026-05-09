"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { WorkspaceLinkButton, WorkspaceButton } from "./primitives";

export type WorkspaceErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Where the "back" link goes — typically the parent listing surface. */
  backHref: string;
  /** Label for the back link (eg. "All projects", "Applications"). */
  backLabel?: string;
  /** Optional support route for users to escalate. */
  supportHref?: string;
  /** Custom title for the error card. Sensible default if omitted. */
  title?: string;
  /** Custom body copy. Sensible default if omitted. */
  body?: string;
};

/**
 * Drop-in `error.tsx` body for any workspace surface. Hosts use it like:
 *
 *   "use client";
 *   import { WorkspaceErrorBoundary } from "@henryco/workspace-shell";
 *   export default function Error(props) {
 *     return <WorkspaceErrorBoundary {...props} backHref="/candidate/applications" />;
 *   }
 *
 * Keeps the chrome intact (the parent layout's shell still renders),
 * surfaces an actionable digest, and offers retry / parent / support
 * recovery paths.
 */
export function WorkspaceErrorBoundary({
  error,
  reset,
  backHref,
  backLabel = "Back",
  supportHref,
  title = "Something interrupted the render",
  body = "The page hit an unexpected error while putting things together. The team has the error reference; usually a retry clears it.",
}: WorkspaceErrorBoundaryProps) {
  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--ws-ink-soft)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <section className="ws-card-elev p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{
              border: "1px solid var(--ws-line-strong)",
              background: "var(--ws-danger-soft)",
              color: "var(--ws-danger)",
            }}
            aria-hidden
          >
            <AlertCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--ws-danger)" }}
            >
              We couldn&apos;t load this surface
            </div>
            <h1
              className="mt-1 text-xl font-semibold tracking-[-0.01em] sm:text-2xl"
              style={{ color: "var(--ws-ink)" }}
            >
              {title}
            </h1>
            <p
              className="mt-2 max-w-xl text-[13.5px] leading-6"
              style={{ color: "var(--ws-ink-soft)" }}
            >
              {body}
            </p>
            {error.digest ? (
              <p
                className="mt-3 text-[11px] font-mono uppercase tracking-[0.16em]"
                style={{ color: "var(--ws-ink-soft)" }}
              >
                Reference {error.digest}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <WorkspaceButton onClick={reset}>
            <RefreshCcw className="h-4 w-4" />
            Try again
          </WorkspaceButton>
          <WorkspaceLinkButton variant="secondary" href={backHref}>
            {backLabel}
          </WorkspaceLinkButton>
          {supportHref ? (
            <WorkspaceLinkButton variant="ghost" href={supportHref}>
              Open a support thread
            </WorkspaceLinkButton>
          ) : null}
        </div>
      </section>
    </div>
  );
}
