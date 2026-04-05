"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("HenryCo account route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="acct-card mx-auto max-w-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-red-soft)] text-[var(--acct-red)]">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="acct-kicker">Account runtime</p>
          <h1 className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
            This account surface hit a client or rendering fault
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--acct-muted)]">
            The failure has been captured for investigation. Reload this surface and continue from the last stable state.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={reset} className="acct-button-primary rounded-2xl">
              Reload this view
            </button>
            <Link href="/support" className="acct-button-secondary rounded-2xl">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
