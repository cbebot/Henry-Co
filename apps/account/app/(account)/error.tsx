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
  }, [error]);

  return (
    <div className="acct-card mx-auto max-w-2xl p-6">
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
