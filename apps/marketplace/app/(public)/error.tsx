"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MarketplacePublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[marketplace]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--market-muted)]">
          Marketplace
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--market-paper-white)]">
          Something went wrong on this page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--market-muted)]">
          You can retry safely. Your cart and account session are unchanged. If this keeps happening, open
          Support from the header.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="market-button-primary rounded-full px-6 py-3 text-sm font-semibold"
        >
          Try again
        </button>
        <Link href="/" className="market-button-secondary rounded-full px-6 py-3 text-sm font-semibold">
          Home
        </Link>
      </div>
    </div>
  );
}
