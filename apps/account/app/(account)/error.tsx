"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getAccountCopy, useHenryCoLocale } from "@henryco/i18n";
import { AlertTriangle } from "lucide-react";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useHenryCoLocale();
  const copy = getAccountCopy(locale);

  useEffect(() => {
    console.error("HenryCo account route error", {
      message: error.message,
      digest: error.digest,
    });
    // PASS 22 issue #4 — persist the digest server-side so support can
    // trace a ref id back to the underlying error message + stack. The
    // browser-only console.error path was an observability dead-end (the
    // user's "ref 3280500486" report had no server-side trail).
    try {
      void fetch("/api/runtime-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          surface: "account",
          digest: error.digest ?? null,
          message: error.message ?? null,
          stack: error.stack ?? null,
          path: typeof window !== "undefined" ? window.location.pathname : null,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          at: new Date().toISOString(),
        }),
      }).catch(() => {
        // best-effort — never let logging swallow a second error.
      });
    } catch {
      // noop
    }
  }, [error]);

  return (
    <div className="acct-card mx-auto max-w-2xl p-6 acct-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-red-soft)] text-[var(--acct-red)]">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="acct-kicker">{copy.errorBoundary.kicker}</p>
          <h1 className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
            {copy.errorBoundary.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
            {copy.errorBoundary.description}
          </p>
          {error.digest ? (
            <p className="mt-3 text-[11px] font-mono tracking-tight text-[var(--acct-muted)]">
              <span aria-hidden>↳ </span>
              ref&nbsp;
              <code className="rounded bg-[var(--acct-surface)] px-1.5 py-0.5 text-[var(--acct-ink)]">
                {error.digest}
              </code>
              <span className="ms-2 opacity-70">(share with support)</span>
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={reset} className="acct-button-primary rounded-2xl">
              {copy.errorBoundary.reload}
            </button>
            <Link href="/support" className="acct-button-secondary rounded-2xl">
              {copy.errorBoundary.contactSupport}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
